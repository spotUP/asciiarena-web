<?php
require_once "session.php";
include "tools/mail.php";

$errors = array();
$messages = array();

if(isset($_POST['reminder'])) {
        if (!checkEmail($_POST['mail'])) $errors[] = 'invalid e-mail address';
	if ($_POST['spam'] !== 'iamnotarobot') $errors[] = "spam check not completed";
	if (is_logged_in()) $errors[] = "you're already logged in";

	$user_id = fetchOne("SELECT id FROM users WHERE mail=:mail", [ ":mail" => $_POST['mail'] ])->id;
	if (!$user_id) $errors[] = "unknown e-mail address";

	if (count($errors) == 0) {
		$mail_qs = qsencrypt(array($user_id, $_POST['mail'], time()));
		$mail_to = $_POST['mail'];
		$mail_subject = "aSCIIaRENA Password Reminder";
		$mail_body = "Hi!\n\n" .
			"Someone requested that your aSCIIaRENA password should be reset.\n".
			"Hopefully it was you. Click this <a href=\"https://www.asciiarena.se/reminder.php?reset=".$mail_qs."\">link</a> to reset your password.\n";
		sendmail($mail_to, $mail_subject, $mail_body);
		$reminder_mail = true;
	}

} // $_POST['reminder']

if (isset($_GET['reset'])) {
	if (!preg_match('/^[a-z0-9-]+$/i', $_GET['reset'])) $errors[] = "invalid URL (0)"; 
	list ($user_id, $mail, $e) = qsdecrypt($_GET['reset']);
	if (isset($e) && $e < (time()-14400)) $errors[] = "reset link has expired";

	if (count($errors) == 0) {
		$nick = fetchOne("SELECT nick FROM users WHERE mail=:mail", [ ":mail" => $mail ])->nick;
		$password_modify = true;
	}
} // $_GET['reset']

if (isset($_POST['save'])) {
	if (strlen($_POST['password']) < 5) $errors[] = "password is too short";
	if ($_POST['password'] !== $_POST['repeat_password']) $errors[] = "passwords don't match"; 
	$nick = fetchOne("SELECT nick FROM users WHERE mail=:mail", [ ":mail" => $mail ])->nick;
	if ($nick === $_POST['password']) $errors[] = "username and password may not be identical";

	if (count($errors) == 0) {
		list ($user_id, $mail, $e) = qsdecrypt($_POST['reset']);
		$pwhash = password_hash($_POST['password'], PASSWORD_BCRYPT, array('cost' => 13));
		$q = doQuery("UPDATE users SET pwhash=:pwhash WHERE id=:id",[ 'pwhash' => $pwhash, 'id' => $user_id ]);
		$password_changed = true;
		$messages[] = "password saved";
	}
} // $_POST['save']

$h1 = ["pASSWORD rECOVERY"];

include "header.php";
?>
<div class="modal-body row m-0 p-0">
<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
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
<?php if (isset($reminder_mail) && $reminder_mail) { ?>
<div class="row">
	<div class="col-12 text-center apt-1">
		<span>A mail with instructions has been sent to your e-mail adress.</span>
	</div>
</div>
<?php } elseif (isset($password_changed) && $password_changed) { ?>
	<p>Your password has been changed, you can now  <a class="ascii" data-toggle="modal" style="padding-right: 8px;" href="#login">logon</a></p>
<?php } elseif (isset($password_modify) && $password_modify) { ?>
<form action="" method="post">
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
				<?=$nick?>
			</div>
			<div class="col-6">
				<input type="password" name="password" class="w-100" value="">
			</div>
		</div>
		<div class="row">
			<div class="col-6">
				<span class="white">E-Mail</span>
			</div>
			<div class="col-6">
				<span class="white">Repeat password</span>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-6">
				<?=$mail?>
			</div>
			<div class="col-6">
				<input type="password" name="repeat_password" class="w-100">
			</div>
		</div>
		<div clas="row">
			<input type="hidden" value="<?=$_GET['reset']?>" name="reset">
			<input type="submit" value="Save!" name="save">
		</div>
	</div>
</form>
<?php } else { ?>
<form action="reminder.php" method="post">
	<div class="container-fluid bg-secondary amb-1 apb-1">

		<div class="row">
			<div class="col-6">
				E-Mail 
			</div>
		</div>

		<div class="row apb-1">
			<div class="col-6">
				<input type="text" name="mail" class="w-100" value="<?=$_POST['mail']?>">
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
			<input type="submit" value="Reset!" name="reminder">
		</div>
	</div>
</form>
<?php } // else ($reminder) ?>

</div>
<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
	<?php include "sidebar.php"; ?>
</div>
<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
	<?php include "sidebar_right.php"; ?>
</div>
</div>
<?php include "footer.php"; ?>
