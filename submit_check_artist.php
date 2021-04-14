<?php

if(isset($_POST['artistnick']))
{
	$artistnick=$_POST['artistnick'];
	$artistwww=$_POST['artistwww'];
	$artiststatus=$_POST['artiststatus'];
	$artistcrew=$_POST['artistcrew'];
	$artistcountry=$_POST['artistcountry'];
	$artistacronym=$_POST['artistacronym'];

	$artistnick=cleanInsert($artistnick);
	$artiststatus=cleanInsert($artiststatus);
	$artistcrew=cleanInsert($artistcrew);
	$artistacronym=cleanInsert($artistacronym);

	$ask="SELECT nick from artists WHERE nick=:artistnick";
	$result=fetchAll($ask, [ 'artistnick' => $artistnick ]);
	foreach ($result as $row)
	{
		$artist_dupe=$row[0];				

		if (strcasecmp($artistnick, $artist_dupe) == 0) 
		{
			?>
			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-danger">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>The artist already exists!</span>
				</div>
			</div>
			<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
				<?php include "sidebar.php"; ?>
			</div>
			<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
				<?php include "sidebar_right.php"; ?>
			</div>
		</div>
		<?php include "footer.php"; ?>
		<meta http-equiv="Refresh" content="4"; url="submit.php">
		<?php
		exit();
	}
}

if (empty($artistnick))
{
	?>
</div>

</div>
<div class="row col-12">
	<div class="bs-component">
		<div class="animate__animated animate__tada alert alert-dismissible alert-danger">
			<button type="button" class="close" data-dismiss="alert">x</button>
			<span>You must fill the artist nick field!</span>
		</div>
	</div>
</div>
<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
	<?php include "sidebar.php"; ?>
</div>
<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
	<?php include "sidebar_right.php"; ?>
</div>
</div>
<?php include "footer.php"; ?>
<meta http-equiv="Refresh" content="4"; url="submit.php">

<?php
exit();
}

$ask="insert into artists (nick, www, active, country, rating, acronym, user_id, artisturl) values (:artistnick, :artistwww, :artiststatus, :artistcountry, 0, :artistacronym, :user_id, :artisturl)";
doQuery($ask, [
	'artistnick' => $artistnick,
	'artistwww' => $artistwww,
	'artiststatus' => $artiststatus,
	'artistcountry' => $country_list[$artistcountry],
	'artistacronym' => $artistacronym,
	'user_id' => $_user[ "id" ],
	'artisturl' => urlsafe($artistnick),
]);

if (isset($_POST[artist_crew]))
{
	foreach($_POST[artist_crew] as $artist_crew)
	{
		$ask="insert into member_of (crew, nick) values (:artist_crew,:artistnick)";
		doQuery($ask, ['artist_crew' => $artist_crew, 'artistnick' => $artistnick ]);
	}
}
?>		

<div class="bs-component">
	<div class="animate__animated animate__tada alert alert-dismissible alert-success">
		<button type="button" class="close" data-dismiss="alert">x</button>
		<span>Artist submitted successfully!</span>
	</div>
</div>
<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
	<?php include "sidebar.php"; ?>
</div>
<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
	<?php include "sidebar_right.php"; ?>
</div>
</div>
<?php include "footer.php"; ?>
<meta http-equiv="Refresh" content="4"; url="submit.php">
<?php	
exit;
}
?>
