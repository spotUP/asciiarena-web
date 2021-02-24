#!/usr/bin/env perl

use strict;
use warnings;

use IPC::Run 'start';

use Test::More;
use Test::Mojo;

subtest 'Basic URLs' => sub {
  my $host_port = 'localhost:8122';
  my $server = 'http://' . $host_port;

  my ($in, $out, $err);

  my $h = start ['php',
    '-d', 'include_path=.',
    '-d', 'log_errors=1',
    '-d', 'error_reporting=-1',
    '-d', 'display_errors=stdout',
    '-S', $host_port ,
  ],
  \$in, \$out, \$err;
  while ($h->pump) {
    die $err if $err =~ /failed|error/i;
    last if $err =~ /$host_port/;
  }
  my $t = Test::Mojo->new;

  my $url_tests = [
    { path => 'accounting.php',           },
    { path => 'admin.php',                },
    { path => 'artists.php',              },
    { path => 'cmds.php',                 code => 302 },
    { path => 'collys.php',               },
    { path => 'crews.php',                },
    { path => 'crib.php',                 },
    { path => 'dialogues.php',            },
    { path => 'fonteditor.php',           },
    { path => 'index.php',                },
    { path => 'info_artist.php',          },
    { path => 'info_crew.php',            },
    { path => 'info_news.php',            },
    { path => 'info_release.php',         },
    { path => 'info_release_summary.php', },
    { path => 'logoeditor.php',           },
    { path => 'logout.php',               },
    { path => 'members.php',              code => 302 },
    { path => 'messages.php',             },
    { path => 'missing.php',              },
    { path => 'pagination.php',           },
    { path => 'register.php',             },
    { path => 'reminder.php',             },
    { path => 'rss.php?id=0',             },
    { path => 'rss.php?id=1',             },
    { path => 'session.php',              },
    { path => 'sidebar.php',              },
    { path => 'sidebar_right.php',        },
    { path => 'submit.php',               },
    { path => 'template.php',             },
    { path => 'worker.php',               },
  ];

  for my $test (@{ $url_tests }) {
    my $ok = $t->get_ok("$server/$test->{path}")->status_is($test->{code} // 200);
    warn $t->tx->res->body if ($ENV{AA_PATH} // '') eq $test->{path};
    $h->pump;
    note $out; undef $out;
    diag $err; undef $err;
  }

  $h->kill_kill;
};

done_testing;
