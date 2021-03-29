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
	$crewtatus=$_POST['crewtatus'];

	$crewname=cleanInsert($crewname);
	$crewacronym=cleanInsert($crewacronym);
	$crewwww=cleanInsert($crewwww);
	$crewbbs=cleanInsert($crewbbs);
	$crewcontact=cleanInsert($crewcontact);
	$crewstatus=cleanInsert($crewstatus);

	if (empty($crewname))
	{
		?>
		<div class="headline">
			Error
		</div>

		<div class="content_with_blenk">
			You must fill the crew name field!
		</div>
		<?php
		exit;
	}

	if(!empty($_POST[add_crew_bbs]))
	{		
		foreach($_POST[add_crew_bbs] as $add_crew_bbs)
		{
			$ask="insert into bbs_of (id, crew, name) values (0, :add_crew_bbs,:crewname)";
			doQuery($ask, ['add_crew_bbs' => $add_crew_bbs, 'crewname' => $crewname ]);
		}
	}

	$ask="insert into crews values (:crewname,:crewwww,:crewcontact,:crewstatus,0,:crewacronym)";
	doQuery($ask, [
		'crewname' => $crewname,
		'crewwww' => $crewwww,
		'crewcontact' => $crewcontact,
		'crewstatus' => $crewstatus,
		'crewacronym' => $crewacronym
	]);

	?>	
	<meta http-equiv="Refresh" content="2"; url="submit.php">
	<?php
	exit;
}
?>
