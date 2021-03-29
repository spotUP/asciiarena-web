<?php

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
?>