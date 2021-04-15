
<?php

//---------------------------------------------------------------------------------------------------------------
// DUPE CHECK COLLY
//---------------------------------------------------------------------------------------------------------------

if(isset($_POST['dupecheck']))
{
	$searchquery=$_FILES['uploadedfile']['name'];
	$searchquery=str_replace(" ",",",$searchquery);
	$searchquery=str_replace("'","&#39;",$searchquery);

	$ask="SELECT filename from collys WHERE filename=:searchquery";
	$result=fetchAll($ask, ['searchquery' => $searchquery ]);
	foreach ($result as $row)
	{
		$dupe=$row->filename;
	}

	if (isset($dupe))
	{
		?>
		<div class="bs-component">
			<div class="animate__animated animate__tada alert alert-dismissible alert-danger">
				<button type="button" class="close" data-dismiss="alert">x</button>
				<span><?=$dupe?> exists! Somebody was faster than you! :(</span>
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
else
{
	?>
	<div class="bs-component">
		<div class="animate__animated animate__tada alert alert-dismissible alert-success">
			<button type="button" class="close" data-dismiss="alert">x</button>
			<span><?=$dupe?> doesn't exist! Quick! Upload it!</span>
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
}
//---------------------------------------------------------------------------------------------------------------
// CHECK UPLOADED COLLY
//---------------------------------------------------------------------------------------------------------------

if(isset($_POST['colly_name']))
{
	$max_file_size=$_POST['max_file_size'];
	$filesize = filesize($_FILES['uploadedfile']['tmp_name']);	
	$name=$_POST['colly_name'];
	$artist=$_POST['artist'];
	$crew=$_POST['crew'];
	$year=$_POST['year'];
	$month=$_POST['month'];
	$day=$_POST['day'];
	$type=$_POST['type'];
	$now=time();
	$total_artists=$_POST['total_artists'];
	$artist=$_POST['artist'];
	$colors=$_POST['colors'];

	if (file_exists("temp.diz"))
	{
		unlink ("temp.diz");
	}

	flush();
	$allowed_filetypes = array('.txt','.TXT','.asc','.ASC','.ans','.ANS','.diz','.DIZ','.lha','.LHA'); 	// allowed extensions
	$filename = $_FILES['uploadedfile']['name']; 							// fetch filename with extension
	$dirname = explode(".", $filename);
	$dirname = $dirname[0];
	$upload_path = "collections/";

	if (isset($filename))
	{
		$filename = $_FILES['uploadedfile']['name'];
		$ext = substr($filename, strpos($filename,'.'), strlen($filename)-1);
		if(!in_array($ext,$allowed_filetypes))
		{
			?>
			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-success">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>This filetype is not supported, please inform an Admin!</span>
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
}

if($filesize > $max_file_size)
{
	?>
	<div class="bs-component">
		<div class="animate__animated animate__tada alert alert-dismissible alert-success">
			<button type="button" class="close" data-dismiss="alert">x</button>
			<span>The colly is <?=$filesize?> bytes! The maximum allowed size is <?=$max_file_size?>. If this really is a (huge!) colly, please inform an Admin!</span>
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

if(!is_writable($upload_path))
{
	?>
	<div class="bs-component">
		<div class="animate__animated animate__tada alert alert-dismissible alert-success">
			<button type="button" class="close" data-dismiss="alert">x</button>
			<span>You can not upload to the specified directory, inform an Admin!</span>
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
$ask_existing="select filename from collys where filename=:filename";
$result_existing=fetchAll($ask_existing, [ 'filename' => $filename ]);
foreach ($result_existing as $row_existing)
{
	$existing_file=$row_existing->filename;
	if($existing_file==$filename)
	{
		?>
		<div class="bs-component">
			<div class="animate__animated animate__tada alert alert-dismissible alert-danger">
				<button type="button" class="close" data-dismiss="alert">x</button>
				<span><?=$filename?> already exists! Somebody was faster than you! :(</span>
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
}

if (empty($name))
{
	?>
	<div class="bs-component">
		<div class="animate__animated animate__tada alert alert-dismissible alert-danger">
			<button type="button" class="close" data-dismiss="alert">x</button>
			<span>You must fill the name field</span>
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

//---------------------------------------------------------------------------------------------------------------
// CONVERT FILE_ID.DIZ
//---------------------------------------------------------------------------------------------------------------

$filename = $_FILES['uploadedfile']['name']; 							// fetch filename with extension
$filen = $upload_path . $dirname . '/' . basename($_FILES['uploadedfile']['name']); 		// fetch filename with path
mkdir($upload_path.$dirname, 0755, TRUE);
if (preg_match('/\.lha/i', $filename)) $type = 'Archive';

if ($type == 'ASCII')
{
	   	if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $filen))
	   	{ 
	   		$contents = file_get_contents($filen);
	   		$file_id = preg_match('/@BEGIN_FILE_ID\.DIZ(.*)@END_FILE_ID\.DIZ/s', $contents, $m) ? $m[1] : '';
	   		$file_id_name = (strlen($file_id) > 1) ? $filename.'.diz' : null;

	   		if (strlen ($file_id) > 0) file_put_contents($filen.".diz", $file_id);

	   		$ask = "INSERT INTO collys (name, year, type, filename, timestamp, uploader, uploader_id, filesize, month, file_id, view_counter, downloads, day, broken) 
	   		VALUES (:name, :year, :type, :filename, :now, :uploader, :uploader_id, :filesize, :month, :file_id, 0, 0, :day, 0)";
	   		doQuery($ask, [ 'name' => $name, 'year' => $year, 'type' => $type, 'filename' => $filename,'now'  => $now, 'uploader' => $_user['nick'], 
	   			'uploader_id' => $_user['id'], 'filesize' => $filesize, 'month' => $month, 'file_id' => $file_id_name, 'day' => $day ]);
	   	}
	   }
	   elseif ($type == 'Archive')	
	   {
	   	if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $filen))
	   	{ 

	   		$lhal = shell_exec('/usr/bin/lha l "'.$filen.'"');
	   		$fileids = array();
	   		foreach (explode("\n", $lhal) as $l) {
	   			if (preg_match('/%\s+[A-Za-z]+\s+\d+\s+\d{4}\s+(.*file_id\.diz)$/i', $l, $m)) $fileids[] = $m[1];
	   		}
	   		foreach ($fileids as $fileid) {
	   			shell_exec('/usr/bin/lha pq "'.$filen.'" "'.$fileid.'" > collections/temp.diz');
	   			if (filesize('collections/temp.diz') > 0) {
	   				rename('collections/temp.diz', 'collections/'.$dirname.'/'.$filename.'.diz');
	   				break;
	   			}
	   		}
	   		if (!file_exists('collections/'.$dirname.'/'.$filename.'.diz'))
	   		{
	   			file_put_contents('collections/'.$dirname.'/'.$filename.'.diz', $name." by ".join(",", $_POST['artists']));
	   		}
	   		$ask = "INSERT INTO collys (name, year, type, filename, timestamp, uploader, uploader_id, filesize, month, file_id, view_counter, downloads, day, broken) 
	   		VALUES (:name, :year, :type, :filename, :now, :uploader, :uploader_id, :filesize, :month, :file_id, 0, 0, :day, 0)";
	   		doQuery($ask, [ 'name' => $name, 'year' => $year, 'type' => $type, 'filename' => $filename,'now'  => $now, 'uploader' => $_user['nick'], 
	   			'uploader_id' => $_user['id'], 'filesize' => $filesize, 'month' => $month, 'file_id' => $file_id_name, 'day' => $day ]);
	   	}
	   }

//---------------------------------------------------------------------------------------------------------------
// WRITE TO COLLY
//---------------------------------------------------------------------------------------------------------------

	   foreach($_POST['artist'] as $artist)
	   {
	   	$ask = "INSERT INTO artists_collys (artist_id, colly_id) VALUES (
	   	(SELECT id FROM artists WHERE nick=:artist),
	   	(SELECT id FROM collys WHERE filename=:filename))";
	   	doQuery($ask, [ 'artist' => $artist, 'filename' => $filename ]);
	   }

	   foreach($_POST['crew'] as $crew)
	   {
	   	$ask = "INSERT INTO collys_crews (colly_id, crew_id) VALUES (
	   	(SELECT id FROM collys WHERE filename=:filename),
	   	(SELECT id FROM crews WHERE name=:crew))";
	   	doQuery($ask, [ 'crew' => $crew, 'filename' => $filename ]);
	   }

	   $result = fetchOne("select sum(filesize) AS sum from collys where uploader=:nick", [ 'nick' => $nick ]);
	   if ($row = $result)
	   {
	   	$collysize=$row->sum;
	   }

	   $result = fetchOne("select sum(filesize) AS sum from mags where uploader=:nick", [ 'nick' => $nick ]);
	   if ($row = $result)
	   {
	   	$magsize=$row->sum;
	   }

	   $result = fetchOne("select sum(filesize) AS sum from apps where uploader=:nick", [ 'nick' => $nick ]);
	   if ($row = $result)
	   {
	   	$appsize=$row->sum;
	   }
	   $pumped = $collysize + $appsize + $magsize;
	   doQuery("update users set uploaded=:pumped where nick=:nick", [ 'nick' => $nick, 'pumped' => $pumped ]);


	   ?>

	   <?php
	   $dirname = explode(".", $filename);
	   $dirname = $dirname[0];

	   exec("mv collys/$filename* collys/$dirname");
	   ?>
	   <div class="bs-component">
	   	<div class="animate__animated animate__tada alert alert-dismissible alert-success">
	   		<button type="button" class="close" data-dismiss="alert">x</button>
	   		<span><?=$filename?> successfully uploaded!</span>
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
