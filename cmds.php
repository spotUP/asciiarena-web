<?php
	define("NO_PING", true);
	require_once "session.php";

	$cmd = $_GET[ "cmd" ] ?? $_current[ 0 ] ?? "";
	$reDir = "/";

	$is_ajax = ($_SERVER[ "HTTP_X_REQUESTED_WITH" ] === "XMLHttpRequest") ?? false;

	function json_out($data = [], $code = 200) {
		http_response_code($code);
		header("Content-Type: application/json");
		try {
			return json_encode($data, JSON_THROW_ON_ERROR);
		} catch (JsonException $e) {
			return "[]";
		}
	}

	switch ($cmd) {
		case "login":
			$pw = $_POST[ "password" ] ?? "";
			$ni = $_POST[ "nick" ] ?? "";
			$login = fetchOne("SELECT * FROM users WHERE pwhash = :pwhash AND (nick = :nick OR mail = :nick)", [
				":pwhash" => md5($pw),
				":nick" => $ni
			]);
			if ($login) {
				$_user = $_SESSION[ "_user" ] = [
					"id" => $login->id,
					"nick" => $login->nick,
					"crew" => $login->crew,
					"rank" => $login->rank,
					"settings" => []
				];
				doQuery("INSERT INTO lastusers (nick, crew, user_id, timestamp) VALUES (:nick, :crew, {$login->id}, UNIX_TIMESTAMP())", [
					":nick" => $_user[ "nick" ],
					":crew" => $_user[ "crew" ]
				]);
				doQuery("UPDATE users SET lastactive = UNIX_TIMESTAMP() WHERE id = {$login->id}");
			}
			break;
		case "logout":
			$_SESSION = [];
			if (ini_get("session.use_cookies")) {
				$params = session_get_cookie_params();
				setcookie(session_name(), '', time() - 42000, $params[ "path" ], $params[ "domain" ], $params[ "secure" ], $params[ "httponly" ]);
			}
			session_destroy();
			break;
		/*			case "register":
						break;*/
		case "tag":
			$text = $_POST[ 'tagtext' ] ?? "";
			$text = strip_tags($text);
			$wall = $_POST[ 'wall_id' ] ?? 1;
			if (!empty($text) && is_logged_in()) {
				doQuery("INSERT INTO wallposts (user_id, wall_id, nick, tag) VALUES (:user_id, :wall_id, :nick, :text)", [
					":user_id" => $_user[ "id" ],
					":wall_id" => (int)$wall,
					":nick" => $_user[ "nick" ],
					":text" => $text
				]);
			}
			if ($is_ajax) {
				foreach (fetchAll("(SELECT * FROM wallposts WHERE wall_id = :wall_id ORDER BY id DESC LIMIT 12) ORDER BY id ASC", [":wall_id" => (int)$wall]) as $row) { ?>
					<div class="col-lg-12 d-flex justify-content-between">
						<pre class="wall"><span class="cyan"><?=$row->tag?></span></pre>
						<span class="pink"><?=$row->nick?></span>
					</div>
				<?php }
				exit();
			}
			break;
		case "unfave":
			if ($is_ajax && is_logged_in()) {
				$colly = $_POST[ "colly_id" ] ?? $_current[ 1 ] ?? 0;
				if ($colly > 0) {
					$status = doQuery("DELETE FROM favourites WHERE user_id = :user AND colly_id = :colly", [
						":user" => $_user[ "id" ],
						":colly" => (int)$colly
					]);
					$code = ($status) ? 200 : 400;
					exit(json_out([
						"status" => $status,
						"id" => (int)$colly
					], $code));
				}
				exit(json_out(["status" => false], 400));
			}
			break;
		default:
			if ($is_ajax) {
				exit(json_out(["status" => false], 400));
			}
			break;
	}

	header("Location: {$reDir}");
