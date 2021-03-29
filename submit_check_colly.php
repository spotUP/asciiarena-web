
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
?>