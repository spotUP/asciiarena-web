#!/usr/bin/env perl

use strict;
use warnings;

use Test::More;

use lib 't/lib';
use AsciiArena;

my $nick = 'testnick';
my $pw   = 'testpassword';
my $mail = 'test@example.com';
my $spam = 'iamnotarobot';

my $t = AsciiArena->new;

subtest 'Register' => sub {

  $t->post_ok("/register.php" => form => {
      nick            => $nick,
      password        => $pw,
      repeat_password => $pw,
      not_mail        => $mail,
      spam            => $spam,
  });

  $t->content_like(qr/Error! You must enter a valid E-Mail/, 'Got correct error message when not including email address');

  register($nick, $pw, $mail);

  $t->content_like(qr/Your account has been created, a mail with instructions|This nick is already in use/, 'Create account, accept that it might be already created');

  register($nick, $pw, $mail);

  $t->content_like(qr/This nick is already in use/, 'Correct error message if already created');

};

subtest 'Delete message' => sub {
  login_ok($nick, $pw);
  my $message_line = create_message_ok($nick, 'testsubject', 'testmessage');
  my $thread = $message_line->at('input[name=thread]')->attr('value');
  my $messid = $message_line->at('input[name=messid]')->attr('value');
  $t->post_ok('/messages.php', form => { deletemessage => 'Delete', thread => $thread, messid => $messid });
  $t->get_ok('/messages.php');
  my $message_ids = $t->tx->res->dom->find('input[name=messid]')->grep(sub { $_->attr('value') eq $messid });
  is $message_ids->size, 0, 'Should not find message anymore';
};

subtest 'Reply message' => sub {
  my $nick1 = 'user1';
  my $pw1   = 'userpw1';
  register($nick1, $pw1, $nick1 . '@example.com');
  login_ok($nick1, $pw1);
  logout_ok();

  my $nick2 = 'user2';
  my $pw2   = 'userpw2';
  register($nick2, $pw2, $nick2 . '@example.com');
  login_ok($nick2, $pw2);

  # send message from user2 to user1
  my $subject = 'testsubject';
  my $message_line = create_message_ok($nick1, $subject, 'testmessage');
  logout_ok();

  # find message
  login_ok($nick1, $pw1);
  $t->get_ok('/messages.php');
  $message_line = $t->tx->res->dom->find('form')->grep( sub { my $a = $_->at('span > a'); $a && ($a->text eq $subject) })->last;
  my $thread = $message_line->at('input[name=thread]')->attr('value');
  my $messid = $message_line->at('input[name=messid]')->attr('value');

  # post reply from user1 to user2
  $t->post_ok('/messages.php', form => { postreply => 'Read', thread => $thread, messid => $messid });
  my $form = $t->tx->res->dom->find('form')->grep(sub { $_->attr('action') eq 'messages.php?post' })->first;
  my %post_fields = map { $_->attr('name') => $_->attr('value') } @{ $form->find('textarea, input')->to_array() || [] };
  $post_fields{postmessage} = 'testreply';
  my $action = $form->attr('action');
  $action = '/' . $action unless $action =~ s{^/}{};
  $t->post_ok($action, form => { %post_fields }); 

  logout_ok();

  # read reply
  login_ok($nick2, $pw2);
  $t->get_ok('/messages.php');
  $message_line = $t->tx->res->dom->find('form')->grep( sub { my $a = $_->at('span > a'); $a && ($a->text eq $subject) })->last;
  my $thread = $message_line->at('input[name=thread]')->attr('value');
  my $messid = $message_line->at('input[name=messid]')->attr('value');
  $t->post_ok('/messages.php', form => { postreply => 'Read', thread => $thread, messid => $messid });

  ok($t->tx->res->dom('div.content pre')->grep(sub { $_->all_text =~ m{testreply} })->size, 'Found reply');
};

sub login_ok {
  my ($nick, $pw) = @_;
  $t->post_ok('/cmds.php?cmd=login', form => { nick => $nick, password => $pw });
  $t->status_is(302)->header_is('Location' => '/');
  $t->get_ok($t->tx->res->headers->header('Location'))->status_is(200);
  $t->element_exists_not('.nav-link[href=#login]', 'Should not be a login link when we are logged in');
}

sub logout_ok {
  $t->get_ok('/cmds.php?cmd=logout');
  $t->status_is(302)->header_is('Location' => '/');
  $t->get_ok($t->tx->res->headers->header('Location'))->status_is(200);
  $t->element_exists('.nav-link[href=#login]', 'Should be a login link when we are logged out');
}

sub create_message_ok {
  my ($to, $subject, $msg) = @_;

  my $messages_link = $t->tx->res->dom->find('a.dropdown-item')->grep(sub { $_->text =~ /mail/i })->first;
  $t->get_ok($messages_link->attr('href'));
  $t->post_ok('/messages.php?post' => form => { posttomember => $to, postsubject => $subject, postmessage => $msg, postnewmessage => 'Send Message!' })->status_is(200);
  $t->get_ok('/messages.php')->status_is(200);
  my $message_line = $t->tx->res->dom->find('form')->grep( sub { my $a = $_->at('span > a'); $a && ($a->text eq $subject) })->last;
  return $message_line;
}

sub register {
  my ($nick, $pw, $mail) = @_;
  $t->post_ok("/register.php" => form => {
      nick            => $nick,
      password        => $pw,
      repeat_password => $pw,
      mail            => $mail,
      spam            => $spam,
  });
}

done_testing;
