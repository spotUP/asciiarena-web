<?php

//---------------------------------------------------------------------------------------------------------------
// CHECK ADDED CREW
//---------------------------------------------------------------------------------------------------------------


if(isset($_POST['crewname']))
{
	$crewname=$_POST['crewname'];
	$crewacronym=$_POST['crewacronym'];
	$crewwww=$_POST['crewwww'];
	$crewcontact=$_POST['crewcontact'];
	$crewstatus=$_POST['crewstatus'];

	if (empty($crewname))
	{
		?>
		<div class="bs-component">
			<div class="animate__animated animate__tada alert alert-dismissible alert-success">
				<button type="button" class="close" data-dismiss="alert">x</button>
				<span>You must fill the crew name field!</span>
			</div>
		</div>
		<meta http-equiv="Refresh" content="4"; url="submit.php">
	</div>
	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>
</div>
<?php
include "footer.php";
exit();
}

if(!empty($_POST['add_crew_bbs']))
{		
	foreach($_POST['add_crew_bbs'] as $add_crew_bbs)
	{
		$ask="insert into bbs_of (id, crew, name) values (0, :add_crew_bbs,:crewname)";
		doQuery($ask, ['add_crew_bbs' => $add_crew_bbs, 'crewname' => $crewname ]);
	}
}

$ask="insert into crews (name, www, contact, active, rating, acronym, crewurl) values (:crewname,:crewwww,:crewcontact,:crewstatus,0,:crewacronym,:crewurl)";
doQuery($ask, [
	'crewname' => $crewname,
	'crewwww' => $crewwww,
	'crewcontact' => $crewcontact,
	'crewstatus' => $crewstatus,
	'crewacronym' => $crewacronym,
	'crewurl' => urlsafe($crewname)
]);

?>
<div class="bs-component">
	<div class="animate__animated animate__tada alert alert-dismissible alert-success">
		<button type="button" class="close" data-dismiss="alert">x</button>
		<span>Crew submitted successfully!</span>
	</div>
</div>
<meta http-equiv="Refresh" content="4"; url="submit.php">
</div>
<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
	<?php include "sidebar.php"; ?>
</div>
<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
	<?php include "sidebar_right.php"; ?>
</div>
</div>
<?php
include "footer.php";
exit();
}
?>
