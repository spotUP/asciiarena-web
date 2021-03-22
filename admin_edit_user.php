<?php
//--------------------------------------------------------------------------------
// EDIT USER FIELD
//--------------------------------------------------------------------------------

if(isset($_POST['getuser']) && is_admin())
{
	$getuser=$_POST['getuser'];
	$getuser=cleanInsert($getuser);

	$ask="select * from users where nick=:getuser";
	$result=fetchAll($ask, [ 'getuser' => $getuser]);
	foreach ($result as $row)
	{
		$show_user_nick=$row->nick;
		$show_user_www=$row->www;
		$show_user_status=$row->active;
		$show_user_crew=$row->crew;
		$show_user_country=$row->country;
		$show_user_acronym=$row->acronym;
		$show_user_rank=$row->rank;
	}
}
?>
<div class="tab-pane fade ap-1" id="edituser">
	<div class="row apb-1">
		<div class="col-12">
			<form enctype="multipart/form-data" action="#edituser" method="post">
				<div class="custom-select">
					<select name="getuser">
						<?php
						if (isset($show_user_nick))
						{
							?>
							<option selected value="$show_all_user_names"><?=$show_user_nick?></option>
							<?php
						}
						$ask="SELECT nick FROM users";
						$result=fetchAll($ask);
						foreach ($result as $row)
						{
							$show_all_user_names=$row->nick;
							?>
							<option><?=$show_all_user_names?></option>
							<?php
						}
						?>
					</select>
				</div>
			</form>
		</div>
	</div>

	<?php
	if (isset($_POST['getuser']))
	{
		$getuser=$_POST['getuser'];
		?>
		<div class="row ap-1">
			<form enctype="multipart/form-data" action="admin.php" method="post" class="w-100">
				<?php
				$ask="select * from users where nick=:getuser";
				$result=fetchAll($ask, [ 'getuser' => $getuser ]);

				foreach ($result as $row)
				{
					$show_user_nick    = $row->nick;
					$show_user_crew    = $row->crew;
					$show_user_byear   = $row->byear;
					$show_user_bmonth  = $row->bmonth;
					$show_user_bday    = $row->bday;
					$show_user_country = $row->country;
					$show_user_avatar  = $row->avatar;
					$show_user_mail    = $row->mail;
					$show_user_webpage = $row->webpage;		
					$show_user_sigdata = $row->sigdata;
					$show_user_rank    = $row->rank;
					$user_signature    = $row->signature;
					?>
					<div class="row apb-1">
						<div class="col-6">
							<span class="lightgrey">Nick:</span>
						</div>
						<div class="col-6">
							<input type="text" name="changeusernick" value="<?=$show_user_nick?>">
						</div>
					</div>
					<div class="row apb-1">
						<div class="col-6">
							<span class="lightgrey">Crew:</span>
						</div>
						<div class="col-6">
							<input type="text" name="changeusercrew" value="<?=$show_user_crew?>">
						</div>
					</div>
					<div class="row apb-1">
						<div class="col-6">
							<span class="lightgrey">Rank:</span>
						</div>
						<div class="col-6">
							<select name="edit_user_rank">
								<option selected="selected"><?=$show_user_rank?></option>
								<option>User</option>
								<option>Elite</option>
								<option>Admin</option>
							</select>
						</div>
					</div>
					<div class="row apb-1">
						<div class="col-6">
							<span class="lightgrey">Birth:</span>
							<select name="changeuserbyear"> 
								<option><?=$show_user_byear?></option>";
								<?php
								$countyear=1900;
								$maxyear=date("Y")-5;
								while($countyear<$maxyear)
								{
									?>
									<option><?=$countyear?></option>
									<?php
									$countyear++;
								}
								?>
							</select>
						</div>
						<div class="col-6">
							<select name="changeuserbmonth">
								<option><?=$show_user_bmonth?></option>
								<?php
								$countmonth=1;
								$maxmonth=12;
								while($countmonth<=$maxmonth)
								{
									?>
									<option><?=$countmonth?></option>
									<?php
									$countmonth++;
								}
								?>
							</select>

							<select name="changeuserbday">
								<option><?=$show_user_bday?></option>
								<?php
								$countday=1;
								$maxday=31;
								while($countday<=$maxday)
								{
									?>
									<option><?=$countday?></option>
									<?php
									$countday++;
								}
								?>
							</select>
						</div>

					</div>
					<div class="row apb-1">
						<div class="col-6">

							<span class="lightgrey">Country:</span>
						</div>
						<div class="col-6">

							<select name="changeusercountry">
								<?php
								if (!empty($show_user_country))
								{
									?>
									<option selected value="<?=$symbol?>"><?=$show_user_country?></option>
									<?php
								}
								else
								{
									?>
									<option selected value="<?=$symbol?>">Unknown</option>
									<?php				
								}
								foreach($country_list as $symbol => $country)
								{
									?>
									<option value="<?=$symbol?>"><?=$country?></option>
									<?php
								}

								?>
							</select>
						</div>
					</div>
					<div class="row apb-1">
						<div class="col-6">
							<span class="lightgrey">Mail:</span>
						</div>
						<div class="col-6">
							<input type="text" name="changeusermail" value="<?=$show_user_mail?>" />
						</div>
					</div>
					<div class="row apb-1">
						<div class="col-12">
							<input type="hidden" name="getuser" value="<?=$getuser?>">
							<input type="submit" name="delete_user" value="Delete">
							<input type="submit" size="5" value="Save">
						</div>
					</form>
				</div>
			</div>
			<?php
		} 
		?>
		<form name="signatureeditor" action="admin.php" method="post">
			<div class="row">
				<div class="col-12">
					Signature:
				</div>
			</div>				
			<div class="row ap-1">
				<textarea name="signature" wrap="physical" cols="81" rows="13" onKeyDown="textCounter(this.form.signature,this.form.remLen,960);" onKeyUp="textCounter(this.form.signature,this.form.remLen,960);"><?=$show_user_sigdata?></textarea>
			</div>
			<div class="row">
				<input readonly type="text" name="remLen" size="3" maxlength="3" value="960"> characters left</input>
			</div>
			<div class="row">
				<div class="col-12 d-flex justify-content-between">

					<span class="white">Font</span>
					<select name="font">
						<option value="topaz">Topaz</option>
						<option value="microknight">MicroKnight</option>
						<option value="mosoul" selected="selected">mO'sOul</option>
						<option value="pot-noodle">P0T-NOoDLE</option>
					</select>

					<span class="white">Color</span>
					<select name="setcolor">
						<option class="darkblue" value="0,0,170">Dark Blue</option>
						<option class="darkgreen" value="0,170,0">Dark Green</option>
						<option class="darkcyan" value="0,170,170">Dark Cyan</option>
						<option class="darkred" value="170,0,0">Dark Red</option>
						<option class="magenta" value="170,0,170">Magenta</option>
						<option class="brown" value="170,85,0">Brown</option>
						<option class="darkgrey" value="85,85,85">Dark Grey</option>
						<option class="grey" value="170,170,170">Grey</option>
						<option class="blue" value="85,85,255">Blue</option>
						<option class="green" value="85,255,85">Green</option>
						<option class="cyan" value="85,255,85">Cyan</option>
						<option class="red" value="255,85,85">Red</option>
						<option class="magenta" value="255,85,255">Pink</option>
						<option class="yellow" value="255,255,85">Yellow</option>
						<option class="white" value="255,255,255">White</option>
					</select>
				</div>
			</div>
			<div class="row">
				<input type="hidden" name="user_signature" value="<?=$user_signature?>">
				<input type="submit" value="Submit">
			</div>
			<?php
		} 
		?>
	</form>
</div>
