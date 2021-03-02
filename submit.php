<?php
require_once "session.php";
$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
include "header.php";
?>

<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">

		<?php
		if (is_logged_in())
		{

//---------------------------------------------------------------------------------------------------------------
// CHECK UPLOADED APP
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
		$result_existing=fetchAll($ask_existing);
		foreach ($result_existing as $row_existing)
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
	   			$file_status = 'Legal';
	   			if(isset($_POST['edit_file_status']))
	   			{
	   				$file_status=$_POST['edit_file_status'];
	   			}
	   			$ask="INSERT INTO apps values (:name,:filename,0,:now,:app_author,:filesize,:filename,0,(null),:nick,:file_id_date,:file_status)";
	   			doQuery($ask, [
	   				'name'         => $name,
	   				'filename'     => $filename,
	   				'now'          => $now,
	   				'app_author'   => $app_author,
	   				'filesize'     => $filesize,
	   				'filename'     => "$filename.diz.png",
	   				'nick'         => $nick,
	   				'file_id_date' => $file_id_date,
	   				'file_status'  => $file_status,
	   			]);
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
	   			$file_status = 'Legal';			
	   			if(isset($_POST['edit_file_status']))
	   			{
	   				$file_status=$_POST['edit_file_status'];
	   			}
	   			$ask="INSERT INTO apps values (:name,:filename,:file_id_date,:now,:app_author,:filesize,:filename,0,(null),:nick,:file_id_date2,:file_status)";
	   			doQuery($ask, [
	   				'name'         => $name,
	   				'filename'     => $filename,
	   				'now'          => $now,
	   				'app_author'   => $app_author,
	   				'filesize'     => $filesize,
	   				'filename'     => "$filename.diz.png",
	   				'nick'         => $nick,
	   				'file_id_date' => $file_id_date,
	   				'file_id_date2' => $file_id_date,
	   				'file_status'  => $file_status,
	   			]);
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
				$file_status = 'Legal';
				if(isset($_POST['edit_file_status']))
				{
					unlink ("apps/temp.diz");
					$file_status=$_POST['edit_file_status'];
				}
				$ask="INSERT INTO apps values (:name,:filename,0,:now,:app_author,:filesize,:filename,0,(null),:nick,:file_id_date,:file_status)";
				doQuery($ask, [
					'name'         => $name,
					'filename'     => $filename,
					'now'          => $now,
					'app_author'   => $app_author,
					'filesize'     => $filesize,
					'filename'     => "$filename.diz.png",
					'nick'         => $nick,
					'file_id_date' => $file_id_date,
					'file_status'  => $file_status,
				]);
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


				$file_status = 'Legal';
				if(isset($_POST['edit_file_status']))
				{
					unlink ("apps/temp.diz");
					$file_status=$_POST['edit_file_status'];
				}
				$ask="INSERT INTO apps values (:name,:filename,0,:now,:app_author,:filesize,:filename,0,(null),:nick,:file_id_date,:file_status)";
				doQuery($ask, [
					'name'         => $name,
					'filename'     => $filename,
					'now'          => $now,
					'app_author'   => $app_author,
					'filesize'     => $filesize,
					'filename'     => "$filename.diz.png",
					'nick'         => $nick,
					'file_id_date' => $file_id_date,
					'file_status'  => $file_status,
				]);
			}
			?>
			<div class="headline">
				Status
			</div>	
			<div class="content_with_blenk">
				The app has been uploaded!
			</div>	

			<meta http-equiv="Refresh" content="2"; url="submit.php">
			<?php
			exit;
		}

	}
//---------------------------------------------------------------------------------------------------------------
// CHECK UPLOADED MAG
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
				$ask_e="SELECT filename FROM mags WHERE filename=:checkfilename";
				$result_e=fetchAll($ask_e, [ 'checkfilename' => $checkfilename ]);
				foreach($result_e as $row_)
				{
					$existing_file=$row_e->filename;

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
	   				$ask="INSERT INTO apps values (:name,:filename,0,:now,:app_author,:filesize,:filename,0,(null),:nick,:file_id_date,:file_status)";
	   				doQuery($ask, [
	   					'name'         => $name,
	   					'filename'     => $filename,
	   					'now'          => $now,
	   					'app_author'   => $app_author,
	   					'filesize'     => $filesize,
	   					'filename'     => "$filename.diz.png",
	   					'nick'         => $nick,
	   					'file_id_date' => $file_id_date,
	   					'file_status'  => $file_status,
	   				]);
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
	   			$ask="INSERT INTO mags values (:name,:filename,0,:now,:mag_author,:filesize,:filename,0,(null),:nick)";
	   			doQuery($ask, [
	   				'name'         => $name,
	   				'filename'     => $filename,
	   				'now'          => $now,
	   				'mag_author'   => $mag_author,
	   				'filesize'     => $filesize,
	   				'filename'     => "$filename.diz.png",
	   				'nick'         => $nick,
	   			]);
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

	   			$ask="INSERT INTO mags values (:name,:filename,0,:now,:mag_author,:filesize,:filename,0,(null),:nick)";
	   			doQuery($ask, [
	   				'name'         => $name,
	   				'filename'     => $filename,
	   				'now'          => $now,
	   				'mag_author'   => $mag_author,
	   				'filesize'     => $filesize,
	   				'filename'     => "$filename.diz.png",
	   				'nick'         => $nick,
	   			]);
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
				$ask="INSERT INTO mags values (:name,:filename,0,:now,:mag_author,:filesize,:filename,0,(null),:nick)";
				doQuery($ask, [
					'name'         => $name,
					'filename'     => $filename,
					'now'          => $now,
					'mag_author'   => $mag_author,
					'filesize'     => $filesize,
					'filename'     => "$filename.diz.png",
					'nick'         => $nick,
				]);
				unlink ("mags/temp.diz");

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
				doQuery("update users set uploaded=:pumped where nick=:nick", [ 'pumped' => $pumped, 'nick' => $nick ]);
			}
		}	
		?>
		<div class="headline">
			Status
		</div>

		<div class="content_with_blenk">		
			The mag has been uploaded!
		</div>
		
		<meta http-equiv="Refresh" content="2"; url="submit.php">
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

		$ask="SELECT filename from collys WHERE filename=:searchquery";
		$result=fetchAll($ask, ['searchquery' => $searchquery ]);
		foreach ($result as $row)
		{
			$dupe=$row->filename;
		}

		if (isset($dupe))
		{
			?>
			<div class="content">
				<?=$dupe?> exists!<br><br>
			</div>
			<meta http-equiv="Refresh" content="2"; url="submit.php">
			<?php
			exit();
		}
		else
		{
			?>
			<div class="content">
				<?=$searchquery?> does NOT exist! Go on boy! Upload it!<br><br>
			</div>
			<meta http-equiv="Refresh" content="2"; url="submit.php">
			<?php
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
		$ask_existing="select filename from collys where filename=:filename";
		$result_existing=fetchAll($ask_existing, [ 'filename' => $filename ]);
		foreach ($result_existing as $row_existing)
		{
			$existing_file=$row_existing->filename;
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

		   			$ask="insert into collys values (:name,:year,:type,:filename,:now,(null),:nick,:filesize,:month,:filename_diz_png,0,(null),:day,0,(null))";
		   			doQuery($ask, [
		   				'name' => $name,
		   				'year' => $year,
		   				'type' => $type,
		   				'filename' => $filename,
		   				'now'  => $now,
		   				'nick' => $nick,
		   				'filesize' => $filesize,
		   				'month' => $month,
		   				'filename_diz_png' => "$filename.diz.png",
		   				'day' => $day,
		   			]);
		   		}
		   		else
		   		{
		   			$ask="insert into collys values (:name,:year,:type,:filename,:now,(null),:nick,:filesize,:month,'file_id_diz.png',0,(null),:day,0,(null))";
		   			doQuery($ask, [
		   				'name' => $name,
		   				'year' => $year,
		   				'type' => $type,
		   				'filename' => $filename,
		   				'now'  => $now,
		   				'nick' => $nick,
		   				'filesize' => $filesize,
		   				'month' => $month,
		   				'day' => $day,
		   			]);
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
		   		$ask="insert into collys values (:name,:year,:type,:filename,:now,(null),:nick,:filesize,:month,:filename_diz_png',0,(null),:day,0,(null))";
		   		doQuery($ask, [
		   			'name' => $name,
		   			'year' => $year,
		   			'type' => $type,
		   			'filename' => $filename,
		   			'now'  => $now,
		   			'nick' => $nick,
		   			'filesize' => $filesize,
		   			'month' => $month,
		   			'day' => $day,
		   			'filename_diz_png' => "$filename.diz.png",
		   		]);
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
					$ask ="insert into image_of values (:filename_mosoul,:imagenames)";
					doQuery($ask, [
						'filename_mosoul' => "$filename-mosoul",
						'imagenames'      => $imagenames[$i],
					]);
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
                # FIXME: Danger Will Robinson, $filename should be escaped so that one can't say $filename = '%'
				$ask ="DELETE from image_of WHERE filename LIKE :filename_pattern";
				doQuery($ask, ['filename_pattern' => "$filename%" ]);

				$ask ="DELETE from collys WHERE filename=:filename";
				doQuery($ask, [ 'filename' => $filename ]);
				
				exit;
			}

			$imagenames=load_ansi("$filen","collys/$dirname/$filename-microknight","microknight","$colors",0);
			if ($imagenames!=-1)
			{
				for($i=0;$i<count($imagenames);$i++)
				{
					$imagenames[$i]=str_replace("'", "&#39;",$imagenames[$i]);
					$ask ="insert into image_of values (:filename_microknight,:imagenames)";
					doQuery($ask, [
						'filename_microknight' => "$filename-microknight",
						'imagenames'           => $imagenames[$i],
					]);
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
                # FIXME: Danger Will Robinson, $filename should be escaped so that one can't say $filename = '%'
				$ask ="DELETE from image_of WHERE filename LIKE :filename_pattern";
				doQuery($ask, ['filename_pattern' => "$filename%" ]);

				$ask ="DELETE from collys WHERE filename=:filename";
				doQuery($ask, [ 'filename' => $filename ]);

				exit;
			}
			
			$imagenames=load_ansi("$filen","collys/$dirname/$filename-pot-noodle","pot-noodle","$colors",0);
			if ($imagenames!=-1)
			{
				for($i=0;$i<count($imagenames);$i++)
				{
					$imagenames[$i]=str_replace("'", "&#39;",$imagenames[$i]);
					$ask ="insert into image_of values (:filename_pot_noodle',:imagenames)";
					doQuery($ask, [
						'filename_pot_noodle' => "$filename-pot-noodle",
						'imagenames'          => $imagenames[$i],
					]);
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

                # FIXME: Danger Will Robinson, $filename should be escaped so that one can't say $filename = '%'
				$ask ="DELETE from image_of WHERE filename LIKE :filename_pattern";
				doQuery($ask, ['filename_pattern' => "$filename%" ]);

				$ask ="DELETE from collys WHERE filename=:filename";
				doQuery($ask, [ 'filename' => $filename ]);

				exit;
			}

			$imagenames=load_ansi("$filen","collys/$dirname/$filename-topaz","topaz","$colors",0);
			if ($imagenames!=-1)
			{
				for($i=0;$i<count($imagenames);$i++)
				{
					$imagenames[$i]=str_replace("'", "&#39;",$imagenames[$i]);
					$ask ="insert into image_of values (:filename_topaz,:imagenames)";
					doQuery($ask, [
						'filename_topaz' => "$filename-topaz",
						'imagenames'      => $imagenames[$i],
					]);
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

                # FIXME: Danger Will Robinson, $filename should be escaped so that one can't say $filename = '%'
				$ask ="DELETE from image_of WHERE filename LIKE :filename_pattern";
				doQuery($ask, ['filename_pattern' => "$filename%" ]);

				$ask ="DELETE from collys WHERE filename=:filename";
				doQuery($ask, [ 'filename' => $filename ]);

				exit;
			}
			
			$imagenames=load_ansi("$filen","collys/$dirname/$filename-topazplus","topazplus","transparent",0);
			if ($imagenames!=-1)
			{
				for($i=0;$i<count($imagenames);$i++)
				{
					{
						$imagenames[$i]=str_replace("'", "&#39;",$imagenames[$i]);
						$ask ="insert into image_of values (:filename_topazplus,:imagenames)";
						doQuery($ask, [
							'filename_topazplus' => "$filename-topazplus",
							'imagenames'         => $imagenames[$i],
						]);
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

                # FIXME: Danger Will Robinson, $filename should be escaped so that one can't say $filename = '%'
				$ask ="DELETE from image_of WHERE filename LIKE :filename_pattern";
				doQuery($ask, ['filename_pattern' => "$filename%" ]);

				$ask ="DELETE from collys WHERE filename=:filename";
				doQuery($ask, [ 'filename' => $filename ]);

				exit;
			}
		}

//---------------------------------------------------------------------------------------------------------------
// WRITE TO COLLY
//---------------------------------------------------------------------------------------------------------------

		foreach($_POST['artist'] as $artist)
		{
			$ask="insert into author_of values (:artist,:filename)";
			doQuery($ask, [ 'artist' => $artist, filename => $filename ]);
		}

		foreach($_POST['crew'] as $crew)
		{
			$ask="insert into crew_of values (:crew,:filename)";
			doQuery($ask, [ 'crew' => $crew, filename => $filename ]);
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
		<meta http-equiv="Refresh" content="0"; url="submit.php">
		<?php
		exit;
	}

//---------------------------------------------------------------------------------------------------------------
// CHECK UPLOADED CREW
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

//---------------------------------------------------------------------------------------------------------------
// CHECK UPLOADED ARTIST
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

		$ask="SELECT nick from artists WHERE nick=:artistnick";
		$result=fetchAll($ask, [ 'artistnick' => $artistnick ]);
		foreach ($result as $row)
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

		$ask="insert into artists (id, nick, www, active, country, rating, acronym, user_id) values (0, :artistnick, :artistwww, :artiststatus, :artistcountry, 0, :artistacronym)";
		doQuery($ask, [
			'artistnick' => $artistnick,
			'artistwww' => $artistwww,
			'artiststatus' => $artiststatus,
			'artistcountry' => $country_list[$artistcountry],
			'artistacronym' => $artistacronym
		]);

		if (isset($_POST[artist_crew]))
		{
			foreach($_POST[artist_crew] as $artist_crew)
			{
				$ask="insert into member_of values (:artist_crew,:artistnick)";
				doQuery($ask, ['artist_crew' => $artist_crew, 'artistnick' => $artistnick ]);
			}
		}
		?>		
		<div class="headline">
			Status
		</div>

		<div class="content_with_blenk">
			The artist has been posted!
		</div>
		
		
		<meta http-equiv="Refresh" content="2"; url="submit.php">
		<?php	
		exit;
	}

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


	<div class="row">
		<div class="col-lg-12">
			<h2 id="nav-tabs">UPLOAD</h2>
			<div class="bs-component">
				<ul class="nav nav-tabs">
					<li class="nav-item">
						<a class="nav-link active" data-toggle="tab" href="#colly">Colly</a>
					</li>
					<li class="nav-item">
						<a class="nav-link" data-toggle="tab" href="#crew">Crew</a>
					</li>
					<li class="nav-item">
						<a class="nav-link" data-toggle="tab" href="#artist">Artist</a>
					</li>
					<li class="nav-item">
						<a class="nav-link" data-toggle="tab" href="#bbs">BBS</a>
					</li>



				</ul>
				<div id="myTabContent" class="tab-content">
					<div class="tab-pane fade show active" id="colly">

						<!-- -------------------------------------------------------------------------------- -->
						<!-- UPLOAD COLLY FIELD                                                               -->
						<!-- -------------------------------------------------------------------------------- -->

						<div class="headline">
							Upload Amiga ASCII Colly/ANSI (No PC stuff!)
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










					</div>
					<div class="tab-pane fade" id="crew">






						<!-- -------------------------------------------------------------------------------- -->
						<!-- ADD CREW FIELD                                                                -->
						<!-- -------------------------------------------------------------------------------- -->

						<form enctype="multipart/form-data" action="submit.php" method="post">
							<div class="headline">
								Add Crew	
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








					</div>
					<div class="tab-pane fade" id="artist">





						<!-- -------------------------------------------------------------------------------- -->
						<!-- ADD ARTIST FIELD                                                              -->
						<!-- -------------------------------------------------------------------------------- -->

						<form enctype="multipart/form-data" action="submit.php" method="post">	

							<div class="headline">
								Add Artist	
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






					</div>
					<div class="tab-pane fade" id="bbs">


						<!-- -------------------------------------------------------------------------------- -->
						<!-- ADD BBS FIELD                                                               -->
						<!-- -------------------------------------------------------------------------------- -->

						<form enctype="multipart/form-data" action="submit.php" method="post">
							<div class="headline">
								Add BBS	
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
					</div>


					<div class="tab-pane fade" id="app">


						<!-- -------------------------------------------------------------------------------- -->
						<!-- UPLOAD APP FIELD                                                                 -->
						<!-- -------------------------------------------------------------------------------- -->

						<form enctype="multipart/form-data" action="submit.php" method="post">
							<div class="headline">
								Upload ASCII Application		
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
							if (($rank == Elite) || is_admin())
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
					</div>

					<div class="tab-pane fade" id="mag">

						<!-- -------------------------------------------------------------------------------- -->
						<!-- UPLOAD MAG FIELD                                                           -->
						<!-- -------------------------------------------------------------------------------- -->

						<form enctype="multipart/form-data" action="submit.php" method="post">
							<div class="headline">
								Upload ASCII Mag
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
					</div>
				</div>

				<?php
			}
			else
			{
				?>
				<div class="col-lg-12">
					<div class="bs-component">
						<div class="alert alert-dismissible alert-primary">
							<button type="button" class="close" data-dismiss="alert">x</button>
							You need to be <a class="ascii" data-toggle="modal" style="padding-right: 8px;" href="#login">logged in</a> in to use this feature.
						</div>
					</div>
				</div>
				<?php
			}
			?>

		</div>
		<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
			<?php include "sidebar.php"; ?>
		</div>
		<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
			<?php include "sidebar_right.php"; ?>
		</div>
	</div>
	<?php include "footer.php"; ?>
