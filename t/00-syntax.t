#!/usr/bin/env perl

use strict;
use warnings;

use Path::Tiny;

use Test::More;
use Test::Mojo;

subtest 'Syntax check recursively' => sub {
  my $iter = Path::Tiny->new('.')->iterator({ recurse => 1 });
  while ( my $path = $iter->() ) {
    next unless $path =~ m{\.php$};
    like `php -l $path`, qr{No syntax error}, "Syntax ok for '$path'";
  }
};

done_testing;
