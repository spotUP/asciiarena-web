<?php

//---------------------------------------------------------------------------------------------------------------
// CHECK UPLOADED BBS
//---------------------------------------------------------------------------------------------------------------

if(isset($_POST['submitbbs']))
{
	$name=$_POST['name'];
	$sysop=$_POST['sysop'];
	$address=$_POST['address'];
	$number=$_POST['number'];

	if (empty($name))
	{
		?>
		<div class="headline">
			Error
		</div>

		<div class="content_with_blenk">
			You must fill the name field!
		</div>

		<?php
		exit;
	}

	$ask="insert into bbses (id, name, sysop, address, number) values (0, :name, :sysop, :address, :number)";
	doQuery($ask, ['name' => $name, 'sysop' => $sysop, 'address' => $address, 'number' => $number ]);

	?>
	<div class="headline">
		Status
	</div>

	<div class="content_with_blenk">
		The BBS has been posted!
	</div>

	<meta http-equiv="Refresh" content="2"; url="submit.php">
	<?php	
	exit;
}
?>
