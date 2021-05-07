<?php
	define("NO_PING", true);
	require_once "session.php";

	$cmd = $_GET[ "cmd" ] ?? $_current[ 0 ] ?? "";
	$reDir = "/";

	$is_ajax = (isset($_SERVER[ "HTTP_X_REQUESTED_WITH" ]) && $_SERVER[ "HTTP_X_REQUESTED_WITH" ] === "XMLHttpRequest") ?? false;

	switch ($cmd) {
		case "login":
			$login = false;
			$pw = $_POST[ "password" ] ?? "";
			$ni = $_POST[ "nick" ] ?? "";
			$loc = $_POST[ "location" ] ?? "/";
			$spw = fetchOne("SELECT pwhash FROM users WHERE (nick = :nick OR mail = :nick)", [ ":nick" => $ni ])->pwhash;
			if (preg_match('/^[a-f0-9]{32}$/i', $spw)) {
				$login = fetchOne("SELECT id,nick,crew,rank,crt_effect FROM users WHERE pwhash = :pwhash AND (nick = :nick OR mail = :nick)", [
					":pwhash" => md5($pw),
					":nick" => $ni
				]);
				if ($login) {
					$pwhash = password_hash($pw, PASSWORD_BCRYPT, array('cost' => 13));
					doQuery("UPDATE users SET pwhash=:pwhash WHERE id=:id", [ ":pwhash" => $pwhash, ":id" => $login->id ]);
				}
			} else {
				if (password_verify($pw, $spw)) {
					$login = fetchOne("SELECT id,nick,crew,rank,crt_effect FROM users WHERE (nick = :nick OR mail = :nick)", [ ":nick" => $ni ]);
				}
			}
			if ($login) {
				$_user = $_SESSION[ "_user" ] = [
					"id" => $login->id,
					"nick" => $login->nick,
					"crew" => $login->crew,
					"rank" => $login->rank,
					"settings" => [
						"crt_effect" => $login->crt_effect,
					]
				];
				if (isset($_POST["rememberme"]) && $_POST["rememberme"] == 1) setremember();
				doQuery("INSERT INTO lastusers (nick, crew, user_id, timestamp) VALUES (:nick, :crew, {$login->id}, UNIX_TIMESTAMP())", [
					":nick" => $_user[ "nick" ],
					":crew" => $_user[ "crew" ]
				]);
				doQuery("UPDATE users SET lastactive = UNIX_TIMESTAMP() WHERE id = {$login->id}");
				if ($is_ajax) { ?>
					<script>window.location.replace('<?=addslashes($loc)?>');</script>
					<?php 
					exit;
				}
			} else {
				if ($is_ajax) { ?>
					<div class="bs-component quick-alert amb-1" id="login-failure" style="display: none;">
						<div id="#danger-alert" class="animate__animated animate__shakeX alert alert-danger">authentication failed</div>
					</div>
					<script>$('#login-failure').fadeIn('slow').delay(2000).fadeOut('slow');</script>
					<?php 
					exit;
				}
			}
			exit;
			break;
		case "logout":
			doQuery("UPDATE users SET lastactive = UNIX_TIMESTAMP()-300 WHERE id = {$_user['id']}");
			$_SESSION = [];
			if (ini_get("session.use_cookies")) {
				$params = session_get_cookie_params();
				setcookie(session_name(), '', time() - 42000, $params[ "path" ], $params[ "domain" ], $params[ "secure" ], $params[ "httponly" ]);
			}
			session_destroy();
			if (isset($_COOKIE['aarm'])) setcookie('aarm', '', (time()-86400), '/', 'asciiarena.se', true, true);
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
				foreach (fetchAll("(SELECT * FROM wallposts WHERE wall_id = :wall_id ORDER BY id DESC LIMIT 13) ORDER BY id ASC", [":wall_id" => (int)$wall]) as $row) { ?>
					<div class="col-lg-12 d-flex justify-content-between">
						<span class="cyan text-truncate" style="white-space: pre"><?=$row->tag?></span>
						<span class="lightpink"><a href="/member/<?=urlsafe($row->nick)?>"><?=$row->nick?></a></span>
					</div>
				<?php }
				exit();
			}
			break;
    case "countdl":
      if ($is_ajax && is_logged_in()) {
				$colly = $_POST[ "colly_id" ] ?? $_current[ 1 ] ?? 0;
				if ($colly > 0) {
					$status = doQuery("update collys set downloads=downloads+1 where id = :colly_id",[
            ":colly_id" => (int)$colly,
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
    case "countview":
      if ($is_ajax && is_logged_in()) {
				$colly = $_POST[ "colly_id" ] ?? $_current[ 1 ] ?? 0;
				if ($colly > 0) {
					$status = doQuery("update collys set view_counter=view_counter+1 where id = :colly_id",[
            ":colly_id" => (int)$colly,
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
    case "broken":
      if ($is_ajax && is_logged_in()) {
				$colly = $_POST[ "colly_id" ] ?? $_current[ 1 ] ?? 0;
        $comment = $_POST[ 'comment' ] ?? "";
				if ($colly > 0) {
					$status = doQuery("update collys set broken=1, broken_comment=:comment where id = :colly_id",[
            ":colly_id" => (int)$colly,
            ":comment" => $comment
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
    case "getcomments":      
      if ($is_ajax) {
				$colly = $_POST[ "colly_id" ] ?? $_current[ 1 ] ?? 0;
				if ($colly > 0) {
          $data = [];
          $comments = fetchAll("SELECT commentid,timestamp,nick,ifnull(rating,'') as rating,comment FROM comments WHERE colly_id = :id", [":id" => $colly]);
          foreach($comments as $comment) {
            $data[] = [
              "id" => (int)$comment->commentid,
              "time" => date("Y-m-d H:i:s",$comment->timestamp),
              "nick" => $comment->nick,
              "rating" => $comment->rating,
              "comment" => $comment->comment
            ];
          }
          if(!empty($data)) {
            exit(json_out($data));
          }
        }
        exit(json_out(["status" => false], 404));
			}
			break;  
    case "delcomment":
      if ($is_ajax && is_logged_in() &&is_admin()) {
				$id = $_POST[ "comment_id" ] ?? $_current[ 1 ] ?? 0;
        $colly = $_POST[ "colly_id" ] ?? 0;
				if ($id > 0) {
					$status = doQuery("delete from comments where commentid = :commentid",[
            ":commentid" => (int)$id,
          ]);
					$code = ($status) ? 200 : 400;
          doQuery("update collys set rating=(select avg(rating) AS avg from comments where colly_id=:colly_id and rating>0) where id=:colly_id",[
            ":colly_id" => (int)$colly,
          ]);
          recalculate_ratings();
					exit(json_out([
						"status" => $status,
						"id" => (int)$id
					], $code));
				}
				exit(json_out(["status" => false], 400));
			}
			break;         
    case "editcomment":
      if ($is_ajax && is_logged_in()) {
				$id = $_POST[ "comment_id" ] ?? $_current[ 1 ] ?? 0;
        $comment = $_POST[ 'comment' ] ?? "";
				if ($id > 0) {
          if (is_admin()) {
            $admin=1;
          } else {
            $admin=0;
          }
					$status = doQuery("update comments set comment = :comment where (:admin = 1 or nick = :nick) and commentid = :commentid",[
            ":commentid" => (int)$id,
            ":comment" => $comment,
            ":nick" => $_user[ "nick" ],
            ":admin" => $admin
          ]);
					$code = ($status) ? 200 : 400;
					exit(json_out([
						"status" => $status,
						"id" => (int)$id
					], $code));
				}
				exit(json_out(["status" => false], 400));
			}
			break;         
    case "addcomment":
      if ($is_ajax && is_logged_in()) {
				$colly = $_POST[ "colly_id" ] ?? $_current[ 1 ] ?? 0;
        $comment = $_POST[ 'comment' ] ?? "";
        $rating = $_POST[ 'rating' ] ?? "";
        if (empty($rating)) $rating = null;
				if ($colly > 0) {
					$status = doQuery("insert into comments (colly_id, filename, crew, artist, comment, rating, nick, timestamp,user_id) 
            values (:colly_id,:filename,(select w.name from collys_crews cc LEFT JOIN crews w ON w.id=cc.crew_id where cc.colly_id=:colly_id),(select a.nick from artists_collys ac LEFT JOIN artists a ON a.id=ac.artist_id where ac.colly_id=:colly_id),:comment, :rating, :nick, :time, :user_id)",[
            ":colly_id" => (int)$colly,
            ":filename" => $_SESSION['filename'],
            ":comment" => $comment,
            ":rating" => $rating,
            ":nick" => $_user[ "nick" ],
            ":time" => time(),
            ":user_id" => $_user[ "id" ],
          ]);
					$code = ($status) ? 200 : 400;
          doQuery("update collys set rating=(select avg(rating) AS avg from comments where colly_id=:colly_id and rating>0) where id=:colly_id",[
            ":colly_id" => (int)$colly,
          ]);
          recalculate_ratings();

					exit(json_out([
						"status" => $status,
						"id" => (int)$colly
					], $code));
				}
				exit(json_out(["status" => false], 400));
			}
			break;         
		case "fave":
			if ($is_ajax && is_logged_in()) {
				$colly = $_POST[ "colly_id" ] ?? $_current[ 1 ] ?? 0;
				if ($colly > 0) {
					$status = doQuery("INSERT INTO favourites (user_id, colly_id, nick, filename)
          VALUES (:user_id, :colly_id, :nick, :filename)", [
						":user_id" => $_user[ "id" ],
						":colly_id" => (int)$colly,
            ":nick" => $_user[ "nick" ],
            ":filename" => $_SESSION['filename']
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
