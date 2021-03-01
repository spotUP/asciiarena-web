#!/usr/bin/env perl

use strict;
use warnings;

use Test::More;
use Test::Mojo;

use lib 't/lib';
use AsciiArena;

subtest 'Basic URLs' => sub {
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

  my $t = AsciiArena->new;

  for my $test (@{ $url_tests }) {
    my $ok = $t->get_ok("/$test->{path}")->status_is($test->{code} // 200);
  }

};

done_testing;
