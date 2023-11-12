<?php
require_once "session.php";

$errors = array();
$messages = array();

if(isset($_POST['join'])) {

	if (!preg_match('/^[A-Za-z0-9-\.#_\!\^]{2,60}$/', $_POST['nick'])) $errors[] = "invalid nickname";
	if ($_POST['nick'] === $_POST['password']) $errors[] = "username and password may not be identical"; 
	if ($_POST['password'] !== $_POST['repeat_password']) $errors[] = "passwords don't match"; 
        if (!checkEmail($_POST['mail'])) $errors[] = 'invalid e-mail address';
	if (strlen($_POST['password']) < 6) $errors[] = "password is too short";
	if ($_POST['spam'] !== 'iamnotarobot') $errors[] = "spam check not completed";
	if (is_logged_in()) $errors[] = "you're already logged in";
	if (!preg_match('/[A-Z]/', $_POST['password'])
		|| !preg_match('/[a-z]/', $_POST['password'])
		|| !preg_match('/[0-9]/', $_POST['password'])
		|| !preg_match('/[^\w]/', $_POST['password'])) {
		$errors[] = 'password should include at least one upper case letter, one lower caser letter, one number and one special character';
	}

	$chk = fetchOne("SELECT 1 FROM users WHERE nick=:nick", [ ":nick" => $_POST['nick'] ] );
	if ($chk) $errors[] = "nickname already in use";
	$chk = fetchOne("SELECT 1 FROM users WHERE mail=:mail", [ ":mail" => $_POST['mail'] ] );
	if ($chk) $errors[] = "e-mail address already in use";

	if (count($errors) == 0) {
		$pwhash = password_hash($_POST['password'], PASSWORD_BCRYPT, array('cost' => 13));
		$create = doQuery("INSERT INTO users
			(nick, crew, pwhash, lastactive, current, mail, uploaded, `rank`, upload_signature, list_view_mode, display_mail, nickurl)
			VALUES 
			(:nick,'Independent', :pwhash, :now, '', :mail, 0, 'Inactive', '- -- - aSCIIaRENa - ---- - aSCIIaRENa - -- -','Standard', 'No', :nickurl)",
			[ ":nick" => $_POST['nick'], ":pwhash" => $pwhash, ":now" => time(), ":mail" => $_POST['mail'], ":nickurl" => urlsafe($_POST['nick']) ]
			);

		$message = "WELCOME TO aSCIIaRENA!\n\n".

			"To fully enjoy aSCIIaRENA, you should head over to your \"crib\" and personalize\n".
			"the viewing settings. You can change things such as the default colors of ASCII\n".
			"collys and the default viewing mode when listing collys/files.\n".
			"Do check out the BBS listing mode! =)\n\n".

			"You can also edit your upload signature etc.\n\n".

			"After that you are ready for axxion! You can not only submitASCII collys, you\n".
			"can comment and vote on collys.<br><br>".

			"When you vote on a colly, the artist that made the colly and the crew that\n".
			"released it will get scores too, meaning that the artist top and the crew top\n".
			"are all based on the votes that you cast on collys. So go vote to prop your\n".
			"favourite collys/artists/crews!\n\n".

			"/ sPOT^uP rOUGH [aSCIIaRENA sYSOP]\n";

		$user_id = fetchOne("SELECT id FROM users WHERE nick=:nick AND mail=:mail", [ ":nick" => $_POST['nick'], ":mail" => $_POST['mail'] ])->id;
		$from_id = 2;
		$postername = 'Spot';
		$subject = 'Welcome!';

		$msg = doQuery("INSERT INTO messages 
			(thread, from_id, to_id, postedto, postername, timestamp, subject, message)
			VALUES
			((select max(thread)+1 from messages m), :from_id, :to_id, :postedto, :postername, :timestamp, :subject, :message)", 
			[ ":from_id" => $from_id, ":to_id" => $user_id, ":postedto" => $_POST['nick'], ":postername" => $postername, 
				":timestamp" => time(), ":subject" => $subject, ":message" => $message ]);


		$mail_qs = qsencrypt(array($user_id, $_POST['nick'], time()));
		$mail_from = 'asciiarenamailer@gmail.com';
		$mail_to = $_POST['nick'].' <'.$_POST['mail'].'>';
		$mail_subject = "aSCIIaRENa Account Activation";
		$mail_body = "Hi ".$_POST['nick']."! \n\n".
			"Your aSCIIaRENA account is ready for use,\n".
			"click the link to activate it.\n".
			"https://www.asciiarena.se/register.php?confirm=".$mail_qs."\n";
		$mail_headers = 'From: <'.$mail_from.'>';
		mail($mail_to, $mail_subject, $mail_body, $mail_headers);
	}
} // $_POST['join']

if (isset($_GET['confirm'])) {
	if (preg_match('/^[a-z0-9-]+$/i', $_POST['confirm'])) $errors[] = "invalid URL (0)"; 
	list ($user_id, $nick, $e) = qsdecrypt($_GET['confirm']);
	if (isset($e) && $e < (time()-604800)) $errors[] = "activation link has expired";
	if (!preg_match('/^\d+$/', $user_id)) $errors[] = "invalid URL (1)";
	$chk_user = fetchOne("SELECT 1 FROM users WHERE nick=:nick AND id=:id", [ ":id" => $user_id, "nick" => $nick ] );
	if (!$chk_user) $errors[] = "invalid user account";
	$chk_joined = fetchOne("SELECT 1 FROM users WHERE joined IS NOT NULL AND nick=:nick AND id=:id", [ ":id" => $user_id, "nick" => $nick ] );
	if ($chk_joined) $errors[] = "account is already activated";
	if (is_logged_in()) $errors[] = "you're already logged in";

	if (count($errors) == 0) {
		$ask = "UPDATE users SET `rank`='User', joined=:now WHERE nick=:nick AND id=:id";
		doQuery($ask, [ ":now" => time(), ":nick" => $nick, ":id" => $user_id] );
		$messages[] = 'Your account has been activated, you can now  <a class="ascii" data-toggle="modal" style="padding-right: 8px;" href="#login">logon</a>';
	} else {
		$errors[] = 'account activation has failed';
	}
}

$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
$now = time();
include "header.php";
?>
<div class="modal-body row m-0 p-0">
<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
<div class="row">
	<div class="col-12 d-flex justify-content-md-center">
		<img src="assets/data/register.png">
	</div>
</div>
<br/>
<?php if (is_array($errors) && count($errors) > 0) { ?>
	<div class="row">
		<div class="col-lg-12">
			<div class="bs-component aml-1 amb-1">
				<div class="alert alert-danger"><ul><?php foreach ($errors as $error) { ?> <li><?=$error?></li> <?php } ?></ul></div>
			</div>
		</div>
	</div>
<?php } elseif (is_array($messages) && count($messages) > 0) { ?>
	<div class="row">
		<div class="col-lg-12">
			<div class="bs-component aml-1 amb-1">
				<div class="alert alert-success"><ul><?php foreach ($messages as $message) { ?> <li><?=$message?></li> <?php } ?></ul></div>
			</div>
		</div>
	</div>
<?php } ?>
<?php if (isset($_POST['join']) && $create) { ?>
<div class="row">
	<div class="col-12 text-center apt-1">
		<span>Your account has been created, a mail with instructions has been sent to your e-mail adress.</span>
	</div>
</div>
<?php } elseif (isset($_GET['confirm'])) { ?>
<!-- account (not) activated -->
<?php } else { ?>
<form action="/register.php" method="post">
	<div class="container-fluid bg-secondary amb-1 apb-1">
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
				<input type="text" name="nick" class="w-100" value="<?=$_POST['nick']?>"> 
			</div>
			<div class="col-6">
				<input type="password" name="password" class="w-100" value="">
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
				<input type="text" name="mail" class="w-100" value="<?=$_POST['mail']?>">
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
				<input type="text" name="spam" class="w-100" value="<?=$_POST['spam']?>"> 
			</div>
		</div>
		<div clas="row">
			<input type="submit" value="Join!" name="join">
		</div>
	</div>
</form>
<?php } // else ($create) ?>

</div>
<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
	<?php include "sidebar.php"; ?>
</div>
<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
	<?php include "sidebar_right.php"; ?>
</div>
</div>
<?php include "footer.php"; ?>
