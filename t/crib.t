#!/usr/bin/env perl

use strict;
use warnings;

use Test::More;

use lib 't/lib';
use AsciiArena;

my $nick = 'testuser';
my $pw   = 'testpassword';
my $mail = 'test@example.com';

my $t = AsciiArena->new;

system(qq{php -r 'include("tools/autoload.php"); User::register("$nick", "$pw", "$mail", "Admin");'});
$t->login_ok($nick, $pw);
$t->get_ok('/crib.php');

done_testing;
