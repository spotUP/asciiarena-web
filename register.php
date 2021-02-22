<?php

include 'session.php';
include 'header.php';

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

					$ask="SELECT * FROM users WHERE nick='$confirm_nick'";
					$result=mysql_query($ask,$dbh);
					while ($row=mysql_fetch_array($result))
					{
						$pw_hash=$row['pwhash'];							
					}					

					if ($confirm_password_md5 != $pw_hash)
					{
						?>
						<table width="913px"><caption>FAILURE!</caption><tr><td>Wrong Password! Try again.</td></tr></table>
						<meta http-equiv="Refresh" content="2; url=register.php">
						<?php
						exit;
					}
					
					if ($confirm_password_md5 == $pw_hash)
					{
						$ask_update="update users set rank='User' where nick='$confirm_nick'";
						mysql_query($ask_update,$dbh);

						$ask_update="update users set joined=$now where nick='$confirm_nick'";
						mysql_query($ask_update,$dbh);

						$_SESSION['password'] = $confirm_password;
						$_SESSION['password'] = $confirm_nick;
	
						?><meta http-equiv="Refresh" content="0; url=login.php?activated"><?php
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
						?><table width="913px"><caption>FAILURE!</caption><tr><td>The nick and password must be unique!</td></tr></table><?php
						?><meta http-equiv="Refresh" content="2; url=register.php"><?php
						exit;
					}
							
					if ($check_password!=$repeat_password)
					{
						?><table width="913px"><caption>FAILURE!</caption><tr><td>The passwords doesn't match!</td></tr></table><?php
						?><meta http-equiv="Refresh" content="2; url=register.php"><?php
						exit;
					}

					if ($spam!='iamnotarobot')
					{
						?><table width="913px"><caption>FAILURE!</caption><tr><td>Enter iamnotarobot to prove that you are human!</td></tr></table><?php
						?><meta http-equiv="Refresh" content="2; url=register.php"><?php
						exit;
					}
			
					if (empty($check_nick))
					{
						?><table width="913px"><caption>FAILURE!</caption><tr><td>Error! You must fill the name field!</td></tr></table><?php
						?><meta http-equiv="Refresh" content="2; url=register.php"><?php
						exit;
					}

					$mail = trim($_POST['mail']);  
					if(!checkEmail($mail)) 
					{
						?><table width="913px"><caption>FAILURE!</caption><tr><td>Error! You must enter a valid E-Mail adress!</td></tr></table><?php
						?><meta http-equiv="Refresh" content="200; url=register.php"><?php
						exit;
					}
		
					if (empty($check_password))
					{
						?><table width="913px"><caption>FAILURE!</caption><tr><td>Error! You must fill the password field!</td></tr></table><?php
						?><meta http-equiv="Refresh" content="2; url=register.php"><?php
						exit;
					}

					$pwlenght=(strlen($check_password));
					if ($pwlenght < 6)
					{
						?><table width="913px"><caption>FAILURE!</caption><tr><td>Error! The password must contain 6 characters!</td></tr></table><?php	
						?><meta http-equiv="Refresh" content="2; url=register.php"><?php
						exit;
					}
		
					$ask_check = $_db->prepare("SELECT nick FROM users WHERE nick = :check_nick");
					$ask_check->execute(['check_nick' => $check_nick]);
					$rows = $ask_check->fetchAll();
					if(count($rows) > 0)
					{
						?><table width="913px"><tr><td>This nick is already in use!</td></tr></table><?php		
						?><meta http-equiv="Refresh" content="2; url=register.php"><?php
						exit;
					}
					$ask = $_db->prepare("INSERT INTO users
       (nick,       crew,         password, pwhash, lastactive, current, avatar,               mail,  uploaded, rank,        upload_signature,                              list_view_mode, display_mail,display_messenger)
VALUES (:check_nick,'Independent','SECRET',:pwhash, :now,       '',      'AvatarDefault.jpg', :mail,   0,        'Inactive', '- -- - aSCIIaRENa - ---- - aSCIIaRENa - -- -','Standard',     'No',        'No'            )
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
					<table width="913px">
						<tr><td>&nbsp;</td></tr>
						<tr><td><img class='centered' border='0' src='data/register.png'></td></tr>
						<tr><td>&nbsp;</td></tr>
						<tr><td align="center">Your account has been created, a mail with instructions</td></tr>
						<tr><td align="center">has been sent to your e-mail adress.</td></tr>
					</table>
					<?php
					exit();
				}
		
				?>
				<form action="register.php" method="post">
						<table width="913px">
						<tr><td colspan="5">&nbsp;</td></tr>
						<tr><td colspan="5"><img class='centered' border='0' src='data/register.png'></td></tr>
						<tr><td colspan="5">&nbsp;</td></tr>
					<?php if (!isset($_GET['confirm']))
					{
						?>
						<tr><td width="230">&nbsp;</td><td align="right" width="30">Nick</td><td width="110"><input type="text" size="14" maxlength="14" name="nick"></td><td align="right">Password</td><td><input type="password" name="password" size="14"></td></tr>
							<tr><td>&nbsp;</td><td align="right">E-Mail</td><td><input type="text" name="mail" size="14"></td>
							<td align="right" width="150">Password (repeat)</td><td><input type="password" name="repeat_password" size="14"></td></tr>
							<tr><td colspan="5">&nbsp;</td></tr>
						
						<tr><td colspan="5" align="center">Enter iamnotarobot here: <input type="text" name="spam">   <input type="submit" value="Join!"></td></tr>
						<?php
					}
					if (isset($_GET['confirm']))
					{
						$confirm_pw_hash=$_GET['confirm'];

						$ask="SELECT * FROM users WHERE pwhash='$confirm_pw_hash'";
						$result=mysql_query($ask,$dbh);
						while ($row=mysql_fetch_array($result))
						{
							$nick=$row['nick'];
							$pw_hash=$row['pwhash'];							
						}					
						?>
						<tr><td colspan="3" align="center">wELCOME <?=$nick?>, pLEASE cONFiRM yOUR pASSWORD!</td></tr>
						<tr><td align="center">Password: <input type="hidden" name="confirm_nick" value="<?=$nick?>"><input type="password" name="confirm_password" size="14"> <input type="submit" value="Confirm!"></td></tr>
						<?php
					}		
					?>
					</table>
				</form>
			</div>
		</div>
	</body>
</html>

