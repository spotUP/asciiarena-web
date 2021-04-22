<?php
require_once "session.php";
$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
include "header.php";

?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
		<?php
		if (is_logged_in())
		{
			$nick=$_user['nick'];

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
				doQuery($ask,[ 'changebyear' => $changebyear, 'nick' => $nick ]);	
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
			if(isset($_POST['changelistviewmode']))
			{
				$changelistviewmode=$_POST['changelistviewmode'];
				$ask="update users set list_view_mode=:changelistviewmode where nick=:nick";
				doQuery($ask,[ 'changelistviewmode' => $changelistviewmode, 'nick' => $nick ]);	
			}		
			if(isset($_POST['old_password']) && $_POST['old_password'])
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
					$show_mail=$row->mail;
					$show_webpage=$row->webpage;		
					$show_uploadsignature=$row->upload_signature;
					$show_sigdata=$row->sigdata;
					$show_sigdata=fixOutputEdit($show_sigdata);
					$show_viewmode=$row->list_view_mode;
					$def_bg_col=$row->def_bg_col ?? "#000000";
					$def_fg_col=$row->def_fg_col ?? "#ffffff";
					$show_display_mail=$row->display_mail;
					$show_def_font=$row->def_font;
					?>


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
							<input type="text" class="w-100" maxlength="14" name="changenick" value="<?=$show_nick?>">
						</div>

						<div class="col-2">
							Crew: 
						</div>
						<div class="col-4">
							<input type="text" class="w-100" name="changecrew" value="<?=$show_crew?>"> 
						</div>
					</div>
					<div class="row amb-1">
						<div class="col-3">			
							Birth:
						</div>
						<div class="col-3">
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
						<div class="col-2">
							Country:
						</div>
						<div class="col-4">
							<select name="changecountry"> 
								<?php
								if (!empty($show_country))
								{
									?><option selected="selected" value="<?=$show_country?>"/><?=$country_list["$show_country"]?></option><?php
								}
								else
								{
									echo "<option selected='selected' value=\"\">Unknown</option>";
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
							<div class="col-3">		
								Mail:
							</div>
							<div class="col-3">		
								<input type="text" class="w-100" name="changemail" value="<?=$show_mail?>">
							</div>
							<div class="col-2">		
								Show E-Mail:
							</div>
							<div class="col-4">	
								<select name="display_mail">
									<option selected="selected"><?=$show_display_mail?></option>
									<?php
									if($show_display_mail!="Yes")
										echo "<option>Yes</option>";
									if($show_display_mail!="No")
										echo "<option>No</option>"; 
									?>
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
								<input type="password"  class="w-100" name="new_password">
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
								<select name="changelistviewmode">
									<option selected="selected"><?=$show_viewmode?></option>
									<?php
									if($show_viewmode!="BBS")
										echo "<option>BBS</option>";
									if($show_viewmode!="Standard")
										echo "<option>Standard</option>"; ?>
								</select>
							</div>
						</div>
						<div class="row amb-1">
							<div class="col-3">	
								Default Colly BG:
							</div>
							<div class="col-3">	
<!--								<select name="set_def_bg_col">
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
								</select> -->
								<select id="colorselector_1" name="set_def_bg_col">
									<option style="display: none;" id="selcol-1" selected="selected" value="<?=$def_bg_col?>" data-color="<?=$def_bg_col?>">Test</option>
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
								<select id="colorselector_2" name="set_def_fg_col">
									<option id="selcol-2" selected="selected" value="<?=$def_fg_col?>" data-color="<?=$def_fg_col?>">Test</option>
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
						<div class="row amb-1 apt-1">
							<div class="col-12">		
								<span class="white">Upload Signature:</span>
							</div>
						</div>

						<div class="row amb-1">
							<div class="col-6">		
								<input type="text" class="w-100" size="44" maxlength="44" name="changeuploadsignature" value="<?=$show_uploadsignature?>">
							</div>							
						</div>
						<div class="row amb-1">
							<div class="col-12 apt-1">	
								<input type="submit" value="Save">
							</div>
						</div>
					</form>	
					<?php
				}
			}
			else
			{
				?>
				<div class="col-lg-12">
					<div class="bs-component">
						<div class="animate__animated animate__shakeX alert alert-dismissible alert-primary">
							<button type="button" class="close" data-dismiss="alert">x</button>
							You need to be <a class="ascii" data-toggle="modal" style="padding-right: 8px;" href="#login">logged in</a>to use this feature.

						</div>
					</div>
				</div>
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



