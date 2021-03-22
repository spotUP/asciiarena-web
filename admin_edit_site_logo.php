<?php
//--------------------------------------------------------------------------------
// EDIT SITELOGO FIELD
//--------------------------------------------------------------------------------

if(isset($_POST['getsitelogo']) && is_admin())
{
	$getsitelogo=$_POST['getsitelogo'];
	$getsitelogo=cleanInsert($getsitelogo);

	$ask="select * from logos where logo_id=:getsitelogo";
	$result=fetchAll($ask, ['getsitelogo' => $getsitelogo]);
	foreach ($result as $row)
	{
		$logo_id=$row->logo_id;
		$ascii=$row->ascii;
	}
}
?>
<div class="tab-pane fade ap-1" id="sitelogo">
	<form enctype="multipart/form-data" action="#sitelogo" method="post">
		<select name="getsitelogo" onchange="this.form.submit();">
			<?php
			if (isset($_POST['getsitelogo']))
			{
				?>
				<option selected="selected"><?=$getsitelogo?></option>
				<?php
			}

			$ask="select logo_id from logos";
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$show_all_site_logos=$row->logo_id;
				?>
				<option><?=$show_all_site_logos?></option>
				<?php
			}
			?>
		</select>
		<?php

		if (isset($_POST['edit_sitelogo']))
		{
			$editsitelogo=$_POST['getsitelogo'];
			$ask="select * from logos where logo_id=:editsitelogo";
			$result=fetchAll($ask, [ 'editsitelogo' => $editsitelogo]);
			foreach ($result as $row)
			{
				$logo_id = $row->logo_id;
				$author = $row->author;
				$ascii = htmlspecialchars($row->ascii);
			}
			?>
			<form enctype="multipart/form-data" action="#" method="post">

				<textarea name="editedsitelogo" wrap="physical" cols="80" rows="8"><?=$ascii?></textarea>

				<select name="font">
					<option value="topaz">Topaz</option>
					<option value="microknight">MicroKnight</option>
					<option value="mosoul" selected="selected">mO'sOul</option>
					<option value="pot-noodle">P0T-NOoDLE</option>
				</select>

				Color
				<select name="set_edited_logo_color">
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
				<input type="hidden" name="getsitelogo" value="<?=$editsitelogo?>">
				<input type="submit" value="Submit">
				<?php
			} 

			if (isset($_POST['getsitelogo']) && (!isset($_POST['edit_sitelogo'])))
			{
				?>
				<?=$ascii?>
				<input type="hidden" name="getsitelogo" value="<?=$_POST['getsitelogo']?>">
				<input type="submit" name="edit_sitelogo" value="Edit">
				<input type="submit" name="delete_sitelogo" value="Delete">

				<?php
			} 
			?>
		</form>
	</div>