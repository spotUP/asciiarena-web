<?php
//--------------------------------------------------------------------------------
// EDIT SITELOGO FIELD
//--------------------------------------------------------------------------------

if(isset($_POST['getsitelogo']) && is_admin())
{
	$getsitelogo=$_POST['getsitelogo'];

	$ask="select * from logos where logo_id=:getsitelogo";
	$row=fetchOne($ask, ['getsitelogo' => $getsitelogo]);
	if (isset($row))
	{
		$logo_id=$row->logo_id;
		$ascii=$row->ascii;
		$ascii = htmlspecialchars($row->ascii, ENT_QUOTES);

	}
}
?>
<div class="tab-pane fade ap-1" id="sitelogo">
	<form enctype="multipart/form-data" action="#sitelogo" method="post">
		<select class="w-100" name="getsitelogo" onchange="this.form.submit();">
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
	</form>
	<?php
	if (isset($_POST['getsitelogo']))
	{
		$editsitelogo=$_POST['getsitelogo'];
		$ask="select * from logos where logo_id=:editsitelogo";
		$row=fetchOne($ask, [ 'editsitelogo' => $editsitelogo]);
		if (isset($row))
		{
			$logo_id = $row->logo_id;
			$author = $row->author;
			$ascii = htmlspecialchars($row->ascii, ENT_QUOTES);
		}
		?>
		<form enctype="multipart/form-data" action="#" method="post">
			<div class="row apb-1 apt-1">
				<div class="col-12">
					<textarea name="editedsitelogo" wrap="physical" cols="80" rows="8"><?=$ascii?></textarea>
				</div>
			</div>
			<div class="row">
				<div class="col-12">
					<input type="hidden" name="getsitelogo" value="<?=$editsitelogo?>">
					<input type="submit" value="Save">
					<?php
					if (isset($_POST['getsitelogo']) && (!isset($_POST['edit_sitelogo'])))
					{
						?>

						<input type="hidden" name="getsitelogo" value="<?=$_POST['getsitelogo']?>">
						<input type="submit" name="delete_sitelogo" value="Delete">
						
						<?php
					} 
					?>
				</div>
			</div>
		</form>
		<form enctype="multipart/form-data" action="#" method="post">
			<?php
		} 
		?>
	</form>
</div>
