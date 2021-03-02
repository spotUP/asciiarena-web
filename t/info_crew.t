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

subtest 'get_info_with_base64' => sub {
  $t->get_ok('/info_crew.php?crew=RGl2aW5lIFN0eWxlcnM=');
};

done_testing;
