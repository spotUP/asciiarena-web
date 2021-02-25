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

#  $t->get_ok("/register.php")->status_is(200)->or(sub { shift->dump_output; });
  $t->post_ok("/register.php" => form => {
      nick            => $nick,
      password        => $pw,
      repeat_password => $pw,
      NOT_mail        => $mail,
      spam            => $spam,
  });
  $t->content_like(qr/Error! You must enter a valid E-Mail/, 'Got correct error message when not including email address');

  $t->post_ok("/register.php" => form => {
      nick            => $nick,
      password        => $pw,
      repeat_password => $pw,
      mail            => $mail,
      spam            => $spam,
  });

  $t->content_like(qr/Your account has been created, a mail with instructions|This nick is already in use/, 'Create account, accept that it might be already created');

  $t->post_ok("/register.php" => form => {
      nick            => $nick,
      password        => $pw,
      repeat_password => $pw,
      mail            => $mail,
      spam            => $spam,
  });

  $t->content_like(qr/This nick is already in use/, 'Correct error message if already created');

};

subtest 'Delete message' => sub {
  login_ok();
  my $message_line = create_message_ok($nick, 'testsubject', 'testmessage');
  my $thread = $message_line->at('input[name=thread]')->attr('value');
  my $messid = $message_line->at('input[name=messid]')->attr('value');
  $t->post_ok('/messages.php', form => { deletemessage => 'Delete', thread => $thread, messid => $messid });
  $t->get_ok('/messages.php');
  my $message_ids = $t->tx->res->dom->find('input[name=messid]')->grep(sub { $_->attr('value') eq $messid });
  is $message_ids->size, 0, 'Should not find message anymore';
};

sub login_ok {
  $t->post_ok('/cmds.php?cmd=login', form => { nick => $nick, password => $pw });
  $t->status_is(302)->header_is('Location' => '/');
  $t->get_ok($t->tx->res->headers->header('Location'))->status_is(200);
  $t->element_exists_not('.nav-link[href=#login]', 'Should not be a login link when we are logged in');
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

done_testing;
