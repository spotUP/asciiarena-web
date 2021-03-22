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
<div class="tab-pane fade ap-1" id="bbs">
	<form enctype="multipart/form-data" id="myForm" action="#bbs" name="bbsform" method="post">
		<div class="row apb-1">
			<div class="col-12">
				<div class="custom-select">
					<select name="getbbs" class="w-100" onchange="$('#myForm').submit();">">
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
				</div>
			</div>
		</div>
	</form>

	<?php
	if (isset($_POST['getbbs']))
	{
		$getbbs=$_POST['getbbs'];
		?>
		<form enctype="multipart/form-data" action="admin.php" method="post">

			<div class="row apb-1">
				<div class="col-6 d-flex justify-content-between">
					<span class="lightgrey">Name</span>
					<input type="text" size="24" name="edit_bbs_name" value="<?=$show_bbs_name?>" />
				</div>
			</div>
			<div class="row apb-1">
				<div class="col-6 d-flex justify-content-between">
					<span class="lightgrey">Sysop</span>
					<input type="text" size="24" name="edit_bbs_sysop" value="<?=$show_bbs_sysop?>" />
				</div>
			</div>
			<div class="row apb-1">
				<div class="col-6 d-flex justify-content-between">
					<span class="lightgrey">Address</span>
					<input type="text" size="24" name="edit_bbs_address" value="<?=$show_bbs_address?>" />
				</div>
			</div>
			<div class="row apb-1">
				<div class="col-6 d-flex justify-content-between">
					<span class="lightgrey">Phone Number</span>
					<input type="text" size="24" name="edit_bbs_number" value="<?=$show_bbs_number?>" />
				</div>
			</div>
			<div class="row apt-1">
				<div class="col-12">
					<input type="SUBMIT" name="do_edit_bbs" value="Submit">
					<input type="hidden" name="getbbs" value="<?=$getbbs?>">
					<input type="submit" name="delete_bbs" value="Delete">
				</div>
			</div>
		</form>
		<?php
	} 
	?>
</div>

