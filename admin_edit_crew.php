<?php

//--------------------------------------------------------------------------------
// EDIT CREW FIELD
//--------------------------------------------------------------------------------

if(isset($_POST['getcrew']) && is_admin())
{
	$getcrew=$_POST['getcrew'];
	$getcrew=cleanInsert($getcrew);
	$ask="select * from crews where name=:getcrew";
	$result=fetchAll($ask, [ 'getcrew' => $getcrew ]);
	foreach ($result as $row)
	{
		$show_crew_name    = $row->name;
		$show_crew_www     = $row->www;
		$show_crew_contact = $row->contact;
		$show_crew_status  = $row->active;
		$show_crew_acronym = $row->acronym;
	}
}
?>

	<div class="tab-pane fade" id="crew">
		<form enctype="multipart/form-data" action="#crew" method="post">
			Edit Crew				
			<select name="getcrew">
				<?php
				if (isset($show_crew_name))
				{
					?>
					<option selected="selected"><?=$show_crew_name?></option>
					<?php
				}
				$ask="select name from crews";
				$result=fetchAll($ask);
				foreach ($result as $row)
				{
					$show_all_crew_names=$row->name;
					?>
					<option><?=$show_all_crew_names?></option>
					<?php
				}
				?>
			</select>
			<input type="submit" name="open_edit_crew_field" value=Select>
		</form>

		<?php
		if(isset($_POST['getcrew']) && (isset($_POST['open_edit_crew_field'])))
		{
			$getcrew=$_POST['getcrew'];
			$getcrew=cleanInsert($getcrew);

			$ask="select * from crews where name=:getcrew";
			$result=fetchAll($ask, ['getcrew' => $getcrew ]);
			foreach ($result as $row)
			{
				$show_crew_name=$row->name;
				$show_crew_www=$row->www;
				$show_crew_contact=$row->contact;
				$show_crew_status=$row->active;
				$show_crew_acronym=$row->acronym;
			}

			?>
			<form enctype="multipart/form-data" action="admin.php" method="post">
				Name
				<input type="text" size="20" name="edit_crew_name" value="<?=$show_crew_name?>">
				Acronym
				<input type="text" size="20" name="edit_crew_acronym" value="<?=$show_crew_acronym?>">
				Webpage
				<input type="text" size="20" name="edit_crew_www" value="<?=$show_crew_www?>">
				BBS(es)
				<?php
				$ask="select name from bbs_of where crew = :getcrew ";
				$result=fetchAll($ask, [ 'getcrew' => $getcrew ]);
				foreach ($result as $row)
				{
					$bbs = $row->name;
					?>
					<select name="edit_bbs[]">
						<option selected="selected"><?=$bbs?></option>
						<?php
						$ask_bbs="select name from bbses";
						$result_bbs=fetchAll($ask_bbs);
						foreach ($result_bbs as $row_bbs)
						{
							$all_bbses=$row_bbs->name;
							?>
							<option><?=$all_bbses?></option>
							<?php
						}
						?>
					</select>
					<?php
				}
				?>
				<span id="new_bbs_field"></span> 
				<span onclick="add_bbs_field();" style="cursor: pointer; cursor: hand;">
					<button type="button">Add BBS!</button>
				</span>
				<input type="hidden" name="total_bbses" id="total_bbses" value="0">

				Contact
				<input type="text" size="20" name="edit_crew_contact" value="<?=$show_crew_contact?>">

				Status:
				<select name="edit_crew_status">
					<option selected="selected"><?=$show_crew_status?></option>
					<option>Yes</option>
					<option>No</option>
				</select>

				<input type="hidden" name="delete_crew" value="<?=$getcrew?>">
				<input type="submit" name="do_delete_crew" value="Delete">
				<input type="hidden" name="getcrew" value="<?=$getcrew?>">
				<input type="submit" name="do_change_crew" value="Change">
			</form>
			<?php
		} 
		?>
	</div>
