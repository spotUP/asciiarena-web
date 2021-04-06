<?php

include_once 'session.php';
include_once 'header.php';

$now = time();

?><!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "https://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<title>ASCIIARENA brought to you by UP ROUGH SOUNDSYSTEM</title>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> 
	<meta name="viewport" content="width=device-width">
	<link rel='stylesheet' href='style.css' type='text/css'>
</head>
<body>

	<div class='maincontainer'>
		<div class='maincontent'>

			<?php
//-------------------------------------------------------------------------
// MATCH PASSWORD AND UPDATE USER STATUS
//-------------------------------------------------------------------------
			if (isset($_POST['confirm_password']))
			{
				$confirm_nick=$_POST['confirm_nick'];
				$confirm_password=$_POST['confirm_password'];
				$confirm_password_md5=md5($confirm_password);

				$ask="SELECT * FROM users WHERE nick=:confirm_nick";
				$row=fetchOne($ask, ['confirm_nick' => $confirm_nick ]);
				$pw_hash=$row->pwhash;

				if ($confirm_password_md5 != $pw_hash)
				{
					?>
					FAILURE! Wrong Password! Try again.
					<meta http-equiv="Refresh" content="2; url=register.php">
					<?php
					exit;
				}

				if ($confirm_password_md5 == $pw_hash)
				{
					$ask_update="update users set rank='User', joined=:now where nick=:confirm_nick";
					doQuery($ask_update,['confirm_nick' => $confirm_nick, 'now' => $now ]);

					$_SESSION['password'] = $confirm_password;
					$_SESSION['password'] = $confirm_nick;

					?><meta http-equiv="Refresh" content="0"; url="login.php?activated"><?php
					exit();
				}
			}	
			if(isset($_POST['nick']))
			{
				$check_nick=$_POST['nick'];
				$check_password=$_POST['password'];
				$repeat_password=$_POST['repeat_password'];
				$spam=$_POST['spam'];
				$mail=$_POST['mail'];
				$pwhash=md5($check_password);

				if ($check_password == $check_nick)
				{
					?>FAILURE! The nick and password must be unique!<?php
					?><meta http-equiv="Refresh" content="2; url=register.php"><?php
					exit;
				}

				if ($check_password!=$repeat_password)
				{
					?>FAILURE! The passwords doesn't match!<?php
					?><meta http-equiv="Refresh" content="2; url=register.php"><?php
					exit;
				}

				if ($spam!='iamnotarobot')
				{
					?>FAILURE! Enter iamnotarobot to prove that you are human!<?php
					?><meta http-equiv="Refresh" content="2; url=register.php"><?php
					exit;
				}

				if (empty($check_nick))
				{
					?>FAILURE! Error! You must fill the name field!<?php
					?><meta http-equiv="Refresh" content="2; url=register.php"><?php
					exit;
				}

				$mail = trim($_POST['mail']);  
				if(!checkEmail($mail)) 
				{
					?>FAILURE! Error! You must enter a valid E-Mail adress!<?php
					?><meta http-equiv="Refresh" content="200; url=register.php"><?php
					exit;
				}

				if (empty($check_password))
				{
					?>FAILURE! Error! You must fill the password field!<?php
					?><meta http-equiv="Refresh" content="2; url=register.php"><?php
					exit;
				}

				$pwlenght=(strlen($check_password));
				if ($pwlenght < 6)
				{
					?>FAILURE! Error! The password must contain 6 characters!<?php	
					?><meta http-equiv="Refresh" content="2; url=register.php"><?php
					exit;
				}

				$ask_check = $_db->prepare("SELECT nick FROM users WHERE nick = :check_nick");
				$ask_check->execute(['check_nick' => $check_nick]);
				$rows = $ask_check->fetchAll();
				if(count($rows) > 0)
				{
					?>This nick is already in use!<?php		
					?><meta http-equiv="Refresh" content="2; url=register.php"><?php
					exit;
				}
				$ask = $_db->prepare("INSERT INTO users
					(nick, crew, password, pwhash, lastactive, current, mail, uploaded, 
					`rank`, upload_signature, list_view_mode, display_mail,)
					VALUES (:check_nick,'Independent','SECRET',:pwhash, :now, '', :mail, 0, 
					'Inactive', '- -- - aSCIIaRENa - ---- - aSCIIaRENa - -- -','Standard', 'No')
					");
				$ask->execute([
					'check_nick' => $check_nick,
					'now' => $now,
					'pwhash' => $pwhash,
					'mail' => $mail
				]);

				$welcome_msg="WELCOME TO aSCIIaRENA!<br><br>".

				"To fully enjoy aSCIIaRENA, you should head over to your \"crib\" and personalize<br>".
				"the viewing settings. You can change things such as the default colors of ASCII<br>".
				"collys and the default viewing mode when listing collys/files.<br>". 
				"Do check out the BBS listing mode! =)<br><br>".
				"You can also edit your upload and forum signature, and upload an avatar etc.<br>".

				"After that you are ready for axxion! You can not only submitASCII collys, you<br>".
				"can comment and vote on collys.<br><br>".

				"When you vote on a colly, the artist that made the colly and the crew that<br>".
				"released it will get scores too, meaning that the artist top and the crew top<br>".
				"are all based on the votes that you cast on collys. So go vote to prop your<br>". 
				"favourite collys/artists/crews!<br><br>".

				"/ sPOT^uP rOUGH [aSCIIaRENA sYSOP]<br>";	

				$ask = $_db->prepare("SELECT thread FROM messages ORDER BY thread DESC LIMIT 1");
				$ask->execute();
				$rows = $ask->fetch(PDO::FETCH_OBJ);
				if($rows === false) 
				{
					    # FIXME: $row is probably wrong? 
					$thread=$row[0];
				}
				if (empty($thread))
				{
					$thread=0;
				}
				$thread++;

				$ask = $_db->prepare("INSERT INTO messages
					(thread, postedto, postername, timestamp, subject, message, unread)
					VALUES (:thread, :check_nick,'Spot',:now,'Welcome!',:welcome_msg,1)
					");
				$ask->execute([
					'thread' => $thread,
					'check_nick' => $check_nick,
					'now' => $now,
					'welcome_msg' => $welcome_msg
				]);


//-------------------------------------------------------------------------
// SEND WELCOME MAIL					
//-------------------------------------------------------------------------

					// require_once "Mail.php";

				$from = "aSCIIaRENa <asciiarena@gmail.com>";
				$to = "$check_nick <$mail>";
				$subject = "aSCIIaRENa Account Activation";
				$body = "Hi $check_nick! \n\n" .
				"Your aSCIIaRENA account is ready for use,\n".
				"click the link to activate it.\n".
				"https://www.asciiarena.se/register.php?confirm=$pwhash\n";

				$host = "ssl://smtp.gmail.com";
				$port = "465";
				$username = "asciiarena@gmail.com";
				$password = "4skee4rena";

				$headers = array ('From' => $from,
					'To' => $to,
					'Subject' => $subject);
					// $smtp = Mail::factory('smtp',
					// array ('host' => $host,
					// 	'port' => $port,
					// 	'auth' => true,
					// 	'username' => $username,
					// 	'password' => $password));
					//
					// $mail = $smtp->send($to, $headers, $body);
					//
					// if (PEAR::isError($mail)) 
					// {
					// 	echo("<p>" . $mail->getMessage() . "</p>");
					// } 
					?>
					<img class='centered' border='0' src='assets/data/register.png'>
					Your account has been created, a mail with instructions
					has been sent to your e-mail adress.
					<?php
					exit();
				}

				?>
				<form action="register.php" method="post">
					<img class='centered' border='0' src='assets/data/register.png'>
					<?php if (!isset($_GET['confirm']))
					{
						?>
						Nick <input type="text" size="14" maxlength="14" name="nick"> Password <input type="password" name="password" size="14">
						E-Mail <input type="text" name="mail" size="14">
						Password (repeat) <input type="password" name="repeat_password" size="14">
						Enter iamnotarobot here: <input type="text" name="spam">   <input type="submit" value="Join!">
						<?php
					}
					if (isset($_GET['confirm']))
					{
						$confirm_pw_hash=$_GET['confirm'];

						$ask="SELECT * FROM users WHERE pwhash='$confirm_pw_hash'";
						$row=fetchOne($ask, ['confirm_pw_hash' => $confirm_pw_hash ]);
						$nick=$row->nick;
						$pw_hash=$row->pwhash;
						?>
						wELCOME <?=$nick?>, pLEASE cONFiRM yOUR pASSWORD!
						Password: <input type="hidden" name="confirm_nick" value="<?=$nick?>"><input type="password" name="confirm_password" size="14"> <input type="submit" value="Confirm!">
						<?php
					}		
					?>
			</form>
		</div>
	</div>
</body>
</html>

