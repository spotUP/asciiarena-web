<?php
	define("VALID", true);
	define("BASEDIR", __DIR__);
	define("DEBUG", (in_array($_SERVER[ "REMOTE_ADDR" ], ["127.0.0.1", "77.53.224.247", "::1"])));
	if (DEBUG) {
		ini_set("display_errors", 1);
		ini_set("display_startup_errors", 1);
		error_reporting(E_ALL | E_STRICT);
	}
	if (session_status() === PHP_SESSION_NONE) {
		session_start();
	}
	$_user = $_SESSION[ "_user" ] ?? [
			"id" => 0,
			"nick" => "Anonymous",
			"crew" => "Independent",
			"rank" => "Inactive",
			"settings" => []
		];
	require_once "tools/db.php";
	require_once "tools/users.php";
	require_once "tools/widgets.php";
	require_once "functions.php";
	$_ip = getenv("REMOTE_ADDR") ?? "";
	$_path = getenv("PATH_INFO") ?? "";
	$_current = [];
	if (!empty($_path)) {
		$_current = array_filter(explode("/", trim($_path, "/")));
	}
	if (!defined("NO_PING") && valid_current()) {
		if (is_logged_in()) {
			doQuery("UPDATE users SET lastactive = UNIX_TIMESTAMP(), current = :current WHERE id = :id", [
				":id" => $_user[ "id" ],
				":current" => $_SERVER[ "REQUEST_URI" ] ?? ""
			]);
		} else {
			doQuery("INSERT INTO users_online VALUES(NULL, UNIX_TIMESTAMP(), :session, :current)", [
				":session" => session_id(),
				":current" => $_SERVER[ "REQUEST_URI" ] ?? ""
			]);
		}
		doQuery("DELETE FROM users_online WHERE timestamp < (UNIX_TIMESTAMP()-300);");
	}
