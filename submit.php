<?php
	require_once('ansilove.php');

//	echo "<pre>"; print_r($_POST);echo "</pre>";
//	echo "<pre>"; print_r($_FILES);echo "</pre>";
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "https://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<title>ASCIIARENA brought to you by UP ROUGH SOUNDSYSTEM</title>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> 
	<meta name="viewport" content="width=device-width">
	<link rel='stylesheet' href='style.css' type='text/css'>
	<script type="text/javascript">

	function add_artist_field()
	{
		var newselect = " <select name=\"artist[]\"" + document.getElementById('total_artists').value + "><option value=\"Unknown\">Unknown</option><?php

			$ask="select nick from artists";
			$result=mysql_query($ask,$dbh);
			while ($row=mysql_fetch_array($result))
			{
		        $artists=$row[0];
		        echo "<option value='$artists'>$artists</option>";
			}
			echo "</select>\"\n";
			?>
		    document.getElementById('new_artist_field').innerHTML =  document.getElementById('new_artist_field').innerHTML + newselect;
			document.getElementById('total_artists').value =  parseInt( document.getElementById('total_artists').value) + 1;
	}

	</script>

	<script type="text/javascript">
	function add_crew_field()
	{
		var newselect = " <select name=\"crew[]\"" + document.getElementById('total_crews').value + "><option>Independent</option><?php

			$ask="select name from crews";
			$result=mysql_query($ask,$dbh);
			while ($row=mysql_fetch_array($result))
			{
		        $crews=$row[0];
		        echo "<option value='$crews'>$crews</option>";
			}
			echo "</select>\"\n";
			?>
		    document.getElementById('new_crew_field').innerHTML =  document.getElementById('new_crew_field').innerHTML + newselect;
			document.getElementById('total_crews').value =  parseInt( document.getElementById('total_crews').value) + 1;
	}

	</script>

	<script type="text/javascript">
	function add_artist_crew_field()
	{
		var newselect = " <select name=\"artist_crew[]\"" + document.getElementById('total_artist_crews').value + "><option value=\"Unknown\">Unknown</option><?php

			$ask="select name from crews";
			$result=mysql_query($ask,$dbh);
			while ($row=mysql_fetch_array($result))
			{
		        $crews=$row[0];
		        echo "<option value='$crews'>$crews</option>";
			}
			echo "</select>\"\n";
			?>
		    document.getElementById('new_artist_crew_field').innerHTML =  document.getElementById('new_artist_crew_field').innerHTML + newselect;
			document.getElementById('total_artist_crews').value =  parseInt( document.getElementById('total_artist_crews').value) + 1;
	}

	</script>
	<script type="text/javascript">

	function add_crew_bbs_field()
	{
		var newselect = " <select name=\"add_crew_bbs[]\"" + document.getElementById('total_crew_bbses').value + "><option value=\"Unknown\">Unknown</option><?php

			$ask="select name from bbses";
			$result=mysql_query($ask,$dbh);

			while ($row=mysql_fetch_array($result))
			{
		        $crew_bbs=$row[0];
		        echo "<option value='$crew_bbs'>$crew_bbs</option>";
			}
			echo "</select>\"\n";
			?>
		    document.getElementById('new_crew_bbs_field').innerHTML =  document.getElementById('new_crew_bbs_field').innerHTML + newselect;
			document.getElementById('total_crew_bbses').value =  parseInt( document.getElementById('total_crew_bbses').value) + 1;
	}
	</script>
</head>
<body onload="add_artist_field(); add_crew_field(); add_artist_crew_field();">

<div class="maincontainer">
	<div class="header">
		<?php include ("header.php"); ?>
	</div>
	<div class="leftsidebar">
		<?php include ("sidebar.php"); ?>
	</div>
	<div class="maincontent">
		<div class="wrap">

	<?php
	if (is_logged_in())
	{

//---------------------------------------------------------------------------------------------------------------
// CHECK SUBMITTED APP
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['app_author']))
	{
		$max_file_size=$_POST['max_file_size'];
		$filesize = filesize($_FILES['uploaded_app']['tmp_name']);	
		$name=$_POST['name'];
		$app_author=$_POST['app_author'];
		$year=$_POST['year'];
		$month=$_POST['month'];
		$type=$_POST['type'];
		$now=time();
		$name=cleanInsert($name);
		$app_author=cleanInsert($app_author);

		?>
		<div class="headline">
			Status
		</div>
		<div class="content_with_blenk">
			Uploading ASCII app, hold on!
		</div>	
		<?php
		if (file_exists("temp.diz"))
		{
			unlink ("temp.diz");
		}
		
		flush();
		$allowed_filetypes = array('.lha','.LHA','.txt','.TXT','.dms','.DMS','.lzh','.LZH','.zip','.ZIP'); 	// allowed extensions
		$upload_path = "apps/"; 												// upload dir
	
		if (isset($filename))
		{
			$filename = $_FILES['uploaded_app']['name']; 							// fetch filename with extension
			$ext = substr($filename, strpos($filename,'.'), strlen($filename)-1); 	// extract extension 
		 	if(!in_array($ext,$allowed_filetypes))									// filetype allowed?		
			{
				?>
				<div class="headline">
					Error
				</div>
				<div class="content_with_blenk">
					This filetype is not allowed here!
					Only LHA, LZH, DMS, ZIP and TXT can do it!	
				</div>
				<?php
			exit;
			}
		}

		if($filesize > $max_file_size) 		// file too big?
		{
			?>
			<div class="headline">
				Error
			</div>
			<?php if(!empty($filesize)) ?>
			<div class="content_with_blenk">			
				The colly is <?=$filesize?> bytes! The maximum allowed size is <?=$max_file_size?>	
				If this really is a (huge!) colly, please inform an Admin!
			</div>	
			<?php
			exit;
	 	}
	
		if(!is_writable($upload_path))											// upload dir ok?
		{
			?>
			<div class="headline">
				Error
			</div>
			<div class="content_with_blenk">			
				You can not upload to the specified directory, inform an Admin!
			</div>	
			<?php
			exit;
		}	
		$ask_existing="select filename from apps where filename='$filename'";
		$result_existing=mysql_query($ask_existing,$dbh);
		while($row_existing=mysql_fetch_row($result_existing))
		{
	        $existing_file=$row_existing[0];

			if($existing_file==$filename)
			{
				?>
				<div class="headline">
					Error
				</div>
				<div class="content_with_blenk">
					The app already exists!
				</div>
				<?php
				exit;
			}
		}

		if (empty($name))
		{
			?>
			<div class="headline">
				Error
			</div>
			<div class="content_with_blenk">
				Error! You must fill the name field!
			</div>
			<?php
			exit;
		}

		if (empty($app_author))
		{
			$app_author = "Unknown";
		}
	}
//---------------------------------------------------------------------------------------------------------------
// CONVERT FILE_ID.DIZ
//---------------------------------------------------------------------------------------------------------------

	if ($type == APP)	
	{
		$filename = $_FILES['uploaded_app']['name']; 							// fetch filename with extension
	   	$filen = $upload_path . basename($_FILES['uploaded_app']['name']); 		// fetch filename with path
		if(move_uploaded_file($_FILES['uploaded_app']['tmp_name'], $filen))
		{ 
			if (($ext == ".lha") || ($ext == ".LHA") || ($ext == ".lzh") || ($ext == ".LZH")) 
			{
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("bin/lha pq ./$filen file_id.diz >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("bin/lha pq ./$filen FILE_ID.DIZ >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("bin/lha pq ./$filen File_Id.Diz >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("bin/lha pq ./$filen File_Id.Diz >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("bin/lha pq ./$filen *.DiZ >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("bin/lha pq ./$filen *.dIZ >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("bin/lha pq $filen *.diZ >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}
				if (file_exists("apps/temp.diz"))
				{
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
										
					if (file_exists("apps/temp.diz"))
					{
						load_ansi("apps/temp.diz","apps/$filename.diz","mosoul","transparent",0);
					}
				}

				if (!file_exists("apps/temp.diz"))
				{
					file_put_contents("./apps/temp.diz", "$name by $mag_author");
					load_ansi("apps/temp.diz","apps/$filename.diz","mosoul","transparent",0);
				}
				if(isset($_POST['edit_file_status']))
				{
					$file_status=$_POST['edit_file_status'];

					$filename=mysql_real_escape_string($filename);
					$ask="insert into apps values ('$name','$filename',0,$now,'$app_author',$filesize,'$filename.diz.png',0,(null),'$nick','$file_id_date','$file_status')";
					mysql_query($ask,$dbh);
				}
				else
				{
					$filename=mysql_real_escape_string($filename);
					$ask="insert into apps values ('$name','$filename',0,$now,'$app_author',$filesize,'$filename.diz.png',0,(null),'$nick','$file_id_date','Legal')";
					mysql_query($ask,$dbh);
				}
			}
			if (($ext == ".txt") || ($ext == ".TXT")) 
			{ 
				$word1='@BEGIN_FILE_ID.DIZ';
				$word2='@END_FILE_ID.DIZ';
	
				$handle = fopen($filen, "r");
				$contents = fread($handle, filesize($filen));
				fclose($handle);

				$file_id_date=filemtime("$filen");
	
				list($junk, $good) = split('@BEGIN_FILE_ID.DIZ', $contents);
				list($good, $junk) = split('@END_FILE_ID.DIZ', $good);
				$file_id = $good;
	
				if (strlen ($file_id) > 0)
				{
					file_put_contents("$filen".".diz", $file_id);
					load_ansi("$filen".".diz","$filen".".diz","mosoul","transparent",0);
					unlink ("$filen".".diz");
				}			
				if(isset($_POST['edit_file_status']))
				{
					$file_status=$_POST['edit_file_status'];

					$filename=mysql_real_escape_string($filename);
					$ask="insert into apps values ('$name','$filename',$file_id_date,$now,'$app_author',$filesize,'$filename.diz.png',0,(null),'$nick','$file_id_date','$file_status')";
					mysql_query($ask,$dbh);
				}
				else
				{
					$filename=mysql_real_escape_string($filename);
					$ask="insert into apps values ('$name','$filename',$file_id_date,$now,'$app_author',$filesize,'$filename.diz.png',0,(null),'$nick','$file_id_date','Legal')";
					mysql_query($ask,$dbh);
				}
			}
			if (($ext == ".zip") || ($ext == ".ZiP")) 
			{
				$filename_escaped = addslashes($filename);
				$filen = addslashes($filen);

				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("./bin/unzip -p -ca ./$filen \*.diz >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}
			
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("./bin/unzip -p -ca ./$filen \*.DIZ >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("appss/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("./bin/unzip -p -ca ./$filen \*.Diz >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("./bin/unzip -p -ca ./$filen \*.DiZ >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("./bin/unzip -p -ca ./$filen \*.dIZ >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("./bin/unzip -p -ca ./$filen \*.diZ >apps/temp.diz");
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
					if (file_exists("apps/temp.diz"))
					{
						$handle = fopen("apps/temp.diz", "r");
						$contents = fread($handle, filesize("apps/temp.diz"));
						fclose($handle);
					}
				}
				if (file_exists("apps/temp.diz"))
				{
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
										
					if (file_exists("apps/temp.diz"))
					{
						load_ansi("apps/temp.diz","apps/$filename.diz","80x25","9",1);
					}
	
					$old_bg_color_r="0";
					$old_bg_color_g="0";
					$old_bg_color_b="0";
	
					$image = imageCreateFromPNG("apps/$filename.diz.png");

					$bg_color = imageColorExact($image,$old_bg_color_r,$old_bg_color_g,$old_bg_color_b);	//get color to replace
					imageColorSet($image,$bg_color,0,10,34);		//replace color with
	
					imagepng($image,"apps/$filename.diz.png");	 											// save image
				}
				if (!file_exists("apps/temp.diz"))
				{
					file_put_contents("./apps/temp.diz", "$name by $mag_author");
					load_ansi("apps/temp.diz","apps/$filename.diz","mosoul","transparent",0);
				}
				if(isset($_POST['edit_file_status']))
				{			
					$filename=mysql_real_escape_string($filename);
					$ask="insert into apps values ('$name','$filename',0,$now,'$app_author',$filesize,'$filename.diz.png',0,(null),'$nick','$file_id_date','$file_status')";
					mysql_query($ask,$dbh);
					unlink ("apps/temp.diz");
				}
				else
				{
					$filename=mysql_real_escape_string($filename);
					$ask="insert into apps values ('$name','$filename',0,$now,'$app_author',$filesize,'$filename.diz.png',0,(null),'$nick','$file_id_date','Legal')";
					mysql_query($ask,$dbh);
				}
			}				
			if (($ext == ".dms") || ($ext == ".DMS")) 
			{		
				exec("./bin/xdms d $filen >apps/temp.diz");
				$size_check = filesize("apps/temp.diz");
				if ($size_check == 0)
				{
				unlink ("apps/temp.diz");
				}
				if (file_exists("apps/temp.diz"))
				{
					$handle = fopen("apps/temp.diz", "r");
					$contents = fread($handle, filesize("apps/temp.diz"));
					fclose($handle);
				}
				if (file_exists("apps/temp.diz"))
				{
					$size_check = filesize("apps/temp.diz");
					if ($size_check == 0)
					{
						unlink ("apps/temp.diz");
					}
										
					if (file_exists("apps/temp.diz"))
					{
						load_ansi("apps/temp.diz","apps/$filename.diz","mosoul","transparent",0);
					}
				}

				if (!file_exists("apps/temp.diz"))
				{
					file_put_contents("./apps/temp.diz", "$name by $mag_author");
					load_ansi("apps/temp.diz","apps/$filename.diz","mosoul","transparent",0);
				}
				if(isset($_POST['edit_file_status']))
				{
					$file_status=$_POST['edit_file_status'];
					$filename=mysql_real_escape_string($filename);
					$ask="insert into apps values ('$name','$filename',0,$now,'$app_author',$filesize,'$filename.diz.png',0,(null),'$nick','$file_id_date','$file_status')";
					mysql_query($ask,$dbh);
				}
				else
				{
					$filename=mysql_real_escape_string($filename);
					$ask="insert into apps values ('$name','$filename',0,$now,'$app_author',$filesize,'$filename.diz.png',0,(null),'$nick','$file_id_date','Legal')";
					mysql_query($ask,$dbh);
				}
			}
			?>
			<div class="headline">
				Status
			</div>	
			<div class="content_with_blenk">
				The app has been uploaded!
			</div>	
	
			<meta http-equiv="Refresh" content="200; url=submit.php">
			<?php
			exit;
		}

	}
//---------------------------------------------------------------------------------------------------------------
// CHECK SUBMITTED MAG
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['mag_author']))
	{
		$max_file_size=$_POST['max_file_size'];
		$filesize = filesize($_FILES['uploaded_mag']['tmp_name']);	
		$name=$_POST['name'];
		$mag_author=$_POST['mag_author'];
		$year=$_POST['year'];
		$month=$_POST['month'];
		$type=$_POST['type'];
		$now=time();
		$name=cleanInsert($name);
		$mag_author=cleanInsert($mag_author);
		$filename = $_FILES['uploaded_mag']['name'];
		?>
		<div class="headline">
			Status
		</div>			
		<div class="content_with_blenk">
			Uploading ASCII Mag, hold on!
		</div>	
		<?php
		if (isset($filename))
		{

			if (file_exists("./mags/temp.diz"))
			{
				unlink ("./mags/temp.diz");
			}

			flush();
			$allowed_filetypes = array('.lha','.LHA','.txt','.TXT','.lzh','.LZH','.zip','.ZIP','.dms','.DMS'); 	// allowed extensions
			$upload_path = "mags/"; 												// upload dir
	
			if (isset($filename))
			{
				$filename = $_FILES['uploaded_mag']['name'];
				$ext = substr($filename, strpos($filename,'.'), strlen($filename)-1); 	// extract extension 
			 	if(!in_array($ext,$allowed_filetypes))									// filetype allowed?		
				{
					?>
					<div class="headline">
						Error
					</div>	
					<div class="content_with_blenk">
						This filetype is not allowed here! Only LHA, LZH, ZIP, DMS and TXT can do it!
					</div>	
					<?php
				exit;
				}
			}

			if($filesize > $max_file_size) 		// file too big?
			{
				if(!empty($filesize))
				{
					?>
					<div class="headline">
						Error
					</div>	
					<div class="content_with_blenk">
						The mag is <?=$filesize?> bytes! The maximum allowed size is <?=$max_file_size?><br>
						Please inform an Admin!
					</div>
					<?php
					}
					exit;
				}
	
				if(!is_writable($upload_path))											// upload dir ok?
				{
					?>
					<div class="headline">
						Error
					</div>	

					<div class="content_with_blenk">
						You can not upload to the specified directory, inform an Admin!
					</div>
					<?php
					exit;
				}	

				$checkfilename = addslashes($filename);
				$ask_e="SELECT filename FROM mags WHERE filename='$checkfilename'";
				$result_e=mysql_query($ask_e,$dbh);
				while($row_e=mysql_fetch_row($result_e))
				{
					$existing_file=$row_e[0];
	
					if($existing_file==$filename)
					{
						?>
						<div class="headline">
							Error
						</div>	

						<div class="content_with_blenk">
							The mag already exists!
						</div>
						<?php
						exit;
					}
				}

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
			}
		}	
//---------------------------------------------------------------------------------------------------------------
// CONVERT FILE_ID.DIZ
//---------------------------------------------------------------------------------------------------------------

	if ($type == MAG)
	{
		$filename = $_FILES['uploaded_mag']['name']; 							// fetch filename with extension
	   	$filen = $upload_path . basename($_FILES['uploaded_mag']['name']); 		// fetch filename with path
		if(move_uploaded_file($_FILES['uploaded_mag']['tmp_name'], $filen))
		{
			if (($ext == ".dms") || ($ext == ".DMS")) 
			{		
				exec("./bin/xdms d $filen >mags/temp.diz");
				$size_check = filesize("mags/temp.diz");
				if ($size_check == 0)
				{
				unlink ("mags/temp.diz");
				}
				if (file_exists("mags/temp.diz"))
				{
					$handle = fopen("mags/temp.diz", "r");
					$contents = fread($handle, filesize("mags/temp.diz"));
					fclose($handle);
				}
				if (file_exists("mags/temp.diz"))
				{
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
										
					if (file_exists("mags/temp.diz"))
					{
						load_ansi("mags/temp.diz","mags/$filename.diz","mosoul","transparent",0);
					}
				}

				if (!file_exists("mags/temp.diz"))
				{
					file_put_contents("./mags/temp.diz", "$name by $mag_author");
					load_ansi("mags/temp.diz","mags/$filename.diz","mosoul","transparent",0);
				}
				if(isset($_POST['edit_file_status']))
				{
					$file_status=$_POST['edit_file_status'];
					$filename=mysql_real_escape_string($filename);
					$ask="insert into mags values ('$name','$filename',0,$now,'$mag_author',$filesize,'$filename.diz.png',0,(null),'$nick')";
					mysql_query($ask,$dbh);
				}
			}
			if (($ext == ".lha") || ($ext == ".LHA") || ($ext == ".lzh") || ($ext == ".LZH")) 
			{
				$filename_escaped = addslashes($filename);
				$filen = addslashes($filen);

				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq ./$filen file_id.diz >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}
			
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq ./$filen FILE_ID.DIZ >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq ./$filen File_Id.Diz >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq ./$filen File_Id.Diz >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq ./$filen *.DiZ >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq ./$filen *.dIZ >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq $filen *.diZ >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}
				if (file_exists("mags/temp.diz"))
				{
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
										
					if (file_exists("mags/temp.diz"))
					{
						load_ansi("mags/temp.diz","mags/$filename.diz","mosoul","transparent",0);
					}
				}

				if (!file_exists("mags/temp.diz"))
				{
					file_put_contents("./mags/temp.diz", "$name by $mag_author");
					load_ansi("mags/temp.diz","mags/$filename.diz","mosoul","transparent",0);
				}
				
				$filename=mysql_real_escape_string($filename);
				$ask="insert into mags values ('$name','$filename',0,$now,'$mag_author',$filesize,'$filename.diz.png',0,(null),'$nick')";
				mysql_query($ask,$dbh);
				unlink ("mags/temp.diz");
			}			
			if (($ext == ".txt") && ($ext == ".TXT")) 
			{ 
				$word1='@BEGIN_FILE_ID.DIZ';
				$word2='@END_FILE_ID.DIZ';
	
				$handle = fopen($filen, "r");
				$contents = fread($handle, filesize($filen));
				fclose($handle);
	
				list($junk, $good) = split('@BEGIN_FILE_ID.DIZ', $contents);
				list($good, $junk) = split('@END_FILE_ID.DIZ', $good);
				$file_id = $good;
	
				if (strlen ($file_id) > 0)
				{
					file_put_contents("$filen".".diz", $file_id);
					load_ansi("$filen".".diz","$filen".".diz","mosoul","transparent",0);
					unlink ("$filen".".diz");
				}

				$file_id_date=$_FILES['uploaded_mag']['name'];
				$file_id_date=filemtime("mags/$file_id_date");
				
				$filename=mysql_real_escape_string($filename);
				$ask="insert into mags values ('$name','$filename',0,$now,'$mag_author',$filesize,'$filename.diz.png',0,(null),'$nick')";
				mysql_query($ask,$dbh);
				
			}
			if (($ext == ".zip") || ($ext == ".ZiP")) 
			{
				$filename_escaped = addslashes($filename);
				$filen = addslashes($filen);

				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("./bin/unzip -p -ca ./$filen \*.diz >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}
			
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("./bin/unzip -p -ca ./$filen \*.DIZ >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("./bin/unzip -p -ca ./$filen \*.Diz >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("./bin/unzip -p -ca ./$filen \*.DiZ >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("./bin/unzip -p -ca ./$filen \*.dIZ >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("./bin/unzip -p -ca ./$filen \*.diZ >mags/temp.diz");
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
					if (file_exists("mags/temp.diz"))
					{
						$handle = fopen("mags/temp.diz", "r");
						$contents = fread($handle, filesize("mags/temp.diz"));
						fclose($handle);
					}
				}
				if (file_exists("mags/temp.diz"))
				{
					$size_check = filesize("mags/temp.diz");
					if ($size_check == 0)
					{
						unlink ("mags/temp.diz");
					}
										
					if (file_exists("mags/temp.diz"))
					{
						load_ansi("mags/temp.diz","mags/$filename.diz","80x25","9",1);
					}
	
					$old_bg_color_r="0";
					$old_bg_color_g="0";
					$old_bg_color_b="0";
	
					$image = imageCreateFromPNG("mags/$filename.diz.png");

					$bg_color = imageColorExact($image,$old_bg_color_r,$old_bg_color_g,$old_bg_color_b);	//get color to replace
					imageColorSet($image,$bg_color,0,10,34);		//replace color with
	
					imagepng($image,"mags/$filename.diz.png");	 											// save image
				}
				if (!file_exists("mags/temp.diz"))
				{
					file_put_contents("./mags/temp.diz", "$name by $mag_author");
					load_ansi("mags/temp.diz","mags/$filename.diz","mosoul","transparent",0);
				}				
				$filename=mysql_real_escape_string($filename);
				$ask="insert into mags values ('$name','$filename',0,$now,'$mag_author',$filesize,'$filename.diz.png',0,(null),'$nick')";
				mysql_query($ask,$dbh);
				unlink ("mags/temp.diz");

				$result = mysql_query("select sum(filesize) from collys where uploader='$nick'",$dbh);
				if ($row = mysql_fetch_row($result))
				{
					$collysize=$row[0];
				}

				$result = mysql_query("select sum(filesize) from mags where uploader='$nick'",$dbh);
				if ($row = mysql_fetch_row($result))
				{
					$magsize=$row[0];
				}

				$result = mysql_query("select sum(filesize) from apps where uploader='$nick'",$dbh);
				if ($row = mysql_fetch_row($result))
				{
					$appsize=$row[0];
				}
				$pumped = $collysize + $appsize + $magsize;
				mysql_query("update users set uploaded='$pumped' where nick='$nick'", $dbh);
			}
		}	
		?>
		<div class="headline">
			Status
		</div>

		<div class="content_with_blenk">		
			The mag has been uploaded!
		</div>
		
		<meta http-equiv="Refresh" content="2; url=submit.php">
		<?php
		exit;
	}

//---------------------------------------------------------------------------------------------------------------
// DUPE CHECK COLLY
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['dupecheck']))
		{
			$searchquery=$_FILES['uploadedfile']['name'];
			$searchquery=str_replace(" ",",",$searchquery);
			$searchquery=str_replace("'","&#39;",$searchquery);
			
			$ask="SELECT filename from collys WHERE filename='$searchquery'";
			$result=mysql_query($ask);
			while ($row=mysql_fetch_row($result))
			{
				$dupe=$row[0];				
			}

			if (isset($dupe))
			{
				?>
				<div class="content">
				<?=$dupe?> exists!<br><br>
				</div>
				<meta http-equiv="Refresh" content="2; url=submit.php">
				<?php
				exit();
			}
			else
			{
				?>
				<div class="content">
				<?=$searchquery?> does NOT exist! Go on boy! Upload it!<br><br>
				</div>
				<meta http-equiv="Refresh" content="2; url=submit.php">
				<?php
				exit();
			}			
		}
//---------------------------------------------------------------------------------------------------------------
// CHECK SUBMITTED COLLY
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
		$colors=cleanInsert($colors);
		$total_artists=cleanInsert($total_artists);
		$type=cleanInsert($type);
		$day=cleanInsert($day);
		$month=cleanInsert($month);
		$year=cleanInsert($year);
		$artist=addslashes($artist);
		$artist=cleanInsert($artist);
		$crew=addslashes($crew);
		$crew=cleanInsert($crew);
		$name=cleanInsert($name);
		$type=cleanInsert($type);
		$colors=cleanInsert($colors);
		$now=cleanInsert($now);
		?>
		<div class="headline">
			Status
		</div>

		<div class="content_with_blenk">				
			Uploading and converting, hold on!
		</div>	
		<?php

		if (file_exists("temp.diz"))
		{
			unlink ("temp.diz");
		}

		flush();
		$allowed_filetypes = array('.txt','.TXT','.asc','.ASC','.ans','.ANS','.diz','.DIZ','.lha','.LHA'); 	// allowed extensions
		$upload_path = "collys/"; 			
	
		if (isset($filename))
		{
			$filename = $_FILES['uploadedfile']['name']; 							// fetch filename with extension
			$filename=addslashes($filename);
			$filename=cleanInsert($filename);
			$ext = substr($filename, strpos($filename,'.'), strlen($filename)-1); 	// extract extension 
		 	if(!in_array($ext,$allowed_filetypes))									// filetype allowed?		
			{
				?>
				<div class="headline">
					Error
				</div>

				<div class="content_with_blenk">
					This filetype is not allowed here!<br>
					Inform an Admin if this is a valid colly!
				</div>
				<?php
			exit;
			}
		}

		if($filesize > $max_file_size) 		// file too big?
		{
			?>
			<div class="headline">
				Error
			</div>
			
			<div class="content_with_blenk">
				The colly is <?=$filesize?> bytes! The maximum allowed size is <?=$max_file_size?><br>
				If this really is a (huge!) colly, please inform an Admin!
			</div>
			<?php
			exit();
		}
	
		if(!is_writable($upload_path))											// upload dir ok?
		{
			?>
			<div class="headline">
				Error
			</div>

			<div class="content_with_blenk">
				You can not upload to the specified directory, inform an Admin!
			</div>
			<?php
			exit();
		}	
		$ask_existing="select filename from collys where filename='$filename'";
		$result_existing=mysql_query($ask_existing,$dbh);
		while($row_existing=mysql_fetch_row($result_existing))
		{
	        $existing_file=$row_existing[0];
			if($existing_file==$filename)
			{
				?>
				<div class="headline">
					Error
				</div>

				<div class="content_with_blenk">
					The colly already exists!
				</div>

				<?php
				exit();
			}
		}

		if (empty($name))
		{
			?>
			<div class="headline">
				Error
			</div>

			<div class="content_with_blenk">
				Error! You must fill the name field!
			</div>	
			<?php
			exit();
		}

//---------------------------------------------------------------------------------------------------------------
// CONVERT FILE_ID.DIZ
//---------------------------------------------------------------------------------------------------------------

		if ($type == ASCII)
		{
			$filename = $_FILES['uploadedfile']['name']; 							// fetch filename with extension
		   	$filen = $upload_path . basename($_FILES['uploadedfile']['name']); 		// fetch filename with path
	
			if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $filen))
			{ 
				$word1='@BEGIN_FILE_ID.DIZ';
				$word2='@END_FILE_ID.DIZ';
	
				$handle = fopen($filen, "r");
				$contents = fread($handle, filesize($filen));
				fclose($handle);

				list($junk, $good) = split('@BEGIN_FILE_ID.DIZ', $contents);
				list($good, $junk) = split('@END_FILE_ID.DIZ', $good);
				$file_id = $good;
	
				if (strlen ($file_id) > 0)
				{
					file_put_contents($filen.".diz", $file_id);
					load_ansi($filen.".diz","$filen.diz","mosoul","transparent",0);

					$filename = cleanInsert($filename);
					$filename = addslashes($filename);
					$ask="insert into collys values ('$name',$year,'$type','$filename',$now,(null),'$nick',$filesize,$month,'$filename.diz.png',0,(null),$day,0,(null))";
					mysql_query($ask,$dbh);
				}
				else
				{
					$filename = cleanInsert($filename);
					$filename = addslashes($filename);
					$ask="insert into collys values ('$name',$year,'$type','$filename',$now,(null),'$nick',$filesize,$month,'file_id.diz.png',0,(null),$day,0,(null))";
					mysql_query($ask,$dbh);
				} 
			}
		}
		elseif ($type == Archive)	
		{
			$filename = $_FILES['uploadedfile']['name']; 							// fetch filename with extension
		   	$filen = $upload_path . basename($_FILES['uploadedfile']['name']); 		// fetch filename with path
			if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $filen))
			{ 
				$filename_escaped = addslashes($filename);
				$filen = addslashes($filen);

				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq ./$filen file_id.diz >collys/temp.diz");
					$size_check = filesize("collys/temp.diz");
					if ($size_check == 0)
					{
						unlink ("collys/temp.diz");
					}
					if (file_exists("collys/temp.diz"))
					{
						$handle = fopen("collys/temp.diz", "r");
						$contents = fread($handle, filesize("collys/temp.diz"));
						fclose($handle);
					}
				}
			
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq ./$filen FILE_ID.DIZ >collys/temp.diz");
					$size_check = filesize("collys/temp.diz");
					if ($size_check == 0)
					{
						unlink ("collys/temp.diz");
					}
					if (file_exists("collys/temp.diz"))
					{
						$handle = fopen("collys/temp.diz", "r");
						$contents = fread($handle, filesize("collys/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq ./$filen File_Id.Diz >collys/temp.diz");
					$size_check = filesize("collys/temp.diz");
					if ($size_check == 0)
					{
						unlink ("collys/temp.diz");
					}
					if (file_exists("collys/temp.diz"))
					{
						$handle = fopen("collys/temp.diz", "r");
						$contents = fread($handle, filesize("collys/temp.diz"));
						fclose($handle);
					}
				}
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq ./$filen File_Id.Diz >collys/temp.diz");
					$size_check = filesize("collys/temp.diz");
					if ($size_check == 0)
					{
						unlink ("collys/temp.diz");
					}
					if (file_exists("collys/temp.diz"))
					{
						$handle = fopen("collys/temp.diz", "r");
						$contents = fread($handle, filesize("collys/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq ./$filen *.DiZ >collys/temp.diz");
					$size_check = filesize("collys/temp.diz");
					if ($size_check == 0)
					{
						unlink ("collys/temp.diz");
					}
					if (file_exists("collys/temp.diz"))
					{
						$handle = fopen("collys/temp.diz", "r");
						$contents = fread($handle, filesize("collys/temp.diz"));
						fclose($handle);
					}
				}				
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq ./$filen *.dIZ >collys/temp.diz");
					$size_check = filesize("collys/temp.diz");
					if ($size_check == 0)
					{
						unlink ("collys/temp.diz");
					}
					if (file_exists("collys/temp.diz"))
					{
						$handle = fopen("collys/temp.diz", "r");
						$contents = fread($handle, filesize("collys/temp.diz"));
						fclose($handle);
					}
				}
				$contents_check=strlen($contents);
				if ($contents_check <1)
				{
					exec("/usr/bin/lha pq $filen *.diZ >collys/temp.diz");
					$size_check = filesize("collys/temp.diz");
					if ($size_check == 0)
					{
						unlink ("collys/temp.diz");
					}
					if (file_exists("collys/temp.diz"))
					{
						$handle = fopen("collys/temp.diz", "r");
						$contents = fread($handle, filesize("collys/temp.diz"));
						fclose($handle);
					}
				}
				if (file_exists("collys/temp.diz"))
				{
					$size_check = filesize("collys/temp.diz");
					if ($size_check == 0)
					{
						unlink ("collys/temp.diz");
					}
										
					if (file_exists("collys/temp.diz"))
					{
						load_ansi("collys/temp.diz","collys/$filename.diz","mosoul","transparent",0);
					}
				}

				if (!file_exists("collys/temp.diz"))
				{
					file_put_contents("./collys/temp.diz", "$name by $mag_author");
					load_ansi("collys/temp.diz","collys/$filename.diz","mosoul","transparent",0);
				}

				$ask="insert into collys values ('$name',$year,'$type','$filename',$now,(null),'$nick',$filesize,$month,'$filename.diz.png',0,(null),$day,0,(null))";
				mysql_query($ask,$dbh);

			}
		}

//---------------------------------------------------------------------------------------------------------------
// CONVERT ASCII COLLY
//---------------------------------------------------------------------------------------------------------------

		if ($type == ASCII)
		{ 
			$filename = $_FILES['uploadedfile']['name']; 							// fetch filename with extension
		   	$filen = $upload_path . basename($_FILES['uploadedfile']['name']); 		// fetch filename with path

			$dirname = explode(".", $filename);
			$dirname = $dirname[0];

			$filename=str_replace("'", "&#39;",$filename);				// replace ' with &#39

			exec("mkdir collys/$dirname");

			$imagenames=load_ansi("$filen","collys/$dirname/$filename-mosoul","mosoul","$colors",0);
			if ($imagenames!=-1)
			{
				for($i=0;$i<count($imagenames);$i++)
				{
					$imagenames[$i]=str_replace("'", "&#39;",$imagenames[$i]);
					$ask ="insert into image_of values ('$filename-mosoul','$imagenames[$i]')";
					mysql_query($ask,$dbh);
				}
			}
			else
			{
				
				?>
				<div class="headline">
					Error
				</div>

				<div class="content_with_blenk">
					There was an error during the conversion, please inform an admin!
				</div>
				<?php

				$ask ="DELETE from image_of WHERE filename LIKE '$filename%'";
				mysql_query($ask,$dbh);

				$ask ="DELETE from collys WHERE filename='$filename'";
				mysql_query($ask,$dbh);
				
				exit;
			}
					
			$imagenames=load_ansi("$filen","collys/$dirname/$filename-microknight","microknight","$colors",0);
			if ($imagenames!=-1)
			{
				for($i=0;$i<count($imagenames);$i++)
				{
					$imagenames[$i]=str_replace("'", "&#39;",$imagenames[$i]);
					$ask ="insert into image_of values ('$filename-microknight','$imagenames[$i]')";
					mysql_query($ask,$dbh);
				}
			}
			else
			{
				?>
				<div class="headline">
					Error
				</div>

				<div class="content_with_blenk">
					There was an error during the conversion, please inform an admin!
				</div>
				<?php
				$ask ="DELETE from image_of WHERE filename LIKE '$filename%'";
				mysql_query($ask,$dbh);

				$ask ="DELETE from collys WHERE filename='$filename'";
				mysql_query($ask,$dbh);
				
				exit;
			}
			
			$imagenames=load_ansi("$filen","collys/$dirname/$filename-pot-noodle","pot-noodle","$colors",0);
			if ($imagenames!=-1)
			{
				for($i=0;$i<count($imagenames);$i++)
				{
					$imagenames[$i]=str_replace("'", "&#39;",$imagenames[$i]);
					$ask ="insert into image_of values ('$filename-pot-noodle','$imagenames[$i]')";
					mysql_query($ask,$dbh);
				}
			}
			else
			{
				?>
				<div class="headline">
					Error
				</div>

				<div class="content_with_blenk">
					There was an error during the conversion, please inform an admin!
				</div>
				<?php
				
				$ask ="DELETE from image_of WHERE filename LIKE '$filename%'";
				mysql_query($ask,$dbh);

				$ask ="DELETE from collys WHERE filename='$filename'";
				mysql_query($ask,$dbh);
				
				exit;
			}
						
			$imagenames=load_ansi("$filen","collys/$dirname/$filename-topaz","topaz","$colors",0);
			if ($imagenames!=-1)
			{
				for($i=0;$i<count($imagenames);$i++)
				{
					$imagenames[$i]=str_replace("'", "&#39;",$imagenames[$i]);
					$ask ="insert into image_of values ('$filename-topaz','$imagenames[$i]')";
					mysql_query($ask,$dbh);
				}
			}
			else
			{
				?>
				<div class="headline">
					Error
				</div>

				<div class="content_with_blenk">
					There was an error during the conversion, please inform an admin!
				</div>
				<?php
				$ask ="DELETE from image_of WHERE filename LIKE '$filename%'";
				mysql_query($ask,$dbh);

				$ask ="DELETE from collys WHERE filename='$filename'";
				mysql_query($ask,$dbh);
				
				exit;
			}
			
			$imagenames=load_ansi("$filen","collys/$dirname/$filename-topazplus","topazplus","transparent",0);
			if ($imagenames!=-1)
			{
				for($i=0;$i<count($imagenames);$i++)
				{
					{
						$imagenames[$i]=str_replace("'", "&#39;",$imagenames[$i]);
						$ask ="insert into image_of values ('$filename-topazplus','$imagenames[$i]')";
						mysql_query($ask,$dbh);
					}
				}
			}
			else
			{
				?>
				<div class="headline">
					Error
				</div>

				<div class="content_with_blenk">
					There was an error during the conversion, please inform an admin!
				</div>
				<?php
				$ask ="DELETE from image_of WHERE filename LIKE '$filename%'";
				mysql_query($ask,$dbh);

				$ask ="DELETE from collys WHERE filename='$filename'";
				mysql_query($ask,$dbh);
				
				exit;
			}
		}

//---------------------------------------------------------------------------------------------------------------
// WRITE TO COLLY
//---------------------------------------------------------------------------------------------------------------

		foreach($_POST['artist'] as $artist)
		{
			$ask="insert into author_of values ('$artist','$filename')";
			mysql_query($ask,$dbh);
		}

		foreach($_POST['crew'] as $crew)
		{
			$ask="insert into crew_of values ('$crew','$filename')";
			mysql_query($ask,$dbh);
		}

		$result = mysql_query("select sum(filesize) from collys where uploader='$nick'",$dbh);
		if ($row = mysql_fetch_row($result))
		{
			$collysize=$row[0];
		}

		$result = mysql_query("select sum(filesize) from mags where uploader='$nick'",$dbh);
		if ($row = mysql_fetch_row($result))
		{
			$magsize=$row[0];
		}

		$result = mysql_query("select sum(filesize) from apps where uploader='$nick'",$dbh);
		if ($row = mysql_fetch_row($result))
		{
			$appsize=$row[0];
		}
		$pumped = $collysize + $appsize + $magsize;
		mysql_query("update users set uploaded='$pumped' where nick='$nick'", $dbh);

		?>
		<div class="headline">
			Status
		</div>

		<div class="content_with_blenk">
			The colly has been posted!
		</div>

		<?php
		$dirname = explode(".", $filename);
		$dirname = $dirname[0];

		exec("mv collys/$filename* collys/$dirname");
		?>
				
		<meta http-equiv="Refresh" content="0; url=submit.php">
		<?php
		exit;
		}

//---------------------------------------------------------------------------------------------------------------
// CHECK SUBMITTED CREW
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
			$ask="insert into bbs_of values ('$add_crew_bbs','$crewname')";
			mysql_query($ask,$dbh);
			}
		}
													
		$ask="insert into crews values ('$crewname','$crewwww','$crewcontact','$crewtatus',0,'$crewacronym')";
		mysql_query($ask,$dbh);
	
		?>	
		<meta http-equiv='Refresh' content='0; url=submit.php>
		<?php
		exit;
	}

//---------------------------------------------------------------------------------------------------------------
// CHECK SUBMITTED ARTIST
//---------------------------------------------------------------------------------------------------------------

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

		$ask="SELECT nick from artists WHERE nick='$artistnick'";
		$result=mysql_query($ask);
		while ($row=mysql_fetch_row($result))
		{
			$artist_dupe=$row[0];				

			if (strcasecmp($artistnick, $artist_dupe) == 0) 
			{
				?>
				<div class="headline">
					Error
				</div>

				<div class="content_with_blenk">
					The artist already exists!
				</div>
			
				<?php
				exit;
			}
		}
		
		if (empty($artistnick))
		{
			?>
			<div class="headline">
				Error
			</div>

			<div class="content_with_blenk">
				You must fill the artist nick field!
			</div>
		
			<?php
			exit;
		}
																																																											
		$ask="insert into artists values ('$artistnick','$artistwww','$artiststatus','$country_list[$artistcountry]',0,'$artistacronym')";
		mysql_query($ask,$dbh);

		if (isset($_POST[artist_crew]))
		{
			foreach($_POST[artist_crew] as $artist_crew)
			{
			$ask="insert into member_of values ('$artist_crew','$artistnick')";
			mysql_query($ask,$dbh);
			}
		}
		?>		
		<div class="headline">
			Status
		</div>

		<div class="content_with_blenk">
			The artist has been posted!
		</div>
		
		
		<meta http-equiv='Refresh' content='0; url='submit.php'>
		<?php	
		exit;
	}

//---------------------------------------------------------------------------------------------------------------
// CHECK SUBMITTED BBS
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
																																																											
		$ask="insert into bbses values ('$name','$sysop','$address','$number')";
		mysql_query($ask,$dbh);

		?>
		<div class="headline">
			Status
		</div>

		<div class="content_with_blenk">
			The BBS has been posted!
		</div>

		<meta http-equiv='Refresh' content='0; url='submit.php'>
		<?php	
		exit;
	}

//-----------------------------------------------------------------------------
// CHECK SUBMITTED NEWS
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
			<meta http-equiv='Refresh' content='2; url=submit.php'>
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
		<meta http-equiv='Refresh' content='2; url=submit.php'>
		<?php	
		exit;
		}

		$ask="insert into news values (0,'$nick',$time,'$subject','$newstext',1)";
		mysql_query($ask,$dbh);	

		?>
		<meta http-equiv='Refresh' content='0; url=submit.php'>
		<?php	
		exit;

	} 
?>

<!-- -------------------------------------------------------------------------------- -->
<!-- SUBMIT COLLY FIELD                                                               -->
<!-- -------------------------------------------------------------------------------- -->

	<div class="headline">
		Submit Amiga ASCII Colly/ANSI (No PC stuff!)
	</div>

	<div class="content_with_blenk"><br></div>

		<form enctype="multipart/form-data" action="submit.php" method="post">
		<input type="hidden" name="max_file_size" value="10240000">
		<div class="content">
			File
		</div>

		<div class="content">
			<input type="file" name="uploadedfile">
			<input type="SUBMIT" name="dupecheck" value="Dupe Check">
		</div>

		<div class="content">
			Name
		</div>

		<div class="content">
			<input type="text" size="24" name="colly_name">
		</div>

		<div class="content">
			Artist
		</div>

		<div class="content">	
			<span id="new_artist_field"></span> <span onclick="add_artist_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Artist!</button></span>
			<input type="hidden" name="total_artists" id="total_artists" value="0">
		</div>
		
		<div class="content">
			Crew
		</div>

		<div class="content">
			<span id="new_crew_field"></span> <span onclick="add_crew_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Crew!</button></span>
			<input type="hidden" name="total_crews" id="total_crews" value="0">
		</div>

		<div class="content">		
			Date
		</div>

		<div class="content">		
			<select name="day">
				<?php
					$min_day=1;
					$max_day=31;
					echo "<option selected='selected' value=0>Unknown</option>";
					while($min_day<=$max_day)
					{
					echo "<option>$min_day</option>";
					$min_day++;
					}
				?>
			</select>
			<select name="month">
				<option value="0">Unknown</option>
				<option value="1">January</option>
				<option value="2">February</option>
				<option value="3">Mars</option>
				<option value="4">April</option>
				<option value="5">May</option>
				<option value="6">June</option>
				<option value="7">July</option>
				<option value="8">August</option>
				<option value="9">September</option>
				<option value="10">October</option>
				<option value="11">November</option>
				<option value="12">December</option>
			</select>
			<select name="year">
				<?php
					$countyear=1986;
					$maxyear=date("Y");
					echo "<option selected='selected' value=0>Unknown</option>";
					while($countyear<=$maxyear)
					{
						echo "<option value=\"$countyear\">$countyear</option>";
						$countyear++;
					}
				?>
			</select>
		</div>

		<div class="content">
			Type
		</div>

		<div class="content">
			<select name="type">
				<option value="ASCII">ASCII/Ansi</option>
				<option>Archive</option>
			</select>
		</div>

		<div class="content">
			ANSI Colors
		</div>
		
		<div class="content">
			<select name="colors">
				<option value="transparent">ANSI</option>
				<option>Workbench</option>
			</select>
		</div>
		
		<div class="content">			
			<input type="SUBMIT" value="Upload">
		</div>
	</form>

		
<!-- -------------------------------------------------------------------------------- -->
<!-- SUBMIT CREW FIELD                                                                -->
<!-- -------------------------------------------------------------------------------- -->

	<form enctype="multipart/form-data" action="submit.php" method="post">
		<div class="headline">
			Submit Crew	
		</div>

		<div class="content_with_blenk"><br></div>

		<div class="content">
			Name
		</div>

		<div class="content">
			<input type="text" size="20" name="crewname">
		</div>

		<div class="content">
			Acronym
		</div>

		<div class="content">
			<input type="text" size="20" name="crewacronym">
		</div>

		<div class="content">
			Webpage
		</div>

		<div class="content">
			<input type="text" size="20" name="crewwww">
		</div>

		<div class="content">
			BBS
		</div>

		<div class="content">
			<span id="new_crew_bbs_field"></span> <span onclick="add_crew_bbs_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add BBS!</button></span><input type="hidden" name="total_crew_bbses" id="total_crew_bbses" value="0">
		</div>

		<div class="content">
			Contact
		</div>

		<div class="content">
			<input type="text" size="20" name="crewcontact">
		</div>

		<div class="content">
			Status:
		</div>

		<div class="content">
			<select name="crewstatus">
				<option>Active</option>
				<option selected="selected">Inactive</option>
			</select>
		</div>
		
		<div class="content">
			<input type="submit" value="Submit">
		</div>
	</form>


<!-- -------------------------------------------------------------------------------- -->
<!-- SUBMIT ARTIST FIELD                                                              -->
<!-- -------------------------------------------------------------------------------- -->

	<form enctype="multipart/form-data" action="submit.php" method="post">	

		<div class="headline">
			Submit Artist	
		</div>

		<div class="content_with_blenk"><br></div>

		<div class="content">
			Nick
		</div>

		<div class="content">
		<input type="text" size="20" name="artistnick">
		</div>

		<div class="content">
			Acronym
		</div>

		<div class="content">
		<input type="text" size="20" name="artistacronym">
		</div>

		<div class="content">
			Webpage
		</div>

		<div class="content">
			<input type="text" size="20" name="artistwww">
		</div>

		<div class="content">
			Country
		</div>

		<div class="content">
			<select name="artistcountry"> 
				<option value="Unknown">Unknown</option>
				<?php
					foreach($country_list as $symbol => $country)
					{
						echo "<option value=\"$symbol\">$country</option>\n";
					}
				?>
			</select>	
		</div>

		<div class="content">
			Crew
		</div>

		<div class="content">
			<span id="new_artist_crew_field"></span> <span onclick="add_artist_crew_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Crew!</button></span>
			<input type="hidden" name="total_artist_crews" id="total_artist_crews" value="0">
		</div>

		<div class="content">
			Status:
		</div>

		<div class="content">
			<select name="artiststatus">
				<option>Active</option>
				<option>Inactive</option>
			</select>
		</div>

		<div class="content">
			<input type="submit" value="Submit">
		</div>
	</form>
		
<!-- -------------------------------------------------------------------------------- -->
<!-- SUBMIT BBS FIELD                                                               -->
<!-- -------------------------------------------------------------------------------- -->

	<form enctype="multipart/form-data" action="submit.php" method="post">
		<div class="headline">
			Submit BBS	
		</div>

		<div class="content_with_blenk"><br></div>

		<div class="content">
			Name
		</div>
		
		<div class="content">
			<input type="text" size="24" name="name">
		</div>

		<div class="content">
			Sysop
		</div>

		<div class="content">
			<input type="text" size="24" name="sysop">
		</div>

		<div class="content">
			Address
		</div>

		<div class="content">
			<input type="text" size="24" name="address">
		</div>

		<div class="content">
			Phone Number
		</div>

		<div class="content">			
			<input type="text" size="24" name="number">
		</div>

		<div class="content">
			<input type="SUBMIT" name="submitbbs" value="Submit">
		</div>
	</form>

<!-- -------------------------------------------------------------------------------- -->
<!-- SUBMIT APP FIELD                                                           -->
<!-- -------------------------------------------------------------------------------- -->

	<form enctype="multipart/form-data" action="submit.php" method="post">
	<div class="headline">
		Submit ASCII Application		
	</div>

	<div class="content_with_blenk"><br></div>

	<div class="content">
		Name
		</div>

	<div class="content">
		<input type="text" size="24" name="name">
		</div>

	<div class="content">
		Author
		</div>

	<div class="content">
		<input type="text" name="app_author">
		</div>
	
	<?php
		if (($rank == Elite) || ($rank == Admin))
		{
			?>
			<div class="content">
				Status
			</div>
			
			<div class="content">
				<select name="edit_file_status">
					<option>Legal</option>
					<option>Illegal</option>
				</select>
			</div>
			<?php
		}
		?>

	<div class="content">
		File
	</div>

	<div class="content">
		<input name="uploaded_app" type="file">
	</div>

	<div class="content">
		<input type="hidden" name="max_file_size" value="10240000">
	</div>

	<div class="content">
		<input type="hidden" name="type" value="APP">
	</div>

	<div class="content">
		<input type="SUBMIT" value="Upload">
	</div>

	</form>


<!-- -------------------------------------------------------------------------------- -->
<!-- SUBMIT MAG FIELD                                                           -->
<!-- -------------------------------------------------------------------------------- -->

	<form enctype="multipart/form-data" action="submit.php" method="post">
		<div class="headline">
			Submit ASCII Mag
		</div>

		<div class="content_with_blenk"><br></div>

		<div class="content">
			Name
		</div>

		<div class="content">
			<input type="text" size="24" name="name">
		</div>

		<div class="content">
			Author
		</div>

		<div class="content">
			<input type="text" name="mag_author">
		</div>
	
		<div class="content">
			File		
		</div>

		<input name="uploaded_mag" type="file">
		<input type="hidden" name="max_file_size" value="10240000">
		<input type="hidden" name="type" value="MAG">
		<input type="SUBMIT" value="Upload">
	</form>
	
<!-- ----------------------------------------------------------------------------- -->
<!-- SUBMiT NEWS                                                                   -->
<!-- ----------------------------------------------------------------------------- -->

	<form action="submit.php" method="post">

	<div class="headline">
		SUBMiT NEWS
	</div>

	<div class="content_with_blenk"><br></div>

	<div class="content">
		<input type="text" size="85" name="subject">
	</div>

	<div class="content">
		<textarea rows="16" cols="81" name="newstext"></textarea>
	</div>

	<div class="content">	
		<input type="submit" value="Submit News!">
	</div>

	</form>	
	<?php
	}
	else
	{
		?>
		<div class="headline">
			Please Login!
		</div>					

		<div class="content">
			<br>You need to be logged in to use this feature.<br>
			<a href=login.php>LOGiN.</a><br><br>
		</div>
		<?php
	}
	?>
	</div>
	</div>
	</div>
	</body>
</html>

