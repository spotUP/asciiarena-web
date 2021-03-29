<?php
//-----------------------------------------------------------------------------
// CHECK UPLOADED NEWS
//-----------------------------------------------------------------------------

$time=time();
if(isset($_POST['newstext']))
{
	$newstext=$_POST['newstext'];
	$subject=$_POST['subject'];

	$subject=cleanInsert($subject);
	$newstext=cleanInsertPost($newstext);

	if (empty($newstext))
	{
		?>
		<div class="headline">
			Error
		</div>

		<div class="content_with_blenk">
			You must fill the news text field!
		</div>
		<meta http-equiv="Refresh" content="2"; url="submit.php">
		<?php	
		exit;
	}

	if (empty($subject))
	{
		?>
		<div class="headline">
			Error
		</div>

		<div class="content_with_blenk">
			You must fill the subject field!
		</div>
		<?php
		?>
		<meta http-equiv="Refresh" content="2"; url="submit.php">
		<?php	
		exit;
	}

	$ask="insert into news values (0, :nick, :time, :subject, :newstext,1)";
	doQuery($ask, [ 'nick' => $nick, 'time' => $time, 'subject' => $subject, 'newstext' => $newstext ]);

	?>
	<meta http-equiv="Refresh" content="0"; url="submit.php">
	<?php	
	exit;

} 
?>