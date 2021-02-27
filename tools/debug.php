<?php

define("DEBUG", ((php_sapi_name() == 'cli-server') || in_array($_SERVER[ "REMOTE_ADDR" ], ["127.0.0.1", "77.53.224.247", "192.168.0.18", "::1"])));

if (DEBUG) {
  ini_set("display_errors", 1);
  ini_set("display_startup_errors", 1);
  error_reporting(E_ALL | E_STRICT);
}

function d($mixed) {
  error_log(var_export($mixed, 1));
}

?>
