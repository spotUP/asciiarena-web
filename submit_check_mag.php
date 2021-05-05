<?php

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
// CONVERT MAG FILE_ID.DIZ
//---------------------------------------------------------------------------------------------------------------

		if ($type == 'MAG')
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
?>
