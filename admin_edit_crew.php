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

<div class="tab-pane fade ap-1" id="crew">
	<form action="#crew" method="post">
		<div class="row apl-1">
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
		</div>
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
		<form action="admin.php" method="post">
			<div classP="row">
				Name
			</div>
			<div classP="row apb-1">
				<input type="text" size="20" name="edit_crew_name" value="<?=$show_crew_name?>">
			</div>
			<div classP="row">
				Acronym
			</div>
			<div classP="row apb-1">
				<input type="text" size="20" name="edit_crew_acronym" value="<?=$show_crew_acronym?>">
			</div>
			<div classP="row">
				Webpage
			</div>
			<div classP="row apb-1">
				<input type="text" size="20" name="edit_crew_www" value="<?=$show_crew_www?>">
			</div>
			<div classP="row">
				BBS(es)
				<?php
				$ask="select name from bbs_of where crew = :getcrew ";
				$result=fetchAll($ask, [ 'getcrew' => $getcrew ]);
				foreach ($result as $row)
				{
					$bbs = $row->name;
					?>
					<div class="row apb-1">
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
					</div>
					<?php
				}
				?>
			</div>
			<div classP="row">
				<span id="new_bbs_field"></span> 
			</div>
			<div classP="row">
				<span onclick="add_bbs_field();" style="cursor: pointer; cursor: hand;">
					<button type="button">Add BBS!</button>
				</span>
			</div>
			<div classP="row">
				<input type="hidden" name="total_bbses" id="total_bbses" value="0">
			</div>
			<div classP="row">
				Contact
			</div>
			<div classP="row">
				<input type="text" size="20" name="edit_crew_contact" value="<?=$show_crew_contact?>">
			</div>
			<div classP="row">
				Status:
			</div>
			<div classP="row">
				<select name="edit_crew_status">
					<option selected="selected"><?=$show_crew_status?></option>
					<option>Yes</option>
					<option>No</option>
				</select>
			</div>
			<div classP="row">

				<input type="hidden" name="delete_crew" value="<?=$getcrew?>">
				<input type="submit" name="do_delete_crew" value="Delete">
				<input type="hidden" name="getcrew" value="<?=$getcrew?>">
				<input type="submit" name="do_change_crew" value="Change">
			</div>
		</form>
		<?php
	} 
	?>
</div>
