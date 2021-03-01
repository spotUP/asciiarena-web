package AsciiArena;

use strict;
use warnings;

use base 'Test::Mojo';

use Test::More;

use IPC::Run 'start';
use IO::Socket::INET;

my $host = 'localhost';
# Get a random available port
my $sock = IO::Socket::INET->new( LocalAddr => $host, LocalPort => 0 );
my $port = $sock->sockport();
undef $sock;
my $host_port = "localhost:$port";
my $server = 'http://' . $host_port;

my ($h, $in, $out, $err);

sub new {
  $h = start ['php',
  '-d', 'include_path=.',
  '-d', 'log_errors=1',
  '-d', 'error_reporting=-1',
  '-d', 'display_errors=stdout',
  '-S', $host_port ,
], \$in, \$out, \$err;

  while ($h->pump) {
    die $err if $err =~ /failed|error/i;
    last if $err =~ /$host_port/;
  }
  shift->SUPER::new(@_);
}

sub _build_ok {
  my ($self, $method, $url) = (shift, shift, shift);
  $url = $server . $url;
  my $res = $self->SUPER::_build_ok($method, $url, @_);
  $self->dump_output;
  return $res;
}

sub dump_output {
  $h->pump;
  do { note $out; undef $out; } if $out;
  if ($err =~ m{error}i) {
    fail('Error thrown');
  }
  do { diag $err; undef $err; } if $err;
}

DESTROY {
  $h->kill_kill;
};

1;
