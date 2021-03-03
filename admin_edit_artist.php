<?php
//--------------------------------------------------------------------------------
// EDIT ARTIST FIELD
//--------------------------------------------------------------------------------

if(isset($_POST['getartist']) && is_admin())
{
	$getartist=$_POST['getartist'];
	$getartist=cleanInsert($getartist);

	$ask="select * from artists where nick=:getartist";
	$result=fetchAll($ask, ['getartist' => $getartist]);
	foreach ($result as $row)
	{
		$show_artist_nick=$row->nick;
		$show_artist_www=$row->www;
		$show_artist_status=$row->active;
		$show_artist_country=$row->country;
		$show_artist_acronym=$row->acronym;
	}
}
?>
<div class="tab-pane fade" id="artist">
	<form enctype="multipart/form-data" action="#" method="post">

		Edit Artist				

		<select name="getartist">
			<?php
			if (isset($show_artist_nick))
			{
				?>
				<option selected="selected" value="$show_all_user_names"><?=$show_artist_nick?></option>
				<?php
			}
			$ask="select nick from artists";
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$show_all_artist_names=$row->nick;
				?>
				<option><?=$show_all_artist_names?></option>
				<?php
			}
			?>
		</select>
		<input type="submit" value="Select">
	</form>
	<form enctype="multipart/form-data" action="#" method="post">
		<?php
		if (isset($_POST['getartist']))
		{ 
			$getartist=$_POST['getartist'];
			?>

			Nick
			<input type="text" size="20" name="edit_artist_nick" value="<?=$show_artist_nick?>">

			Acronym
			<input type="text" size="20" name="edit_artist_acronym" value="<?=$show_artist_acronym?>">

			Webpage
			<input type="text" size="20" name="edit_artist_www" value="<?=$show_artist_www?>">

			Crew
			<?php
			$ask="select crew from member_of where nick='$getartist'";
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$artist_crew=$row->crew;
				?>
				<select name="old_artist_crews[]"> 
					<option selected="selected"><?=$artist_crew?></option>
					<option value="Delete">Remove Crew</option>
					<?php
					$ask_crews="select name from crews";
					$result_crews=fetchAll($ask_crews);
					foreach ($result_crews as $row_crews)
					{
						$crews=$row_crews->name;
						?><option><?=$crews?></option><?php
					}
					?>
				</select>
				<?php
			}
			?>

			<span id="new_artist_crew_field"></span> 
			<span onclick="add_artist_crew_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Crew!</button></span>
			<input type="hidden" name="total_artist_crews" id="total_artist_crews" value="0">

			Country:
			<select name="change_artist_country">
				<?php
				if (!empty($show_artist_country))
				{
					?>
					<option selected value="$symbol"><?=$show_artist_country?></option>
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
					<option value="<?=$symbol?>">$country</option>
					<?php
				}
				?>
			</select>

			Status:
			<select name="edit_artist_status">
				<option selected="selected"><?=$show_artist_status?></option>
				<option>Yes</option>
				<option>No</option>
			</select>
			<input type="hidden" name="getartist" value="<?=$getartist?>" />	
			<input type="submit" name="delete_artist" value="Delete">
			<input type="hidden" name="getartist" value="<?=$getartist?>" />	
			<input type="submit" name="do_edit_artist" value="Change">
			<?php
		} 
		?>
	</form>
</div>