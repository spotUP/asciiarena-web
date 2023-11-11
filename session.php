<?php
	require_once "tools/debug.php";
	define("VALID", true);
	define("BASEDIR", __DIR__);
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

	$mailroot = @$env['MAILROOT'] ?: '';
	$mailhost   = @$env['MAILHOST']   ?: '';
	$mailuser = @$env['MAILUSER'] ?: '';
	$mailpass = @$env['MAILPASS'] ?: '';
	$mailport = @$env['MAILPORT'] ?: '';

	if (!is_logged_in() && isset($_COOKIE['aarm']) && preg_match('/^(\w+):(\w+)$/', $_COOKIE['aarm'], $m)) {
		list(, $selector, $token) = $m;
		$v = fetchOne("SELECT user_id,hash FROM auth WHERE selector=:selector AND expiration > NOW()", [ 'selector' => $selector ] );
		if ($v) {
			if (hash_equals($v->hash, hash('sha256', $token.$remember_salt))) {
				$login = fetchOne("SELECT id,nick,crew,`rank`,crt_effect FROM users WHERE id=:id", [ ":id" => $v->user_id ] );
                                $_user = $_SESSION[ "_user" ] = [
                                        "id" => $login->id,
                                        "nick" => $login->nick,
                                        "crew" => $login->crew,
                                        "rank" => $login->rank,
                                        "settings" => [
                                                "crt_effect" => $login->crt_effect,
                                        ]
                                ];
                                doQuery("INSERT INTO lastusers (nick, crew, user_id, timestamp) VALUES (:nick, :crew, {$login->id}, UNIX_TIMESTAMP())", [
                                        ":nick" => $_user[ "nick" ],
                                        ":crew" => $_user[ "crew" ]
                                ]);
				doQuery("UPDATE users SET lastactive = UNIX_TIMESTAMP() WHERE id = {$login->id}");
			}
		}

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
