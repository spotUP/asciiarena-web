<?php
require_once "session.php";
$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
$now = time();
include "header.php";
?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">



		<?php
//--------------------------------------------------------------------------
// MATCH PASSWORD AND UPDATE USER STATUS
//--------------------------------------------------------------------------
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
				<meta http-equiv="Refresh" content="2" url="register.php">
				<?php
				exit;
			}

			if ($confirm_password_md5 == $pw_hash)
			{
				$ask_update="update users set rank='User', joined=:now where nick=:confirm_nick";
				doQuery($ask_update,['confirm_nick' => $confirm_nick, 'now' => $now ]);

				$_SESSION['password'] = $confirm_password;
				$_SESSION['password'] = $confirm_nick;

				?><meta http-equiv="Refresh" content="0" url="login.php?activated"><?php
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
				?><meta http-equiv="Refresh" content="2" url="register.php"><?php
				exit;
			}

			if ($check_password!=$repeat_password)
			{
				?>FAILURE! The passwords doesn't match!<?php
				?><meta http-equiv="Refresh" content="2" url="register.php"><?php
				exit;
			}

			if ($spam!='iamnotarobot')
			{
				?>FAILURE! Enter iamnotarobot to prove that you are human!<?php
				?><meta http-equiv="Refresh" content="2" url="register.php"><?php
				exit;
			}

			if (empty($check_nick))
			{
				?>FAILURE! Error! You must fill the name field!<?php
				?><meta http-equiv="Refresh" content="2" url="register.php"><?php
				exit;
			}

			$mail = trim($_POST['mail']);  
			if(!checkEmail($mail)) 
			{
				?>FAILURE! Error! You must enter a valid E-Mail adress!<?php
				?><meta http-equiv="Refresh" content="2" url="register.php"><?php
				exit;
			}

			if (empty($check_password))
			{
				?>FAILURE! Error! You must fill the password field!<?php
				?><meta http-equiv="Refresh" content="2" url="register.php"><?php
				exit;
			}

			$pwlenght=(strlen($check_password));
			if ($pwlenght < 6)
			{
				?>FAILURE! Error! The password must contain 6 characters!<?php	
				?><meta http-equiv="Refresh" content="2" url="register.php"><?php
				exit;
			}

			$ask_check = $_db->prepare("SELECT nick FROM users WHERE nick = :check_nick");
			$ask_check->execute(['check_nick' => $check_nick]);
			$rows = $ask_check->fetchAll();
			if(count($rows) > 0)
			{
				?>This nick is already in use!<?php		
				?><meta http-equiv="Refresh" content="2" url="register.php"><?php
				exit;
			}
			$ask = $_db->prepare("INSERT INTO users
				(nick, crew, password, pwhash, lastactive, current, mail, uploaded, `rank`, upload_signature, list_view_mode, display_mail, nickurl)
				VALUES 
				(:nick,'Independent','SECRET',:pwhash, :now, '', :mail, 0, 'Inactive', '- -- - aSCIIaRENa - ---- - aSCIIaRENa - -- -','Standard', 'No', :nickurl)");
			$ask->execute([
				'nick' => $check_nick,
				'now' => $now,
				'pwhash' => $pwhash,
				'mail' => $mail,
				'nickurl' => urlsafe($check_nick)
			]);

			$welcome_msg="WELCOME TO aSCIIaRENA!<br><br>".

			"To fully enjoy aSCIIaRENA, you should head over to your \"crib\" and personalize<br>".
			"the viewing settings. You can change things such as the default colors of ASCII<br>".
			"collys and the default viewing mode when listing collys/files.<br>". 
			"Do check out the BBS listing mode! =)<br><br>".

			"You can also edit your upload signature etc.<br><br>".

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

			$headers = 'From: arenamailer @ gmail . com';

			mail($to,$subject,$body,$headers);

			?>
			<div class="row">
				<div class="col-12 d-flex justify-content-md-center">
					<img src="assets/data/register.png">
				</div>
			</div>
			<div class="row">
				<div class="col-12 text-center apt-1">
					<span>Your account has been created, a mail with instructions has been sent to your e-mail adress.</span>
				</div>
			</div>
		</div>
		<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
			<?php include "sidebar.php"; ?>
		</div>
		<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
			<?php include "sidebar_right.php"; ?>
		</div>
	</div>
	<?php 
	echo "hey!!!!!";
	?>
	<?php include "footer.php"; ?>
	<meta http-equiv="Refresh" content="4" url="index.php">
	<?php
	exit();
}
?>
<form action="register.php" method="post">
	<div class="container-fluid bg-secondary amb-1 apb-1">
		<div class="row apb-1">
			<div class="col-12 d-flex justify-content-md-center">
				<img src="assets/data/register.png">
			</div>
		</div>
		<?php if (!isset($_GET['confirm']))
		{
			?>
			<div class="row">
				<div class="col-6">
					<span class="white">Nick</span>
				</div>
				<div class="col-6">
					<span class="white">Password</span> 
				</div>
			</div> 

			<div class="row apb-1">
				<div class="col-6">
					<input type="text" name="nick" class="w-100"> 
				</div>
				<div class="col-6">
					<input type="password" name="password" class="w-100">
				</div>
			</div>


			<div class="row">
				<div class="col-6">
					E-Mail 
				</div>
				<div class="col-6">
					Repeat Password 
				</div>
			</div>

			<div class="row apb-1">
				<div class="col-6">
					<input type="text" name="mail" class="w-100">
				</div>
				<div class="col-6">
					<input type="password" name="repeat_password" class="w-100">
				</div>
			</div>

			<div class="row">
				<div class="col-6">
					Enter iamnotarobot here: 
				</div>
			</div>
			<div class="row">
				<div class="col-6 apb-1">
					<input type="text" name="spam" class="w-100"> 
				</div>
			</div>
			<div clas="row">
				<input type="submit" value="Join!">
			</div>
		</div>
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
<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
	<?php include "sidebar.php"; ?>
</div>
<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
	<?php include "sidebar_right.php"; ?>
</div>
</div>
<?php include "footer.php"; ?>

