<?php
	require_once ('functions.php');
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "https://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<title>ASCIIARENA brought to you by UP ROUGH SOUNDSYSTEM</title>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> 
	<meta name="viewport" content="width=device-width">
	<link rel='stylesheet' href='style.css' type='text/css'>
</head>
	<body>
		<?php


$path = '/var/packages/PEAR/target/';
set_include_path(get_include_path() . PATH_SEPARATOR . $path);


		echo "<div id='maincontainer'>";
			echo "<div id='maincontent'>";

			require_once "Mail.php";
			if(isset($_POST['email']))
			{

				function createRandomPassword() 
				{
					$chars = "abcdefghijkmnopqrstuvwxyz023456789";
					srand((double)microtime()*1000000);
					$i = 0;
					$pass = '' ;
					while ($i <= 7) 
					{
						$num = rand() % 33;
						$tmp = substr($chars, $num, 1);
						$pass = $pass . $tmp;
						$i++;

		    		}
					return $pass;
				}

				$password = createRandomPassword();
				$pwhash=md5($password);

				$recipient = $_POST['email'];

				$ask="SELECT mail, nick FROM users WHERE mail=:recipient";
				$result=fetchOne($ask, [ 'recipient' => $recipient ]);
				foreach ($result as $row)
				{
					$mail=$row->mail;
					$nick=$row->nick;					
				}
				if (isset($_POST['email']) && (isset($mail)))
				{
					$ask_update="update users set temp_pw_hash=:pwhash where mail=:recipient";
					doQuery($ask_update, ['pwhash' => $ppwhash, 'recipient' => $recipient ]);

					$from = "aSCIIaRENA <spotUP@gmail.com>";
					$to = "$nick <$recipient>";
					$subject = "aSCIIaRENA Password Reminder";
					$body = "Hi!\n\n" .
					"Someone requested that your aSCIIaRENA password should be reset.\n".
					"Hopefully it was you. Click this link to reset your password.\n".
					"https://www.asciiarena.se/reminder.php?newpassword=$pwhash\n";
	
					$host = "ssl://smtp.gmail.com";
					$port = "465";
					$username = "asciiarenamailer@gmail.com";
					$password = "ascii4life";
	
					$headers = array ('From' => $from,
					  'To' => $to,
					  'Subject' => $subject);
					$smtp = Mail::factory('smtp',
					  array ('host' => $host,
					    'port' => $port,
					    'auth' => true,
					    'username' => $username,
					    'password' => $password));
	
					$mail = $smtp->send($to, $headers, $body);

					if (PEAR::isError($mail)) 
					{
						echo("<p>" . $mail->getMessage() . "</p>");
					} 
					else
					{
						$recipient = $_POST['email'];
						?><meta http-equiv="Refresh" content="0; url=reminder.php?sent=sent&recipient=<?=$recipient?>"><?php
					}
				}
			}
			if (isset($_POST['new_user_password']))
			{
				$nick=$_POST['nick'];
				$new_password=$_POST['new_user_password'];
				$new_password=cleanInsert($new_password); 
				$pwhash=md5($new_password);

				$ask_update="update users set pwhash=:pwhash where nick=:nick";
				doQuery($ask_update, ['pwhash' => $pwhash, 'nick' => $nick ]);

				$ask_update="update users set temp_pw_hash=(null) where nick=:nick";
				doQuery($ask_update, ['nick' => $nick ]);
				?><meta http-equiv="Refresh" content="0; url=login.php"><?php
			}
			
			echo "<form action='$_SERVER[PHP_SELF]' method='post'>";
			echo "<table width=\"913px\">";
				echo "<tr><td colspan='3'><img class='centered' border='0' src='data/login.png'></td></tr>";
				echo "<tr><td colspan='3'>&nbsp;</td></tr>";
				if (isset($_POST['email']) && (!isset($mail))) 
				{
					echo "<tr><td align='center' width='165'>tHiS eMAiL aDDY dOESN'T eXiST iN tHE dATABASE!</td></td></tr>";
					?><meta http-equiv="Refresh" content="3; url=reminder.php"><?php
				}
				if (!isset($_POST['email']) && (!isset($_GET['newpassword']) && (!isset($_GET['sent']))))
				{
					echo "<tr><td width='260'>&nbsp;</td><td align='left' width='165'>mAIL aDDY:</td></td></tr>";
					echo "<tr><td width='260'>&nbsp;</td><td align='left'><input type=\"text\" name=\"email\" id=\"email\" size=\"30\"></td><td align='left'><input type=\"submit\" value=\"Send Password!\"></td></tr>";
				}

				if (isset($_GET['sent']))
				{
					$recipient = $_GET['recipient'];
				
					echo "<tr><td width='560'align='center'>a mAiL hAS bEEN sENT tO $recipient,</td></tr>";
					echo "<tr><td width='560'align='center'>rEAD tHE mAiL fOR fURTHER iNSTRUCTiONS!</td></tr>";
					exit();
				}
					
				if (isset($_GET['newpassword']))
				{				
					$new_password=$_GET['newpassword'];
					$ask="SELECT * FROM users WHERE temp_pw_hash=:new_password";
					$result=fetchAll($ask, ['new_password' => $new_password ]);
					foreach ($result as $row)
					{
						$nick=$row->nick;
						$mail=$row->mail;
						$temp_pw_hash=$row->temp_pw_hash;
					}

					if ($new_password == $temp_pw_hash)
					{
						echo "<tr><td width='460'align='center'>wELCOME bACK $nick, yOUR pASSWORD hAS bEEN rESET.</td></tr>";
						echo "<tr><td width='260'>&nbsp;</td><td align='left' width='165'>eNTER nEW pASSWORD:</td></tr>";
						echo "<tr><td width='260'>&nbsp;</td><td align='left'><input type=\"hidden\" name=\"nick\" value=\"$nick\"><input type=\"password\" name=\"new_user_password\" id=\"new_user_password\" size=\"30\"></td><td align='left'><input type=\"submit\" value=\"Send Password!\"></td></tr>";
					}
					else
					{
						echo "<tr><td align='center'>hACK aTTEMPT dETECTED! yOUR iP hAS bEEN rEPORTED tO tHE pOLiCE!</td></tr>";
					}
				}
			echo "</table></form>";
			?>
			<script type="text/javascript">
			document.getElementById('email').focus();
			</script>
			</div>
		</div>
	</body>
</html>

