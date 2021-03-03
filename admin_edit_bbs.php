<?php
// --------------------------------------------------------------------------------
// EDIT BBS FIELD                                                               
// --------------------------------------------------------------------------------

if(isset($_POST['getbbs']) && is_admin())
{
	$getbbs=$_POST['getbbs'];
	$ask="select * from bbses where name=:getbbs";
	$result=fetchAll($ask, [ 'getbbs' => $getbbs ]);
	foreach ($result as $row)
	{
		$show_bbs_name    = $row->name;
		$show_bbs_sysop   = $row->sysop;
		$show_bbs_address = $row->address;
		$show_bbs_number  = $row->number;
	}
}

?>
<div class="tab-pane fade" id="bbs">
	Edit BBS			
	<form enctype="multipart/form-data" action="#bbs" method="post">
		<select name="getbbs">
			<?php
			if (isset($_POST['getbbs']))
			{
				?>
				<option selected="selected"><?=$show_bbs_name?></option>
				<?php
			}
			$ask="SELECT name FROM bbses ORDER BY name";
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$show_all_bbses=$row->name;
				?>
				<option><?=$show_all_bbses?></option>
				<?php
			}
			?>
		</select>
		<input type="submit" value="Select">
	</form>

	<?php
	if (isset($_POST['getbbs']))
	{
		$getbbs=$_POST['getbbs'];
		?>
		<form enctype="multipart/form-data" action="admin.php" method="post">

			Name

			<input type="text" size="24" name="edit_bbs_name" value="<?=$show_bbs_name?>" />

			Sysop

			<input type="text" size="24" name="edit_bbs_sysop" value="<?=$show_bbs_sysop?>" />

			Address

			<input type="text" size="24" name="edit_bbs_address" value="<?=$show_bbs_address?>" />

			Phone Number

			<input type="text" size="24" name="edit_bbs_number" value="<?=$show_bbs_number?>" />

			<input type="SUBMIT" name="do_edit_bbs" value="Submit">
			<input type="hidden" name="getbbs" value="<?=$getbbs?>">
			<input type="submit" name="delete_bbs" value="Delete">
		</form>
		<?php
	} 
	?>
</div>

