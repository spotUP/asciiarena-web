<?php
// Autoload all classes in classes/*
spl_autoload_register(function ($class_name) {
	include __DIR__ . "/classes/" . $class_name . '.php';
});

require_once "session.php";
$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
include "header.php";

?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
		<?php
		if (is_logged_in())
		{
			$showmember=$nick;

			if(isset($_POST['def_font']))
			{
				$def_font=$_POST['def_font'];

				$ask="update users set def_font=:def_font where nick=:nick";
				doQuery($ask, [ 'def_font' => $def_font, 'nick' => $nick ] );
			}

			if(isset($_POST['set_def_fg_col']))
			{
				$def_bg_col=$_POST['set_def_bg_col'];
				$def_fg_col=$_POST['set_def_fg_col'];

				$ask="update users set def_bg_col=:def_bg_col where nick=:nick";
				doQuery($ask, [ 'def_bg_col' => $def_bg_col, 'nick' => $nick ]);

				$ask="update users set def_fg_col=:def_fg_col where nick=:nick";
				doQuery($ask, [ 'def_fg_col' => $def_fg_col, 'nick' => $nick ]);
			}

			if(isset($_POST['changeuploadsignature']))
			{
				$upsig=$_POST['changeuploadsignature'];
				$upsig=str_replace('\\',"&#92;",$upsig);

				$ask="update users set upload_signature=:upsig where nick=:nick";
				doQuery($ask,[ 'upsig' => $upsig, 'nick' => $nick ]);	
			}

			if(isset($_POST['changenick']))
			{
				$changenick=$_POST['changenick'];
				$ask="update users set nick=:changenick where nick=:nick";
				doQuery($ask,[ 'changenick' => $changenick, 'nick' => $nick ]);	

				$_SESSION['nick'] = $changenick;
				?>
				<meta http-equiv="Refresh" content="2"; url="crib.php">
				<?php
			}
			if(isset($_POST['changecrew']))
			{
				$changecrew=$_POST['changecrew'];
				$ask="update users set crew=:changecrew where nick=:nick";
				doQuery($ask,[ 'changecrew' => $changecrew, 'nick' => $nick ]);	
			}
			if(isset($_POST['changebyear']))
			{
				$changebyear=$_POST['changebyear'];
				$ask="update users set byear=:changebyear where nick=:nick";
				doQuery($ask,[ 'changeyear' => $changeyear, 'nick' => $nick ]);	
			}
			if(isset($_POST['changebmonth']))
			{
				$changebmonth=$_POST['changebmonth'];
				$ask="update users set bmonth=:changebmonth where nick=:nick";
				doQuery($ask,[ 'changebmonth' => $changebmonth, 'nick' => $nick ]);	
			}
			if(isset($_POST['changebday']))
			{
				$changebday=$_POST['changebday'];
				$ask="update users set bday=:changebday where nick=:nick";
				doQuery($ask,[ 'changebday' => $changebday, 'nick' => $nick ]);	
			}
			if(isset($_POST['changecountry']))
			{
				$changecountry=$_POST['changecountry'];
				$ask="update users set country=:changecountry where nick=:nick";
				doQuery($ask,[ 'changecountry' => $changecountry, 'nick' => $nick ]);	
			}
			if(isset($_POST['changemessenger']))
			{
				$changemessenger=$_POST['changemessenger'];
				$ask="update users set messenger=:changemessenger where nick=:nick";
				doQuery($ask,[ 'changemessenger' => $changemessenger, 'nick' => $nick ]);	
			}
			if(isset($_POST['changemail']))
			{
				$mail=$_POST['changemail'];

				$mail = trim($_POST['changemail']);  
				if(!checkEmail($mail)) 
				{
					?>FAILURE! Error! You must enter a valid E-Mail adress!<?php
					?><meta http-equiv="Refresh" content="3"; url="crib.php"><?php
					exit;
				}

				$ask="update users set mail=:mail where nick=:nick";
				doQuery($ask,[ 'mail' => $mail, 'nick' => $nick ]);	
			}
			if(isset($_POST['display_mail']))
			{
				$display_mail=$_POST['display_mail'];
				$ask="update users set display_mail=:display_mail where nick=:nick";
				doQuery($ask,[ 'display_mail' => $display_mail, 'nick' => $nick ]);	
			}
			if(isset($_POST['display_messenger']))
			{
				$display_messenger=$_POST['display_messenger'];
				$ask="update users set display_messenger=:display_messenger where nick=:nick";
				doQuery($ask,[ 'display_messenger' => $display_messenger, 'nick' => $nick ]);	
			}
			if(isset($_POST['changelistviewmode']))
			{
				$changelistviewmode=$_POST['changelistviewmode'];
				$ask="update users set list_view_mode=:changelistviewmode where nick=:nick";
				doQuery($ask,[ 'changelistviewmode' => $changelistviewmode, 'nick' => $nick ]);	
			}		
			if(isset($_POST['old_password']))
			{
				$old_password=$_POST['old_password'];
				$new_password=$_POST['new_password'];
				$repeat_password=$_POST['repeat_password'];	

				$old_password=md5($old_password);		
				$new_password=md5($new_password);		
				$repeat_password=md5($repeat_password);		

				if ($new_password != $repeat_password)
				{
					?>
					Error
					The new passwords you entered doesn't match!	

					<meta http-equiv="Refresh" content="3"; url="crib.php">
					<?php	
					exit;		
				}

				$ask="select pwhash from users where nick=:nick";
				$result=fetchAll($ask, [ 'nick' => $nick ]);
				foreach($result as $row)
				{
					$pwhash=$row->pwhash;		
				}

				if ($pwhash != $old_password)
				{
					?>
					Error
					The old password is wrong!
					<meta http-equiv="Refresh" content="3"; url="crib.php">
					<?php	
					exit;		
				}

				$pwlenght=$_POST['new_password'];
				$pwlenght=(strlen($pwlenght));
				if ($pwlenght < 6)
				{
					?>
					Error
					The password must contain 6 characters!	
					<meta http-equiv="Refresh" content="2"; url="crib.php">
					<?php
					exit;
				}

				if ($pwhash == $old_password)
				{
					$ask="update users set pwhash=:new_password where nick=:nick";
					doQuery($ask,[ 'new_password' => $new_password, 'nick' => $nick ]);	
					$password=$_POST['new_password'];
					$_SESSION['password'] = $password;
				}
			}			

//-----------------------------------------------------------------------------
// USER SETTINGS
//-----------------------------------------------------------------------------
			?>
			<form enctype="multipart/form-data" action="crib.php" method="post">
				<?php
				$ask="select * from users where nick=:nick";
				$result=fetchAll($ask, [ 'nick' => $nick ]);
				foreach($result as $row)
				{
					$show_nick=$row->nick;
					$show_crew=$row->crew;
					$show_byear=$row->byear;
					$show_bmonth=$row->bmonth;
					$show_bday=$row->bday;
					$show_country=$row->country;
					$show_avatar=$row->avatar;
					$show_mail=$row->mail;
					$show_webpage=$row->webpage;		
					$show_uploadsignature=$row->upload_signature;
					$base64=$row->sigbase64;
					$show_sigdata=$row->sigdata;
					$show_sigdata=fixOutputEdit($show_sigdata);
					$show_viewmode=$row->list_view_mode;
					$def_bg_col=$row->def_bg_col;
					$def_fg_col=$row->def_fg_col;
					$show_display_mail=$row->display_mail;
					$sigfont=$row->forum_sig_font;
					$sigcolor=$row->forum_sig_color;
					$show_def_font=$row->def_font;
					?>


					<div class="row amb-1">
						<div class="col-12">
							User Settings
						</div>
					</div>

					<div class="row amb-1">
						<div class="col-6">
							Nick: 
							<input type="text" maxlength="14" name="changenick" value="<?=$show_nick?>">
						</div>
						<div class="col-6">
							Crew: 
							<input type="text" name="changecrew" value="<?=$show_crew?>"> 
						</div>
					</div>

					<div class="row amb-1">
						<div class="col-6">			
							Birth:
							<select name='changebyear'>
								<?php
								echo "<option>$show_byear</option>";
								$countyear=1900;
								$maxyear=date("Y")-5;
								while($countyear<$maxyear)
								{
									echo "<option>$countyear</option>";
									$countyear++;
								}
								echo "</select>";	
								echo "<select name='changebmonth'>";
								if ($show_bmonth<10)
									echo "<option selected='selected'>0$show_bmonth</option>"; 
								if ($show_bmonth>9)	
									echo "<option selected='selected'>$show_bmonth</option>";
								$countmonth=1;
								$maxmonth=12;
								while($countmonth<=$maxmonth)
								{
									if ($countmonth<10)
										echo "<option>0$countmonth</option>"; 
									if ($countmonth>9)	
										echo "<option>$countmonth</option>";

									$countmonth++;
								}
								echo "</select>";

								echo "<select name='changebday'>";
								if ($show_bday<10)	
									echo "<option selected='selected'>0$show_bday</option>"; 
								if ($show_bday>9)	
									echo "<option selected='selected'>$show_bday</option>";
								$countday=1;
								$maxday=31;
								while($countday<=$maxday)
								{
									if ($countday<10)
										echo "<option>0$countday\n</option>"; 
									if ($countday>9)	
										echo "<option>$countday\n</option>";
									$countday++;
								}
								?>
							</select>		
						</div>
						<div class="col-6">
							Country:
							<select name="changecountry"> 
								<?php
								if (!empty($show_country))
								{
									?><option selected="selected" value="<?=$show_country?>"/><?=$country_list["$show_country"]?></option><?php
								}
								else
								{
									echo "<option selected='selected' value=\"$symbol\">Unknown</option>";					
								}

								foreach($country_list as $symbol => $country)
								{
									echo "<option value=\"$symbol\">$country</option>";
								}
								echo "</select>";
								?>
							</div>
						</div>

						<div class="row amb-1">
							<div class="col-6">		
								Mail:
								<input type="text" name="changemail" value="<?=$show_mail?>">
							</div>
							<div class="col-6">		
								Show E-Mail address:
								<select name="display_mail">
									<option selected="selected"><?=$show_display_mail?></option>
									<?php
									if($show_display_mail!=Yes)
										echo "<option>Yes</option>";
									if($show_display_mail!=No)
										echo "<option>No</option>"; 
									?>
								</select>
							</div>
						</div>
						<div class="row amb-1">
							<div class="col-12">
								Password Settings
							</div>
						</div>
						<div class="row amb-1">
							<div class="col-6">	
								Enter old password
								<input type="password" name="old_password">
							</div>
						</div>
						<div class="row amb-1">
							<div class="col-6">						
								Enter new password
								<input type="password" name="new_password">
							</div>
							<div class="col-6">						
								Repeat new password
								<input type="password" name="repeat_password">
							</div>
						</div>
						<div class="row amb-1">
							<div class="col-12">
								Site Settings
							</div>
						</div>
						<div class="row amb-1">
							<div class="col-6">		
								Upload Signature:

								<input type="text" size="44" maxlength="44" name="changeuploadsignature" value="<?=$show_uploadsignature?>">
							</div>
							<div class="col-6">		
								Default file list mode:
								<select name="changelistviewmode">
									<option selected="selected"><?=$show_viewmode?></option>
									<?php
									if($show_viewmode!=BBS)
										echo "<option>BBS</option>";
									if($show_viewmode!=Standard)
										echo "<option>Standard</option>"; ?>
								</select>
							</div>
						</div>

						<div class="row amb-1">
							<div class="col-6">	
								Default Colly Background:

								<select name="set_def_bg_col">
									<option selected="selected" value="<?=$def_bg_col?>" /><?=$bg_color_list["$def_bg_col"]?></option>
									<option class='black' value="#000000">Black</option>
									<option class='darkblue' value="#0000aa">Dark Blue</option>
									<option class='darkgreen' value="#00aa00">Dark Green</option>
									<option class='darkcyan' value="#00aaaa">Dark Cyan</option>
									<option class='darkred' value="#aa0000">Dark Red</option>
									<option class='magenta' value="#aa00aa">Magenta</option>
									<option class='brown' value="#aa5500">Brown</option>
									<option class='darkgrey' value="#555555">Dark Grey</option>
									<option class='grey' value="#aaaaaa">Grey</option>
									<option class='blue' value="#5555ff">Blue</option>
									<option class='green' value="#55ff55">Green</option>
									<option class='cyan' value="#5555ff">Cyan</option>
									<option class='red' value="#ff5555">Red</option>
									<option class='magenta' value="#ff55ff">Magenta</option>
									<option class='yellow' value="#ffff55">Yellow</option>
									<option class='white' value="#ffffff">White</option>
								</select>
							</div>
							<div class="col-6">	
								Default Colly Foreground:
								<select name="set_def_fg_col">
									<option selected="selected" value="<?=$def_fg_col?>" /><?=$fg_color_list["$def_fg_col"]?></option>
									<option class='black' value="0,0,0">Black</option>
									<option class='darkblue' value="0,0,170">Dark Blue</option>
									<option class='darkgreen' value="0,170,0">Dark Green</option>
									<option class='darkcyan' value="0,170,170">Dark Cyan</option>
									<option class='darkred' value="170,0,0">Dark Red</option>
									<option class='magenta' value="170,0,170">Magenta</option>
									<option class='brown' value="170,85,0">Brown</option>
									<option class='darkgrey' value="85,85,85">Dark Grey</option>
									<option class='grey' value="170,170,170">Grey</option>
									<option class='blue' value="85,85,255">Blue</option>
									<option class='green' value="85,255,85">Green</option>
									<option class='cyan' value="85,85,255">Cyan</option>
									<option class='red' value="255,85,85">Red</option>
									<option class='magenta' value="255,85,255">Magenta</option>
									<option class='yellow' value="255,255,85">Yellow</option>
									<option class='white' value="255,255,255">White</option>
								</select>
							</div>
						</div>
						<div class="row amb-1">
							<div class="col-6">	
								Default Colly Font:

								<select name='def_font'>
									<?php
									echo "<option selected='selected'>$show_def_font</option>";
									if ($show_def_font != "topaz")			
										echo "<option value='topaz'>Topaz</option>";
									if ($show_def_font != "microknight")			
										echo "<option value='microknight'>MicroKnight</option>";
									if ($show_def_font != "mosoul")			
										echo "<option value='mosoul'>mO'sOul</option>";
									if ($show_def_font != "pot-noodle")			
										echo "<option value='pot-noodle'>P0T-NOoDLE</option>";
									?>
								</select>
							</div>
						</div>

						<div class="row amb-1">
							<div class="col-12">	
								<input type="submit" value="Change">
							</div>
						</div>
					</form>	
					<?php
				}
			}
			else
			{
				?>
				Please Login!
				<br>You need to be logged in to use this feature.
				<a href=login.php>LOGiN.</a>
				<?php
			}
			?>

		</div>


		<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
			<?php include "sidebar.php"; ?>
		</div>
		<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
			<?php include "sidebar_right.php"; ?>
		</div>
	</div>
	<?php include "footer.php"; ?>



