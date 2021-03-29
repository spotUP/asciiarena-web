<?php

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
			Status
			The app has been uploaded!

			<meta http-equiv="Refresh" content="2"; url="submit.php">
			<?php
			exit;
		}

	}
?>