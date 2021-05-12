<?php
require_once "session.php";

$errors = array();
$messages = array();

if (!is_logged_in()) {
	$errors[]  = 'You need to be <a class="ascii" data-toggle="modal" style="padding-right: 8px;" href="#login">logged in</a>to use this feature.';
} else {

	if(isset($_POST['Save'])) {
		if (preg_match('/^[A-Za-z0-9-\.#_\!\^]{2,60}$/', $_POST['nick'])) {
			$_SESSION['_user']['nick'] = $_POST['nick'];
		} else {
			$errors[] = 'invalid nickname';
		}
		if(!checkEmail($_POST['mail'])) {
			$errors[] = 'invalid e-mail address';
		}

		if(!preg_match('/^#[A-Fa-f0-9]+$/', $_POST['def_bg_col'])) $errors[] = 'invalid background color';
		if(!preg_match('/^#[A-Fa-f0-9]+$/', $_POST['def_fg_col'])) $errors[] = 'invalid foreground color';

		$_POST['display_mail'] = ($_POST['display_mail'] === 'Yes') ? 'Yes' : 'No';
		$_POST['viewmode'] = ($_POST['viewmode'] === 'BBS') ? 'BBS' : 'Standard';

		$crt_effect = (isset($_POST['crt_effect']) && $_POST['crt_effect'] == 1) ? 'Y' : 'N';
		$_SESSION['_user']['settings']['crt_effect'] = $crt_effect;

		if (count($errors) == 0) {
			$ask="update users set nick=:nick, crew=:crew, byear=:byear, bmonth=:bmonth, bday=:bday, country=:country,
			mail=:mail, display_mail=:display_mail,
			def_font=:def_font, def_bg_col=:def_bg_col, def_fg_col=:def_fg_col, upload_signature=:upload_signature, crt_effect=:crt_effect where id=:id";
			$q = doQuery($ask,[ 'nick' => $_POST['nick'], 'crew' => $_POST['crew'], 'byear' => $_POST['byear'], 'bmonth' => $_POST['bmonth'], 'bday' => $_POST['bday'], 'country' => $_POST['country'],
				'mail' => $_POST['mail'], 'display_mail' => $_POST['display_mail'],
				'def_font' => $_POST['def_font'], 'def_bg_col' => $_POST['def_bg_col'], 'def_fg_col' => $_POST['def_fg_col'], 'upload_signature' => $_POST['upload_signature'], 'crt_effect' => $crt_effect, 
				'id' => $_user['id'] ]);
			if ($q) $messages[] = 'settings successuflly saved';
		}

		if (isset($_POST['old_password']) && strlen($_POST['old_password']) > 0
			&& isset($_POST['new_password']) && strlen($_POST['old_password']) > 0
			&& isset($_POST['repeat_password']) && strlen($_POST['repeat_password']) > 0
		) {

			if (strlen($_POST['new_password']) < 6) $errors[] = 'new password is too short';
		if ($_POST['password'] !== $_POST['repeat_password']) $errors[] = "passwords don't match";
		if (!preg_match('/[A-Z]/', $_POST['password'])
			|| !preg_match('/[a-z]/', $_POST['password'])
			|| !preg_match('/[0-9]/', $_POST['password']) 
			|| !preg_match('/[^\w]/', $_POST['password'])) {
			$errors[] = 'password should include at least one upper case letter, one lower caser letter, one number and one special character';
	}

	$spw = fetchOne("SELECT pwhash FROM users WHERE (id = :id)", [ ":id" => $_user['id'] ])->pwhash;
	if (preg_match('/^[a-f0-9]{32}$/i', $spw)) {
		if (md5($_POST['old_password']) !== $spw) $errors[] = 'old password is incorrect';
		$pwhash = password_hash($_POST['new_password'], PASSWORD_BCRYPT, array('cost' => 13));
	} else {
		if (password_verify($_POST['old_password'], $spw)) {
			$pwhash = password_hash($_POST['new_password'], PASSWORD_BCRYPT, array('cost' => 13));
		} else {
			$errors[] = 'old password is incorrect';
		}
	}
	if (count($errors) == 0) {
		$q = doQuery("UPDATE users SET pwhash=:pwhash WHERE id=:id",[ 'pwhash' => $pwhash, 'id' => $_user['id'] ]);
		if ($q) $messages[] = 'password successuflly updated';
	}
}
$_user = $_SESSION['_user'];
}

$ask="select * from users where nick=:nick";
$row=fetchOne($ask, [ 'nick' => $_user['nick'] ]);
if ($row) {
	$nick = $row->nick;
	$crew = $row->crew;
	$byear = $row->byear;
	$bmonth = $row->bmonth;
	$bday = $row->bday;
	$country = $row->country;
	$mail = $row->mail;
	$webpage = $row->webpage;            
	$upload_signature = $row->upload_signature;
	$viewmode = $row->list_view_mode;
	$def_bg_col = $row->def_bg_col ?? "#000000";
	$def_fg_col = $row->def_fg_col ?? "#ffffff";
	$display_mail = $row->display_mail;
	$def_font = $row->def_font;
	$crt_effect = $row->crt_effect;
} elseif (is_logged_in()) {
	$errors[] = 'unable to retrieve user data';
}
}

$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
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
		<?php if (is_logged_in()) { ?>
			<form enctype="multipart/form-data" action="/crib.php" method="post">
				<div class="row amb-1">
					<div class="col-12">
						<span class="white">User Settings</span>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">
						Nick: 
					</div>
					<div class="col-3">
						<input type="text" class="w-100" maxlength="14" name="nick" value="<?=$nick?>">
					</div>
					<div class="col-2">
						Crew: 
					</div>
					<div class="col-4">
						<input type="text" class="w-100" name="crew" value="<?=$crew?>"> 
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">			
						Birth:
					</div>
					<div class="col-3">
						<select class="select2" name="byear">
							<?php for ($i=1920; $i<(date('Y')-5); $i++) { ?>
								<option <?=($byear == $i) ? 'selected' : ''?>><?=$i?></option>
							<?php } ?>
						</select>
						<select class="select2" name="bmonth">
							<?php for ($i=1; $i<=12; $i++) { ?>
								<option <?=($bmonth == $i) ? 'selected' : ''?>><?=$i?></option>
							<?php } ?>
						</select>
						<select class="select2" name="bday">
							<?php for ($i=1; $i<=31; $i++) { ?>
								<option <?=($bday == $i) ? 'selected' : ''?>><?=$i?></option>
							<?php } ?>
						</select>
					</div>
					<div class="col-2">
						Country:
					</div>
					<div class="col-4">
						<select class="select2" name="country"> 
							<?php foreach($country_list as $symbol => $scountry) { ?>
								<option value="<?=$symbol?>" <?=($country == $symbol) ? 'selected' : ''?>><?=$country_list[$symbol]?></option>
							<?php } ?>
						</select>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">		
						Mail:
					</div>
					<div class="col-3">		
						<input type="text" class="w-100" name="mail" value="<?=$mail?>">
					</div>
					<div class="col-2">		
						Show E-Mail:
					</div>
					<div class="col-4">	
						<select class="select2" name="display_mail">
							<option <?=($display_mail === 'Yes') ? 'selected' : ''?>>Yes</option>
							<option <?=($display_mail === 'No') ? 'selected' : ''?>>No</option>
						</select>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-12 apt-1">
						<span class="white">Password Settings</span>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">	
						Old password
					</div>
					<div class="col-3">	
						<input type="password" class="w-100" name="old_password">
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">						
						New password
					</div>
					<div class="col-3">						
						<input type="password"  class="w-100" name="password">
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">						
						New password again
					</div>
					<div class="col-3">						
						<input type="password" class="w-100" name="repeat_password">
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-12 apt-1">
						<span class="white">Site Settings</span>
					</div>
				</div>

				<div class="row amb-1">
					<div class="col-3">		
						File list mode:
					</div>
					<div class="col-3">	
						<select class="select2" name="viewmode">
							<option <?=($viewmode === 'Standard') ? 'selected' : ''?>>Standard</option>
							<option <?=($viewmode === 'BBS') ? 'selected' : ''?>>BBS</option>
						</select>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">	
						Default Colly BG:
					</div>
					<div class="col-3">	
						<select class="custom-select" id="colorselector_1" name="def_bg_col">
							<option style="display: none;" id="selcol-1" selected="selected" value="<?=$def_bg_col?>" data-color="<?=$def_bg_col?>"></option>
							<option value='#555555' data-color="#555555">Bright Black</option>
							<option value='#5555ff' data-color="#5555ff">Bright Blue</option>
							<option value='#ff55ff' data-color="#ff55ff">Bright Magenta</option>
							<option value='#ff5555' data-color="#ff5555">Bright Red</option>
							<option value='#ffff55' data-color="#ffff55">Brigt Yellow</option>
							<option value='#55ff55' data-color="#55ff55">Bright Green</option>
							<option value='#55FFFF' data-color="#55FFFF">Bright Cyan</option>
							<option value='#ffffff' data-color="#ffffff">White</option>
							<option value='#000000' data-color="#000000">Black</option>
							<option value='#0000aa' data-color="#0000aa">Blue</option>
							<option value='#aa00aa' data-color="#aa00aa">Magenta</option>
							<option value='#aa0000' data-color="#aa0000">Red</option>
							<option value='#aa5500' data-color="#aa5500">Yellow</option>
							<option value='#00aa00' data-color="#00aa00">Green</option>
							<option value='#00aaaa' data-color="#00aaaa">Cyan</option>
							<option value='#aaaaaa' data-color="#aaaaaa">Grey</option>
						</select>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">	
						Default Colly FG:
					</div>
					<div class="col-3">	
						<select class="custom-select" id="colorselector_2" name="def_fg_col">
							<option id="selcol-2" selected="selected" value="<?=$def_fg_col?>" data-color="<?=$def_fg_col?>"></option>
							<option value='#555555' data-color="#555555">Bright Black</option>
							<option value='#5555ff' data-color="#5555ff">Bright Blue</option>
							<option value='#ff55ff' data-color="#ff55ff">Bright Magenta</option>
							<option value='#ff5555' data-color="#ff5555">Bright Red</option>
							<option value='#ffff55' data-color="#ffff55">Brigt Yellow</option>
							<option value='#55ff55' data-color="#55ff55">Bright Green</option>
							<option value='#55FFFF' data-color="#55FFFF">Bright Cyan</option>
							<option value='#ffffff' data-color="#ffffff">White</option>
							<option value='#000000' data-color="#000000">Black</option>
							<option value='#0000aa' data-color="#0000aa">Blue</option>
							<option value='#aa00aa' data-color="#aa00aa">Magenta</option>
							<option value='#aa0000' data-color="#aa0000">Red</option>
							<option value='#aa5500' data-color="#aa5500">Yellow</option>
							<option value='#00aa00' data-color="#00aa00">Green</option>
							<option value='#00aaaa' data-color="#00aaaa">Cyan</option>
							<option value='#aaaaaa' data-color="#aaaaaa">Grey</option>
						</select>
					</div>
				</div>
				<script>
					$(function() {
						window.prettyPrint && prettyPrint();
						$('#colorselector_1').colorselector();
						$('#colorselector_2').colorselector({
							callback : function(value, color, title) {
								$("#colorValue").val(value);
								$("#colorColor").val(color);
								$("#colorTitle").val(title);
							}
						});
						$("#setColor").click(function(e) {
							$("#colorselector_2").colorselector("setColor", "#008B8B");
						})
						$("#setValue").click(function(e) {
							$("#colorselector_2").colorselector("setValue", 18);
						})
					});
				</script>
				<div class="row amb-1">
					<div class="col-3">	
						Default Colly Font:
					</div>
					<div class="col-3">	
						<select class="select2" name='def_font'>
							<option <?=($def_font === 'mosoul') ? 'selected' : ''?>>mosoul</option>
							<option <?=($def_font === 'topaz') ? 'selected' : ''?>>topaz</option>
							<option <?=($def_font === 'microknight') ? 'selected' : ''?>>microknight</option>
							<option <?=($def_font === 'pot-noodle') ? 'selected' : ''?>>pot-noodle</option>
						</select>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">
						CRT screen effect:
					</div>
					<div class="col-3">
						<div class="form-group">
							<div class="custom-control custom-switch">
								<input type="checkbox" class="custom-control-input" id="customSwitch1" name="crt_effect" value="1" <?=($crt_effect === 'Y') ? 'checked' : '';?>>
								<label class="custom-control-label" for="customSwitch1"></label>
							</div>
						</div>
					</div>
				</div>
				<div class="row amb-1 apt-1">
					<div class="col-12">		
						<span class="white">Upload Signature:</span>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-6">		
						<input type="text" class="w-100" size="44" maxlength="44" name="upload_signature" value="<?=$upload_signature?>">
					</div>							
				</div>
				<div class="row amb-1">
					<div class="col-12 apt-1">	
						<input type="submit" class="btn-big" value="Save" name="Save">
					</div>
				</div>
			</form>	
		<?php } // is_logged_in() ?>
	</div>

	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>
</div>
<?php include "footer.php"; ?>
