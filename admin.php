<?php
require_once('dbconnect_asciiarena.php'); 
require_once('ansilove.php');
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "https://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<title>ASCIIARENA brought to you by UP ROUGH SOUNDSYSTEM</title>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> 
	<link rel='stylesheet' href='style.css' type='text/css'>
	<meta name="viewport" content="width=device-width">
	<script type="text/javascript">
		function add_colly_crew_field() {
			var newselect = " <select name=\"colly_crew[]\"" + document.getElementById('total_colly_crews').value + "><option>Independent</option><?php
			foreach (fetchAll("SELECT name FROM crews") as $row) {
				echo "<option>{$row->name}</option>";
			}
			echo "</select>\"\n";
			?>
			document.getElementById('new_colly_crew_field').innerHTML = document.getElementById('new_colly_crew_field').innerHTML + newselect;
			document.getElementById('total_colly_crews').value = parseInt(document.getElementById('total_colly_crews').value) + 1;
		}
	</script>

	<script type="text/javascript">
		function add_colly_author_field() {
			var newselect = " <select name=\"colly_author[]\"" + document.getElementById('total_colly_authors').value + "><option value=\"Unknown\">Unknown</option><?php
			foreach (fetchAll("SELECT nick FROM artists") as $row) {
				echo "<option>{$row->nick}</option>";
			}
			echo "</select>\"\n";
			?>
			document.getElementById('new_colly_author_field').innerHTML = document.getElementById('new_colly_author_field').innerHTML + newselect;
			document.getElementById('total_colly_authors').value = parseInt(document.getElementById('total_colly_authors').value) + 1;
		}

	</script>


	<script type="text/javascript">

	function add_bbs_field()
	{
		var newselect = " <select name=\"add_bbs[]\"" + document.getElementById('total_bbses').value + "><option value=\"Unknown\">Unknown</option><?php

			$ask="select name from bbses";
			$result=mysql_query($ask,$dbh);
			while ($row=mysql_fetch_array($result))
			{
		        $add_bbses=$row[0];
		        echo "<option>$add_bbses</option>";
			}
			echo "</select>\"\n";
			?>
		    document.getElementById('new_bbs_field').innerHTML =  document.getElementById('new_bbs_field').innerHTML + newselect;
			document.getElementById('total_bbses').value =  parseInt( document.getElementById('total_bbses').value) + 1;
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
	function add_colly_author_field()
	{
		var newselect = " <select name=\"colly_author[]\"" + document.getElementById('total_colly_authors').value + "><option value=\"Unknown\">Unknown</option><?php

			$ask="select nick from artists";
			$result=mysql_query($ask,$dbh);
			while ($row=mysql_fetch_array($result))
			{
		        $artists=$row[0];
		        echo "<option>$artists</option>";
			}
			echo "</select>\"\n";
			?>
		    document.getElementById('new_colly_author_field').innerHTML =  document.getElementById('new_colly_author_field').innerHTML + newselect;
			document.getElementById('total_colly_authors').value =  parseInt( document.getElementById('total_colly_authors').value) + 1;
	}

	</script>

	<script type="text/javascript">
	function add_colly_crew_field()
	{
		var newselect = " <select name=\"colly_crew[]\"" + document.getElementById('total_colly_crews').value + "><option>Independent</option><?php

			$ask="select name from crews";
			$result=mysql_query($ask,$dbh);
			while ($row=mysql_fetch_array($result))
			{
		        $crews=$row[0];
		        echo "<option value='$crews'>$crews</option>";
			}
			echo "</select>\"\n";
			?>
		    document.getElementById('new_colly_crew_field').innerHTML =  document.getElementById('new_colly_crew_field').innerHTML + newselect;
			document.getElementById('total_colly_crews').value =  parseInt( document.getElementById('total_colly_crews').value) + 1;
	}
	</script>

</head>
<body>

<div class="maincontainer">
	<div class="header">
		<?php include ('header.php'); ?>
	</div>	
	<div class="leftsidebar">
		<?php include ('sidebar.php'); ?>
	</div>	
	<div class="maincontent">
	<?php	
	if (($logged_in == 1) && ($rank =="Admin"))
	{

		//echo "<pre>";print_r($_POST);echo "</pre>";

//---------------------------------------------------------------------------------------------------------------
// SET COLLY TO FIXED
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['colly_fixed']) && $rank=="Admin")
	{
		$fixed_colly=cleanInsert($_POST['filename']);
		$fixed_colly=stripslashes($fixed_colly);
		if(!empty($fixed_colly))
		{
			$ask="update collys set broken=0 where filename='$fixed_colly'";
			mysql_query($ask,$dbh);
		}
		?>
		<meta http-equiv="Refresh" content="0; url=admin.php">
		<?php
	}	



//---------------------------------------------------------------------------------------------------------------
// DELETE USER FROM DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['delete_user']) && $rank=="Admin")
	{
		$delete_user=$_POST['getuser'];
		$delete_user=cleanInsert($delete_user);

		if(!empty($delete_user))
		{
			$ask="delete from users where nick='$delete_user'";
			mysql_query($ask,$dbh);
		}
		?><meta http-equiv="Refresh" content="0; url=admin.php"><?php
	}	


//---------------------------------------------------------------------------------------------------------------
// DELETE CREW FROM DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['do_delete_crew']) && $rank=="Admin")
	{
		$delete_crew=$_POST['getcrew'];
		$delete_crew=cleanInsert($delete_crew);

		if(!empty($delete_crew))
		{
			$ask="delete from crews where name='$delete_crew'";
			mysql_query($ask,$dbh);

			$ask="delete from bbs_of where crew='$delete_crew'";
			mysql_query($ask,$dbh);
		}
		?><meta http-equiv="Refresh" content="0; url=admin.php"><?php
	}	

//---------------------------------------------------------------------------------------------------------------
// DELETE SITELOGO FROM DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['delete_sitelogo']) && $rank=="Admin")
	{
		$delete_sitelogo=$_POST['getsitelogo'];
		$delete_sitelogo=cleanInsert($delete_sitelogo);

		$logo_filename=$_POST['getsitelogo'];
		$logo_filename=cleanInsert($logo_filename);

		$logo_filename=addslashes($logo_filename);
		unlink("logos/$logo_filename");

		if(!empty($delete_sitelogo))
		{
			$ask="delete from logos where filename='$delete_sitelogo'";
			mysql_query($ask,$dbh);
		}
		?><meta http-equiv="Refresh" content="0; url=admin.php"><?php
	}	

//---------------------------------------------------------------------------------------------------------------
// DELETE COLLY FROM DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['do_delete_colly']) && $rank=="Admin")
	{
		$delete_colly=$_POST['filename'];
		$delete_colly=cleanInsert($delete_colly);

		$ask="select uploader from collys where filename='$delete_colly'"; // fetch uploader of deleted colly
		$result=mysql_query($ask,$dbh);
		while ($row=mysql_fetch_array($result))
		{
			$uploader=$row['uploader'];
		}

		$ask="SELECT * FROM image_of WHERE filename LIKE '$delete_colly%'"; // fetch uploader of deleted colly
		$result=mysql_query($ask,$dbh);
		while ($row=mysql_fetch_array($result))
		{
			$collyimage=$row['images'];
			$collyimage=addslashes($collyimage);
			unlink("$collyimage");
		}


		if (file_exists("collys/$delete_colly"))
		{		
			$delete_colly=addslashes($delete_colly);
			unlink("collys/$delete_colly");
		}	
		
		if (file_exists("collys/$delete_colly.diz"))
		{		
			$delete_colly=addslashes($delete_colly);
			unlink("collys/$delete_colly.diz");
		}	
		if (file_exists("collys/$delete_colly.diz.png"))
		{
			$delete_colly=addslashes($delete_colly);
			unlink("collys/$delete_colly.diz.png");
		}
		if (file_exists("collys/$delete_colly.diz"))
		{		
			$delete_colly=addslashes($delete_colly);
			unlink("collys/$delete_colly.diz");
		}
		if (file_exists("collys/$delete_colly-thumbnail.png"))
		{		
			$delete_colly=addslashes($delete_colly);
			unlink("collys/$delete_colly-thumbnail.png");
		}
		
		if(!empty($delete_colly))
		{
			$ask="delete from collys where filename='$delete_colly'"; 
			mysql_query($ask,$dbh);

			$ask="delete from comments where filename='$delete_colly'"; 
			mysql_query($ask,$dbh);

			$ask="DELETE FROM image_of WHERE filename LIKE '$delete_colly%'"; 
			mysql_query($ask,$dbh);

			$ask="DELETE FROM crew_of WHERE filename LIKE '$delete_colly%'"; 
			mysql_query($ask,$dbh);

			$ask="DELETE FROM author_of WHERE filename LIKE '$delete_colly%'"; 
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

//---------------------------------------------------------------------------------------------------------------
// RECALCULATE RATINGS FOR ARTISTS
//---------------------------------------------------------------------------------------------------------------

		$ask="select nick from author_of";
		$result=mysql_query($ask,$dbh);
		while ($row=mysql_fetch_array($result))
		{
			$artist=$row[0];
	
			$ask_avg="select avg(rating) from comments where artist='$artist' and rating>0";
			$result_avg=mysql_query($ask_avg,$dbh);
			while ($row_avg=mysql_fetch_array($result_avg))
			{
				$avg_artist_rating=$row_avg[0];
			}
			
			$ask_rate_amount="SELECT COUNT(rating) from comments where artist='$artist' and rating>0";
			$result_rate_amount=mysql_query($ask_rate_amount,$dbh);
			while ($row_rate_amount=mysql_fetch_array($result_rate_amount))
			{
				$rate_amount=$row_rate_amount[0];
			}

			if ($rate_amount >2)
			{
				$ask_update="update artists set rating=$avg_artist_rating where nick='$artist'";
				mysql_query($ask_update,$dbh);	
			}
		}

//---------------------------------------------------------------------------------------------------------------
// RECALCULATE RATINGS FOR CREWS
//---------------------------------------------------------------------------------------------------------------


		$ask="select name from crews";
		$result=mysql_query($ask,$dbh);
		while ($row=mysql_fetch_array($result))
		{
			$crew=$row[0];

			$ask_rating="select avg(rating) from comments where crew='$crew' and rating>0";
			$result_rating=mysql_query($ask_rating,$dbh);
			while ($row_rating=mysql_fetch_array($result_rating))
			{
				$avg_crew_rating=$row_rating[0];
			}
			if(!isset($avg_crew_rating))
			{
				$avg_crew_rating=0;
			}	
			$ask_update="update crews set rating=$avg_crew_rating where name='$crew'";
			mysql_query($ask_update,$dbh);	
		}
		?>
		<meta http-equiv="Refresh" content="0; url=admin.php">
		<?php
		exit;
	}	

//---------------------------------------------------------------------------------------------------------------
// DELETE BBS FROM DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['delete_bbs']) && $rank=="Admin")
	{
		$delete_bbs=$_POST['getbbs'];
		$delete_bbs=cleanInsert($delete_bbs);

		if(!empty($delete_bbs))
		{
			$ask="delete from bbses where name='$delete_bbs'";
			mysql_query($ask,$dbh);
		}
		?><meta http-equiv="Refresh" content="0; url=admin.php"><?php
	}	

//---------------------------------------------------------------------------------------------------------------
// DELETE ARTIST FROM DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['delete_artist']) && $rank=="Admin")
	{
		$delete_artist=$_POST['getartist'];
		$delete_artist=cleanInsert($delete_artist);
		if(!empty($delete_artist))
		{
			$ask="delete from artists where nick='$delete_artist'";
			mysql_query($ask,$dbh);

			$ask="delete from member_of where nick='$delete_artist'";
			mysql_query($ask,$dbh);
		}
		?><meta http-equiv="Refresh" content="0; url=admin.php"><?php
	}	

//---------------------------------------------------------------------------------------------------------------
// WRITE COLLY INFO TO DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['do_edit_colly']) && $rank=="Admin")
	{
		if(isset($_POST['edit_colly_name']) && $rank=="Admin")
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);

			$edit_colly_name=$_POST['edit_colly_name'];
			$edit_colly_name = cleanInsert($edit_colly_name); 
			$ask="update collys set name='$edit_colly_name' where filename='$filename'";	
			mysql_query($ask,$dbh);
		}

		if(isset($_POST['old_colly_authors']) || (isset($_POST['colly_author']) && $rank=="Admin"))
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);

			$ask="delete from author_of where filename='$filename'";
			mysql_query($ask,$dbh);

			if (isset($_POST['old_colly_authors']))
			{			
				foreach($_POST['old_colly_authors'] as $colly_author)
				{
					$colly_author=cleanInsert($colly_author);
					$ask="insert into author_of values ('$colly_author','$filename')";
					mysql_query($ask,$dbh);
				}
			}
	
			if (isset($_POST['colly_author']))
			{
				foreach($_POST['colly_author'] as $new_colly_author)
				{
					$new_colly_author=cleanInsert($new_colly_author);
					$ask="insert into author_of values ('$new_colly_author','$filename')";
					mysql_query($ask,$dbh);
				}
			}
			$ask="delete from author_of where filename='$filename' and nick='Delete'";
			mysql_query($ask,$dbh);
		}
		if(isset($_POST['old_colly_crews']) || (isset($_POST['colly_crew']) && $rank=="Admin"))
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);

			$ask="delete from crew_of where filename='$filename'";
			mysql_query($ask,$dbh);

			if (isset($_POST[old_colly_crews]))
			{			
				foreach($_POST[old_colly_crews] as $colly_crew)
				{
					$ask="insert into crew_of values ('$colly_crew','$filename')";
					mysql_query($ask,$dbh);
				}
			}
	
			if (isset($_POST[colly_crew]))
			{
				foreach($_POST[colly_crew] as $new_colly_crew)
				{
					$ask="insert into crew_of values ('$new_colly_crew','$filename')";
					mysql_query($ask,$dbh);
				}
			}
			
			$ask="delete from crew_of where filename='$filename' and crew='Delete'";
			mysql_query($ask,$dbh);
		}
		if(isset($_POST['edit_colly_year']) && $rank=="Admin")
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);
			$edit_colly_year=$_POST['edit_colly_year'];
			$edit_colly_year= cleanInsert($edit_colly_year); 
			$ask="update collys set year='$edit_colly_year' where filename='$filename'";	
			mysql_query($ask,$dbh);	
		}
		if(isset($_POST['edit_colly_type']) && $rank=="Admin")
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);
			
			$edit_colly_type=$_POST['edit_colly_type'];
			$edit_colly_type=cleanInsert($edit_colly_type); 

			$ask="update collys set type='$edit_colly_type' where filename='$filename'";	
			mysql_query($ask,$dbh);	
		}
		if(isset($_POST['edit_colly_month']) && $rank=="Admin")
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);
			
			$edit_colly_month=$_POST['edit_colly_month'];
			$edit_colly_month=cleanInsert($edit_colly_month);
			
			$ask="update collys set month='$edit_colly_month' where filename='$filename'";	
			mysql_query($ask,$dbh);	
		}
		if(isset($_POST['edit_colly_day']) && $rank=="Admin")
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);

			$edit_colly_day=$_POST['edit_colly_day'];
			$edit_colly_day=cleanInsert($edit_colly_day); 
			
			$ask="update collys set day='$edit_colly_day' where filename='$filename'";	
			mysql_query($ask,$dbh);	
		}

//---------------------------------------------------------------------------------------------------------------
// RECALCULATE RATINGS
//---------------------------------------------------------------------------------------------------------------

		$ask="select nick from author_of";
		$result=mysql_query($ask,$dbh);
		while ($row=mysql_fetch_array($result))
		{
			$artist=$row[0];

			$ask_rating="select avg(rating) from comments where artist='$artist' and rating>0";
			$result_rating=mysql_query($ask_rating,$dbh);
			while ($row_rating=mysql_fetch_array($result_rating))
			{
				$avg_artist_rating=$row_rating[0];
			}

			if(!isset($avg_artist_rating))
			{
				$avg_artist_rating=0;
			}	

			$ask_update="update artists set rating=$avg_artist_rating where nick='$artist'";
			mysql_query($ask,$dbh);	
		}
		$ask="select crew from crew_of";
		$result=mysql_query($ask,$dbh);
		while ($row=mysql_fetch_array($result))
		{
			$crew=$row[0];

			$ask_rating="select avg(rating) from comments where crew='$crew' and rating>0";
			$result_rating=mysql_query($ask_rating,$dbh);
			while ($row=mysql_fetch_array($result_rating))
			{
				$avg_crew_rating=$row_rating[0];
			}
			if(!isset($avg_crew_rating))
			{
				$avg_crew_rating=0;
			}	
			$ask_update="update crews set rating=$avg_crew_rating where name='$crew'";
			mysql_query($ask_update,$dbh);	
		}
		?>
		<meta http-equiv="Refresh" content="0; url=admin.php">
		<?php
		exit;
	}	

		
//---------------------------------------------------------------------------------------------------------------
// WRITE CREW INFO TO DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['do_change_crew']) && $rank=="Admin")
	{
		if(isset($_POST['edit_crew_name']) && $rank=="Admin")
		{
			$crew=$_POST['getcrew'];
			$crew=cleanInsert($crew);

			$edit_crew_name=$_POST['edit_crew_name'];
			$edit_crew_name=cleanInsert($edit_crew_name); 

			$ask="update crews set name='$edit_crew_name' where name='$crew'";	
			mysql_query($ask,$dbh);	

			$ask="update crew_of set crew='$edit_crew_name' where crew='$crew'";	
			mysql_query($ask,$dbh);	

			$ask="update bbs_of set crew='$edit_crew_name' where crew='$crew'";	
			mysql_query($ask,$dbh);

			$ask="update member_of set crew='$edit_crew_name' where crew='$crew'";	
			mysql_query($ask,$dbh);
			}
			if(isset($_POST['edit_crew_www']) && $rank=="Admin")
			{
				$crew=$_POST['getcrew'];
				$crew=cleanInsert($crew);

				$edit_crew_www=$_POST['edit_crew_www'];
				$edit_crew_www=cleanInsert($edit_crew_www); 

				$ask="update crews set www='$edit_crew_www' where name='$edit_crew_name'";	
				mysql_query($ask,$dbh);	
			}

			if(isset($_POST['add_bbs']) && $rank=="Admin")
			{
				foreach($_POST[add_bbs] as $add_bbs) // add new bbses
				{
				$ask="insert into bbs_of values ('$add_bbs','$crew')";
				mysql_query($ask,$dbh);
				}
			}

			if(isset($_POST['edit_crew_contact']) && $rank=="Admin")
			{
				$crew=$_POST['getcrew'];
				$crew=cleanInsert($crew);

				$edit_crew_contact=$_POST['edit_crew_contact'];
				$edit_crew_contact=cleanInsert($edit_crew_contact); 

				$ask="update crews set contact='$edit_crew_contact' where name='$edit_crew_name'";	
				mysql_query($ask,$dbh);	
			}
			if(isset($_POST['edit_crew_status']) && $rank=="Admin")
			{
				$crew=$_POST['getcrew'];
				$crew=cleanInsert($crew);

				$edit_crew_status=$_POST['edit_crew_status'];
				$edit_crew_status=cleanInsert($edit_crew_status); 

				$ask="update crews set active='$edit_crew_status' where name='$edit_crew_name'";	
				mysql_query($ask,$dbh);	
			}
			if(isset($_POST['edit_crew_acronym']) && $rank=="Admin")
			{
				$crew=$_POST['getcrew'];
				$crew=cleanInsert($crew);

				$edit_crew_acronym=$_POST['edit_crew_acronym'];
				$edit_crew_acronym=cleanInsert($edit_crew_acronym); 

				$ask="update crews set acronym='$edit_crew_acronym' where name='$edit_crew_name'";	
				mysql_query($ask,$dbh);	
			}
		}
//---------------------------------------------------------------------------------------------------------------
// WRITE ARTIST INFO TO DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['do_edit_artist']) && $rank=="Admin")
	{
		if(isset($_POST['edit_artist_nick']) && $rank=="Admin")
		{
			$artist=$_POST['getartist'];
			$artist=cleanInsert($artist);

			$edit_artist_nick=$_POST['edit_artist_nick'];
			$edit_artist_nick = cleanInsert($edit_artist_nick); 

			$ask="update artists set nick='$edit_artist_nick' where nick='$artist'";	
			mysql_query($ask,$dbh);	

			$ask="update member_of set nick='$edit_artist_nick' where nick='$artist'";	
			mysql_query($ask,$dbh);	

			$ask="update author_of set nick='$edit_artist_nick' where nick='$artist'";	
			mysql_query($ask,$dbh);	

		}
		if(isset($_POST['edit_artist_www']) && $rank=="Admin")
		{
			$artist=$_POST['getartist'];
			$artist=cleanInsert($artist);
			
			$edit_artist_www=$_POST['edit_artist_www'];
			$edit_artist_www = cleanInsert($edit_artist_www); 

			$ask="update artists set www='$edit_artist_www' where nick='$edit_artist_nick'";	
			mysql_query($ask,$dbh);	
		}
		if(isset($_POST['edit_artist_status']) && $rank=="Admin")
		{
			$artist=$_POST['getartist'];
			$artist=cleanInsert($artist);
			
			$edit_artist_status=$_POST['edit_artist_status'];
			$edit_artist_status = cleanInsert($edit_artist_status); 

			$ask="update artists set active='$edit_artist_status' where nick='$edit_artist_nick'";	
			mysql_query($ask,$dbh);	
		}
		if(isset($_POST['old_artist_crews']) || (isset($_POST['artist_crew']) && $rank=="Admin"))
		{
			$artist=$_POST['getartist'];
			$artist=cleanInsert($artist);

			$ask="delete from member_of where nick='$edit_artist_nick'";
			mysql_query($ask,$dbh);

			if (isset($_POST[old_artist_crews]))			
			{
				foreach($_POST[old_artist_crews] as $artist_crew)
				{
					$ask="insert into member_of values ('$artist_crew','$edit_artist_nick')";
					mysql_query($ask,$dbh);
				}
			}
			if (isset($_POST[artist_crew]))
			{
				foreach($_POST[artist_crew] as $new_artist_crew)
				{
					$ask="insert into member_of values ('$new_artist_crew','$edit_artist_nick')";
					mysql_query($ask,$dbh);
				}
			}
			
			$ask="delete from member_of where nick='$edit_artist_nick' and crew='Delete'";
			mysql_query($ask,$dbh);
		}

		if(isset($_POST['change_artist_country']) && $rank=="Admin")
		{
			$artist=cleanInsert($_POST['getartist']);
			$change_artist_country = cleanInsert($_POST['change_artist_country']); 

			if (!empty($change_artist_country))
			{
				$ask="update artists set country='$country_list[$change_artist_country]' where nick='$edit_artist_nick'";	
				mysql_query($ask,$dbh);	
			}
		}

		if(isset($_POST['edit_artist_acronym']) && $rank=="Admin")
		{
			$artist=$_POST['getartist'];
			$artist=cleanInsert($artist);
			
			$edit_artist_acronym=$_POST['edit_artist_acronym'];
			$edit_artist_acronym=cleanInsert($edit_artist_acronym); 

			$ask="update artists set acronym='$edit_artist_acronym' where nick='$edit_artist_nick'";	
			mysql_query($ask,$dbh);	
		}
	}

//---------------------------------------------------------------------------------------------------------------
// WRITE BBS INFO TO DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['do_edit_bbs']) && $rank=="Admin")
	{
		if(isset($_POST['edit_bbs_name']) && $rank=="Admin")
		{
			$bbs_name=$_POST['getbbs'];
			$bbs_name=cleanInsert($bbs_name);

			$edit_bbs_name=$_POST['edit_bbs_name'];
			$edit_bbs_name=cleanInsert($edit_bbs_name); 

			$ask="update bbses set name='$edit_bbs_name' where name='$bbs_name'";	
			mysql_query($ask,$dbh);	

			$ask="update bbs_of set name='$edit_bbs_name' where name='$bbs_name'";	
			mysql_query($ask,$dbh);	
		}
		if(isset($_POST['edit_bbs_sysop']) && $rank=="Admin")
		{
			$bbs_name=$_POST['getbbs'];
			$bbs_name=cleanInsert($bbs_name);
			
			$edit_bbs_sysop=$_POST['edit_bbs_sysop'];
			$edit_bbs_sysop= cleanInsert($edit_bbs_sysop); 

			$ask="update bbses set sysop='$edit_bbs_sysop' where name='$edit_bbs_name'";	
			mysql_query($ask,$dbh);	
		}
		if(isset($_POST['edit_bbs_address']) && $rank=="Admin")
		{
			$bbs_name=$_POST['getbbs'];
			$bbs_name=cleanInsert($bbs_name);
		
			$edit_bbs_address = $_POST['edit_bbs_address'];
			$edit_bbs_address = cleanInsert($edit_bbs_address); 

			$ask="update bbses set address='$edit_bbs_address' where name='$edit_bbs_name'";	
			mysql_query($ask,$dbh);	
		}
		if(isset($_POST['edit_bbs_number']) && $rank=="Admin")
		{
			$bbs_name=$_POST['getbbs'];
			$bbs_name=cleanInsert($bbs_name);

			$edit_bbs_number=$_POST['edit_bbs_number'];
			$edit_bbs_number=cleanInsert($edit_bbs_number); 

			$ask="update bbses set number='$edit_bbs_number' where name='$edit_bbs_name'";	
			mysql_query($ask,$dbh);	
		}
	}

//---------------------------------------------------------------------------------------------------------------
// WRITE FORUM DATA TO DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['do_edit_forum']) && $rank=="Admin")
	{
		if(isset($_POST['do_add_new_forum_member']) && $rank=="Admin")
		{
			$new_forum_member=$_POST['new_forum_member'];
			$new_forum_member=cleanInsert($new_forum_member);

			$new_forum_name=$_POST['new_forum_name'];
			$new_forum_name=cleanInsert($new_forum_name);

			$new_forum_id=$_POST['new_forum_id'];
			$new_forum_id=cleanInsert($new_forum_id);

			$ask="insert into forum_access values ('$new_forum_member','$new_forum_name',$new_forum_id)";	
			mysql_query($ask,$dbh);	
		}
			
		if(isset($_POST['do_add_new_forum']) && $rank=="Admin")
		{
			$new_forum_name=$_POST['new_forum_name'];
			$new_forum_name=cleanInsert($new_forum_name); 

			$new_forum_public=$_POST['new_forum_public'];
			$new_forum_public=cleanInsert($new_forum_public); 

			$ask="select forum_id from forum_forum ORDER BY forum_id DESC LIMIT 1"; // grab latest id
			$result=mysql_query($ask,$dbh);
			while ($row=mysql_fetch_array($result))
			{
				$new_forum_id=$row[0];
			}
			if(!isset($new_forum_id))
			{
				$new_forum_id=1;
			}
			else
			{
				$new_forum_id=$new_forum_id+1;
			}

			$ask="insert into forum_forum values ($new_forum_id,'$new_forum_name','$new_forum_public')";	
			mysql_query($ask,$dbh);	
		}
	}

//---------------------------------------------------------------------------------------------------------------
// WRITE USER INFO TO DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['changeusernick']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);

		$user_nick=$_POST['getuser'];
		$user_nick=cleanInsert($user_nick);

		$ask="update users set nick='$change_user_nick' where nick='$user_nick'";
		mysql_query($ask,$dbh);	
	}
	if(isset($_POST['changeusercrew']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);
		
		$changecrew=$_POST['changeusercrew'];
		$changecrew=cleanInsert($changecrew);
		
		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);
		
		$ask="update users set crew='$changecrew' where nick='$change_user_nick'";
		mysql_query($ask,$dbh);	
	}
	if(isset($_POST['edit_user_rank']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);

		$edit_user_rank=$_POST['edit_user_rank'];
		$edit_user_rank=cleanInsert($edit_user_rank);

		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);

		$ask="update users set rank='$edit_user_rank' where nick='$change_user_nick'";
		mysql_query($ask,$dbh);	
	}
	if(isset($_POST['changeuserbyear']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);

		$changebyear=$_POST['changeuserbyear'];
		$changebyear=cleanInsert($changebyear);

		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);

		$ask="update users set byear=$changebyear where nick='$change_user_nick'";
		mysql_query($ask,$dbh);	
	}
	if(isset($_POST['changeuserbmonth']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);

		$changebmonth=$_POST['changeuserbmonth'];
		$changebmonth=cleanInsert($changebmonth);

		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);

		$ask="update users set bmonth=$changebmonth where nick='$change_user_nick'";
		mysql_query($ask,$dbh);	
	}
	if(isset($_POST['changeuserbday']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);

		$changebday=$_POST['changeuserbday'];
		$changebday=cleanInsert($changebday);

		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);

		$ask="update users set bday=$changebday where nick='$change_user_nick'";
		mysql_query($ask,$dbh);	
	}
	if(isset($_POST['changeusercountry']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);
		
		$change_country=$_POST['changeusercountry'];
		$change_country=cleanInsert($change_country);

		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);

		$ask="update users set country='$country_list[$change_country]' where nick='$change_user_nick'";
		mysql_query($ask,$dbh);	
	}
	if(isset($_POST['changeusermessenger']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);

		$changemessenger=$_POST['changeusermessenger'];
		$changemessenger=cleanInsert($changemessenger);

		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);
		
		$ask="update users set messenger='$changemessenger' where nick='$change_user_nick'";
		mysql_query($ask,$dbh);	
	}
	if(isset($_POST['changeusermail']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);

		$mail=$_POST['changeusermail'];
		$mail=cleanInsert($mail);

		$mail = trim($_POST['changeusermail']);  
		if(!checkEmail($mail)) 
		{
			?>
			<div class="headline">
				Error
			</div>
			<div class="content_with_blenk">
				You must enter a valid E-Mail adress!
			</div>
			<meta http-equiv="Refresh" content="2; url=admin.php">
			<?php
			exit();
		}
		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);

		$ask="update users set mail='$mail' where nick='$change_user_nick'";
		mysql_query($ask,$dbh);	
	}
	
//---------------------------------------------------------------------------------------------------------------
// WRITE USER SIGNATURE TO DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['setcolor']))
	{
		$signature=$_POST['signature'];
		$signature=cleanInsert($signature);

		$user_signature=$_POST['user_signature'];
		$user_signature=cleanInsert($user_signature);
		
		$sigdata=$_POST['signature'];
		$sigdata=cleanInsert($sigdata);

		$font=$_POST['font'];
		$font=cleanInsert($font);
		
		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);
		
		$signature=utf8_decode($signature); // convert UTF-8 string to ISO-88591

		if(empty($signature))
		{
			?>
			<div class="headline">
				Error
			</div>
			<div class="content_with_blenk">
				You have to make a signature before submitting!
			</div>
			<meta http-equiv="Refresh" content="2; url=admin.php">
			<?php
			exit();
		}

		$rgbvalue=$_POST['setcolor'];
		$rgbvalue = explode(",", $rgbvalue);
		$delimiter=",";

		file_put_contents("signatures/tempsignature.diz", $signature);
		load_ansi("signatures/tempsignature.diz","signatures/tempsignature.diz","$font","transparent",0);

		$old_fg_color_r="170";
		$old_fg_color_g="170";
		$old_fg_color_b="170";
	
		$image = imageCreateFromPNG("signatures/tempsignature.diz.png");
	
		$fg_color = imageColorExact($image,$old_fg_color_r,$old_fg_color_g,$old_fg_color_b);	//get color to replace
		imageColorSet($image,$fg_color,$rgbvalue[0],$rgbvalue[1],$rgbvalue[2]);		//replace color with

		imagepng($image,"signatures/$user_signature.png");	 											// save image		

		$ask="update users set signature='$user_signature' where nick='$edit_user_nick'";
		mysql_query($ask,$dbh);

		$sigdata=cleanInsertPost($sigdata);
		$ask="update users set sigdata='$sigdata' where nick='$edit_user_nick'";
		mysql_query($ask,$dbh);

		unlink ("signatures/tempsignature.diz");
		unlink ("signatures/tempsignature.diz.png");
	}

//---------------------------------------------------------------------------------------------------------------
// WRITE EDITED LOGO TO DISK
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['editedsitelogo']))
	{
		$logo=$_POST['getsitelogo'];
		$logo=cleanInsert($logo);

		$editedsitelogodata=$_POST['editedsitelogo'];

		$font=$_POST['font'];
		$font=cleanInsert($font);
		
		$editedsitelogodata=utf8_decode($editedsitelogodata); // convert UTF-8 string to ISO-88591

		if(empty($editedsitelogodata))
		{
			?>
			<div class="headline">
				Error
			</div>
			<div class="content_with_blenk">
				You submit an empty logo!
			</div>
			<meta http-equiv="Refresh" content="2; url=admin.php">
			<?php
			exit();
		}

		$rgbvalue=$_POST['set_edited_logo_color'];
		$rgbvalue=cleanInsert($rgbvalue);
		$rgbvalue = explode(",", $rgbvalue);
		$delimiter=",";

		file_put_contents("templogo.diz", $editedsitelogodata);
		load_ansi("templogo.diz","templogo.diz","$font","transparent",0);

		$old_fg_color_r="170";
		$old_fg_color_g="170";
		$old_fg_color_b="170";
	
		$image = imageCreateFromPNG("templogo.diz.png");
	
		$fg_color = imageColorExact($image,$old_fg_color_r,$old_fg_color_g,$old_fg_color_b);	//get color to replace
		imageColorSet($image,$fg_color,$rgbvalue[0],$rgbvalue[1],$rgbvalue[2]);		//replace color with

		imagepng($image,"logos/$logo");	 											// save image		

		unlink ("templogo.diz");
		unlink ("templogo.diz.png");

		$editedsitelogodata=cleanInsertPost($editedsitelogodata);
		$ask_update="update logos set ascii='$editedsitelogodata' where filename='$logo'";
		mysql_query($ask_update,$dbh);	

		$ask_update="update logos set base64='1' where filename='$logo'";
		mysql_query($ask_update,$dbh);	
	}

//--------------------------------------------------------------------------------
// EDIT COLLY FIELD
//--------------------------------------------------------------------------------

	if(isset($_POST['getcollyname']) && (!isset($_POST['do_edit_colly'])))
	{
		$getcollyname=$_POST['getcollyname'];
		$getcollyname=cleanInsert($getcollyname);
		
		$ask="select * from collys where filename='$getcollyname'";
		$result=mysql_query($ask);
		while ($row=mysql_fetch_array($result))
		{
			$show_colly_name=$row['name'];
			$show_colly_crew=$row['crew'];
			$show_colly_year=$row['year'];
			$show_colly_month=$row['month'];
			$show_colly_day=$row['day'];
			$show_colly_type=$row['type'];
			$show_colly_diz=$row['file_id'];
		}
	}
	?>
	<form enctype="multipart/form-data" action="admin.php" method="post">		
	<div class="wrap">
	<div class="headline">
		Edit ASCII Collection				
	</div>
	<div class="content_with_blenk">&nbsp;</div>

	<div class="content">
		<select name="getcollyname">
			<?php if (isset($show_colly_name))
			{
				echo "<option>$show_colly_name</option>";
			}
			$ask="SELECT name, filename FROM collys ORDER BY filename";
			$result=mysql_query($ask,$dbh);	
			while ($row=mysql_fetch_array($result))
			{
				$show_all_colly_names=$row['name'];
				$show_all_colly_filenames=$row['filename'];
				echo "<option>$show_all_colly_filenames</option>";
			}
			?>
		</select>
		<input type="submit" name="open_edit_colly_field" value="Select">
		<input type="hidden" name="filename" value="<?=$getcollyname?>">
	</div>
	<?php
			if(isset($_POST['getcollyname']) && (isset($_POST['open_edit_colly_field'])))
			{
				$getcollyname=$_POST['getcollyname'];
				?>
				<div class="content">
					<img border="0" src="collys/<?=$show_colly_diz?>"></a>
				</div>
					<div style="float: left; height: 25px; width: 180px; text-align: left; padding-left: 4px; padding-bottom: 2px; padding-top: 2px;">
						Name
					</div>
							
					<div style="float: right; width: 510px; height: 25px; text-align: left; padding-bottom: 2px; padding-top: 2px;">
						<input type="text" size="32" name="edit_colly_name" value="<?=$show_colly_name?>">
					</div>

					<div class="info_release_left">
						Type
					</div>

					<div class="info_release_right">			
						<select name="edit_colly_type">
							<option><?=$show_colly_type?></option>
							<option>ASCII</option>
							<option>ANSI</option>
						</select>
					</div>
						
					<div class="info_release_left">
						Release Date
					</div>
					
					<div class="info_release_right">
						<?php
						echo "<SELECT NAME=edit_colly_year>";
						$countyear=1986;
						$maxyear=date("Y");
						echo "<option>$show_colly_year</option>";
						while($countyear<=$maxyear)
						{
							echo "<option>$countyear</option>";
							$countyear++;
						}

						?>
						</select>
						<select name="edit_colly_month">
							<option selected='selected'><?=$show_colly_month?></option>
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
						<select name="edit_colly_day">
							<?php
							echo "<option selected='selected' value='0'>$show_colly_day</option>";
							echo "<option value='0'>Unknown</option>";
							$min_day=1;
							$max_day=31;
							while($min_day<=$max_day)
							{
								echo "<option>$min_day</option>";
								$min_day++;
							}
							?>
						</select>
					</div>
					
					<div class="info_release_left">			
						Artist(s)
					</div>
					
					<div class="info_release_right">											
						<?php
						$ask="select nick from author_of where filename='$getcollyname'";
						$result=mysql_query($ask,$dbh);
						while ($row=mysql_fetch_array($result))
						{
							$colly_author=$row[0];
							echo "<select name=\"old_colly_authors[]\">"; 
							echo "<option selected=\"selected\">$colly_author</option>";
							echo "<option value='Delete'>Remove Author</option>";

							$ask_authors="select nick from artists";
							$result_authors=mysql_query($ask_authors,$dbh);
							while ($row_authors=mysql_fetch_array($result_authors))
							{
								$authors=$row_authors[0];
								echo "<option>$authors</option>";
							}
							echo "</select>";
						}
						?>
						<span id="new_colly_author_field"></span> <span onclick="add_colly_author_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Author!</button></span>
						<input type="hidden" name="total_colly_authors" id="total_colly_authors" value="0">
					</div>
				
					<div class="info_release_left">			
						Crew(s)
					</div>
					
					<div class="info_release_right">							

						<?php
						$ask="select crew from crew_of where filename='$getcollyname'";
						$result=mysql_query($ask,$dbh);
						while ($row=mysql_fetch_array($result))
						{
							$colly_crew=$row[0];
							echo "<select name=\"old_colly_crews[]\">"; 
							echo "<option selected=\"selected\">$colly_crew</option>";
							echo "<option value='Delete'>Remove Crew</option>";
								$ask_crews="select name from crews";
							$result_crews=mysql_query($ask_crews,$dbh);
							while ($row_crews=mysql_fetch_array($result_crews))
							{
								$crews=$row_crews[0];
								echo "<option>$crews</option>";
							}
							echo "</select>";
						}
						?>

						<span id="new_colly_crew_field"></span> <span onclick="add_colly_crew_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Crew!</button></span>
						<input type="hidden" name="total_colly_crews" id="total_colly_crews" value="0">
					</div>
										
					<div class="content">
						<input type="hidden" name="filename" value="<?=$getcollyname?>">
						<input type="submit" name="do_edit_colly" value="Change">
						<input type="submit" name="do_delete_colly" value="Delete">
					</div>
				</div>						
			</form>
			<?php
		 }

//--------------------------------------------------------------------------------
// EDIT CREW FIELD
//--------------------------------------------------------------------------------

	if(isset($_POST['getcrew']) && $rank=="Admin")
	{
		$getcrew=$_POST['getcrew'];
		$getcrew=cleanInsert($getcrew);
		$ask="select * from crews where name='$getcrew'";
		$result=mysql_query($ask);
		while ($row=mysql_fetch_array($result))
		{
			$show_crew_name=$row['name'];
			$show_crew_www=$row['www'];
			$show_crew_bbs=$row['bbs'];
			$show_crew_contact=$row['contact'];
			$show_crew_status=$row['active'];
			$show_crew_acronym=$row['acronym'];
		}
	}
	?>
	<form enctype="multipart/form-data" action="admin.php" method="post">
		<div class="headline">
			Edit Crew				
		</div>
		<div class="content_with_blenk">&nbsp;</div>
		<div class="content">
			<select name="getcrew">
				<?php
				if (isset($show_crew_name))
				{
					echo "<option selected=\"selected\">$show_crew_name</option>";
				}
				$ask="select name from crews";
				$result=mysql_query($ask,$dbh);
				while ($row=mysql_fetch_array($result))
				{
					$show_all_crew_names=$row['name'];
					echo "<option>$show_all_crew_names</option>";
				}
				?>
				</select>
				<input type="submit" name="open_edit_crew_field" value=Select>
		</div>
	</form>

	<?php
		if(isset($_POST['getcrew']) && (isset($_POST['open_edit_crew_field'])))
		{
			$getcrew=$_POST['getcrew'];
			$getcrew=cleanInsert($getcrew);

			$ask="select * from crews where name='$getcrew'";
			$result=mysql_query($ask);
			while ($row=mysql_fetch_array($result))
			{
				$show_crew_name=$row['name'];
				$show_crew_www=$row['www'];
				$show_crew_bbs=$row['bbs'];
				$show_crew_contact=$row['contact'];
				$show_crew_status=$row['active'];
				$show_crew_acronym=$row['acronym'];
			}
			
			?>
			<form enctype="multipart/form-data" action="admin.php" method="post">
			<br>
			<div class="content">
				Name
			</div>

			<div class="content">
				<input type="text" size="20" name="edit_crew_name" value="<?=$show_crew_name?>">
			</div>

			<div class="content">
				Acronym
			</div>

			<div class="content">
				<input type="text" size="20" name="edit_crew_acronym" value="<?=$show_crew_acronym?>">
			</div>

			<div class="content">
				Webpage
			</div>

			<div class="content">
				<input type="text" size="20" name="edit_crew_www" value="<?=$show_crew_www?>">
			</div>

			<div class="content">
				BBS(es)
			</div>

			<div class="content">		
				<?php
				$ask="select name from bbs_of where crew='$getcrew'";
				$result=mysql_query($ask,$dbh);
				while ($row=mysql_fetch_array($result))
				{
					$bbs = $row['name'];
					echo "<select name=\"edit_bbs[]\">";
						echo "<option selected=\"selected\">$bbs</option>";

					$ask_bbs="select name from bbses";
					$result_bbs=mysql_query($ask_bbs,$dbh);
					while ($row_bbs=mysql_fetch_array($result_bbs))
					{
						$all_bbses=$row_bbs['name'];
						echo "<option>$all_authors</option>";
					}
				echo "</select>";	
				}
				?>
				<span id="new_bbs_field"></span> <span onclick="add_bbs_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add BBS!</button></span>
				<input type="hidden" name="total_bbses" id="total_bbses" value="0">
			</div>

			<div class="content">
				Contact
			</div>

			<div class="content">
				<input type="text" size="20" name="edit_crew_contact" value="<?=$show_crew_contact?>">
			</div>

			<div class="content">
				Status:
			</div>

			<div class="content">			
				<select name="edit_crew_status">
					<option selected="selected"><?=$show_crew_status?></option>
					<option>Yes</option>
					<option>No</option>
				</select>
			</div>

			<div class="content">			
				<input type="hidden" name="delete_crew" value="<?=$getcrew?>">
				<input type="submit" name="do_delete_crew" value="Delete">
				<input type="hidden" name="getcrew" value="<?=$getcrew?>">
				<input type="submit" name="do_change_crew" value="Change">
			</div>
			<?php
			} 
			?>
	</form>
	<?php

//--------------------------------------------------------------------------------
// EDIT ARTIST FIELD
//--------------------------------------------------------------------------------

	if(isset($_POST['getartist']) && $rank=="Admin")
	{
		$getartist=$_POST['getartist'];
		$getartist=cleanInsert($getartist);
		
		$ask="select * from artists where nick='$getartist'";
		$result=mysql_query($ask);
		while ($row=mysql_fetch_array($result))
		{
			$show_artist_nick=$row['nick'];
			$show_artist_www=$row['www'];
			$show_artist_status=$row['active'];
			$show_artist_crew=$row['crew'];
			$show_artist_bbs=$row['bbs'];
			$show_artist_country=$row['country'];
			$show_artist_acronym=$row['acronym'];
		}
	}
	?>
	<form enctype="multipart/form-data" action="#" method="post">

		<div class="headline">
			Edit Artist				
		</div>
		<div class="content_with_blenk">&nbsp;</div>
		
	<select name="getartist">
	<?php
	if (isset($show_artist_nick))
	{
  		echo "<option selected=\"selected\" value=\"$show_all_user_names\">$show_artist_nick</option>";
	}
	$ask="select nick from artists";
	$result=mysql_query($ask,$dbh);
	while ($row=mysql_fetch_array($result))
	{
		$show_all_artist_names=$row['nick'];
	  	echo "<option>$show_all_artist_names</option>";
	}
	?>
	</select>
	<input type="submit" value="Select">
	</form>
	<form enctype="multipart/form-data" action="#" method="post">
	<?php
	if (isset($_POST['getartist']))
	{ 
		$getartist=$_POST['getartist'];
		?>

		<div class="content">
			Nick
		</div>
		
		<div class="content">
			<input type="text" size="20" name="edit_artist_nick" value="<?=$show_artist_nick?>" />
		</div>
		
		<div class="content">
			Acronym
		</div>
		
		<div class="content">
			<input type="text" size="20" name="edit_artist_acronym" value="<?=$show_artist_acronym?>" />
		</div>
		
		<div class="content">
			Webpage
		</div>
		
		<div class="content">
			<input type="text" size="20" name="edit_artist_www" value="<?=$show_artist_www?>" />
		</div>
		
		<div class="content">
			Crew
		</div>

		<div class="content">
			<?php
			$ask="select crew from member_of where nick='$getartist'";
			$result=mysql_query($ask,$dbh);
			while ($row=mysql_fetch_array($result))
			{
				$artist_crew=$row[0];
				?>
				<select name="old_artist_crews[]"> 
					<option selected="selected"><?=$artist_crew?></option>
					<option value="Delete">Remove Crew</option>
					<?php
					$ask_crews="select name from crews";
					$result_crews=mysql_query($ask_crews,$dbh);
					while ($row_crews=mysql_fetch_array($result_crews))
					{
						$crews=$row_crews[0];
						echo "<option>$crews</option>";
					}
					echo "</select>";
			}
			?>
			</div>

		<div class="content">
			<span id="new_artist_crew_field"></span> <span onclick="add_artist_crew_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Crew!</button></span>
			<input type="hidden" name="total_artist_crews" id="total_artist_crews" value="0">
		</div>
		
		<div class="content">
			Country:
		</div>
		
		<div class="content">
			<select name="change_artist_country">
				<?php
				if (!empty($show_artist_country))
				{
					echo "<option selected value=\"$symbol\">$show_artist_country</option>\n";
				}
				else
				{
					echo "<option selected value=\"$symbol\">Unknown</option>\n";					
				}
				foreach($country_list as $symbol => $country)
				{
					echo "<option value=\"$symbol\">$country</option>\n";
				}
				?>
			</select>

		<div class="content">
			Status:
		</div>

		<div class="content">	
			<select name="edit_artist_status">
			 	<option selected="selected"><?=$show_artist_status?></option>
			 	<option>Yes</option>
			 	<option>No</option>
			</select>
		</div>

		<div class="content">
			<input type="hidden" name="getartist" value="<?=$getartist?>" />	
			<input type="submit" name="delete_artist" value="Delete">
			<input type="hidden" name="getartist" value="<?=$getartist?>" />	
			<input type="submit" name="do_edit_artist" value="Change">
		</div>
		<?php
		} 
		?>
	</form>
<?php
//--------------------------------------------------------------------------------
// EDIT USER FIELD
//--------------------------------------------------------------------------------

	if(isset($_POST['getuser']) && $rank=="Admin")
	{
		$getuser=$_POST['getuser'];
		$getuser=cleanInsert($getuser);
		
		$ask="select * from users where nick='$getuser'";
		$result=mysql_query($ask);
		while ($row=mysql_fetch_array($result))
		{
			$show_user_nick=$row['nick'];
			$show_user_www=$row['www'];
			$show_user_status=$row['active'];
			$show_user_crew=$row['crew'];
			$show_user_bbs=$row['bbs'];
			$show_user_country=$row['country'];
			$show_user_acronym=$row['acronym'];
			$show_user_rank=$row['rank'];
		}
	}
	?>
	<form enctype="multipart/form-data" action="#" method="post">
	<div class="headline">
		Edit User				
	</div>
	<div class="content_with_blenk">&nbsp;</div>

	<div class="content">
			<select name="getuser">
			<?php
				if (isset($show_user_nick))
				{
				  	echo "<option selected value=\"$show_all_user_names\">$show_user_nick</option>";
				}
				$ask="SELECT nick FROM users";
				$result=mysql_query($ask,$dbh);
				while ($row=mysql_fetch_array($result))
				{
					$show_all_user_names=$row['nick'];
				  	echo "<option>$show_all_user_names</option>";
				}
				?>
			</select>
			<input type="submit" value="Select">
	</div>
	</form>
	<?php
	if (isset($_POST['getuser']))
	{
		$getuser=$_POST['getuser'];
		?>
		<form enctype="multipart/form-data" action="admin.php" method="post">
		<?php
		$ask="select * from users where nick='$getuser'";
		$result=mysql_query($ask);
	
		while ($row=mysql_fetch_array($result))
		{
			$show_user_nick=$row['nick'];
			$show_user_crew=$row['crew'];
			$show_user_byear=$row['byear'];
			$show_user_bmonth=$row['bmonth'];
			$show_user_bday=$row['bday'];
			$show_user_country=$row['country'];
			$show_user_avatar=$row['avatar'];
			$show_user_mail=$row['mail'];
			$show_user_webpage=$row['webpage'];		
			$show_user_sigdata=$row['sigdata'];
			$show_user_rank=$row['rank'];
			$user_signature=$row['signature'];
			?>
		<div class="content">
			Nick:
		</div>

		<div class="content">
			<input type="text" name="changeusernick" value="<?=$show_user_nick?>" />
		</div>

		<div class="content">
			Crew:
		</div>

		<div class="content">
			<input type="text" name="changeusercrew" value="<?=$show_user_crew?>" />
		</div>

		<div class="content">
			Rank:
		</div>

		<div class="content">
			<select name="edit_user_rank">
				<option selected="selected"><?=$show_user_rank?></option>
				<option>User</option>
				<option>Elite</option>
		  	  	<option>Admin</option>
			</select>
		</div>

		<div class="content">	
			Birth:
			<select name="changeuserbyear"> 
				<option><?=$show_user_byear?></option>";
				<?php
				$countyear=1900;
				$maxyear=date("Y")-5;
				while($countyear<$maxyear)
				{
				  echo "<option>$countyear</option>";
				  $countyear++;
				}
				?>
				</select>
		</div>

		<div class="content">
			<select name="changeuserbmonth">
				<?php
				echo "<option>$show_user_bmonth</option>";
				$countmonth=1;
				$maxmonth=12;
				while($countmonth<=$maxmonth)
				{
				  echo "<option>$countmonth</option>";
				  $countmonth++;
				}
				?>
			</select>

			<select name=\"changeuserbday\">
				<?php
				echo "<option>$show_user_bday</option>";
				$countday=1;
				$maxday=31;
				while($countday<=$maxday)
				{
				  echo "<option>$countday</option>";
				  $countday++;
				}
				?>
			</select>

		<div class="content">	
			Country:
		</div>
		
		<div class="content">
			<select name="changeusercountry">
					<?php
					if (!empty($show_user_country))
					{
						echo "<option selected value=\"$symbol\">$show_user_country</option>\n";
					}
					else
					{
						echo "<option selected value=\"$symbol\">Unknown</option>\n";					
					}
					foreach($country_list as $symbol => $country)
					{
						echo "<option value=\"$symbol\">$country</option>\n";
					}
					?>
				</select>
		</div>

		<div class="content">
			MSN/ICQ:
		</div>

		<div class="content">
			<input type="text" name="changeusermessenger" value="<?=$show_user_messenger?>">
		</div>

		<div class="content">
			Mail:
		</div>

		<div class="content">		
			<input type="text" name="changeusermail" value="<?=$show_user_mail?>" />
		</div>

		<div class="content">	
			<input type="hidden" name="getuser" value="<?=$getuser?>">
			<input type="submit" name="delete_user" value="Delete">
			<input type="submit" size="5" value="Save">
		</div>
	</form>
			<?php
			} 
			?>
	<form name="signatureeditor" action="admin.php" method="post">
	<br>
	<div class="headline">
		Edit <?=$getuser?>'s signature.				
	</div>
	<div class="content_with_blenk">&nbsp;</div>

	<div class="content">
			<textarea name="signature" wrap="physical" cols="81" rows="13" onKeyDown="textCounter(this.form.signature,this.form.remLen,960);" onKeyUp="textCounter(this.form.signature,this.form.remLen,960);"><?=$show_user_sigdata?></textarea>
	</div>

			<input readonly type="text" name="remLen" size="3" maxlength="3" value="960"> characters left</font>Font

	<div class="content">
		<select name="font">
			<option value="topaz">Topaz</option>
			<option value="microknight">MicroKnight</option>
			<option value="mosoul" selected="selected">mO'sOul</option>
			<option value="pot-noodle">P0T-NOoDLE</option>
		</select>

		Color
		<select name="setcolor">
			<option class="darkblue" value="0,0,170">Dark Blue</option>
			<option class="darkgreen" value="0,170,0">Dark Green</option>
			<option class="darkcyan" value="0,170,170">Dark Cyan</option>
			<option class="darkred" value="170,0,0">Dark Red</option>
			<option class="magenta" value="170,0,170">Magenta</option>
			<option class="brown" value="170,85,0">Brown</option>
			<option class="darkgrey" value="85,85,85">Dark Grey</option>
			<option class="grey" value="170,170,170">Grey</option>
			<option class="blue" value="85,85,255">Blue</option>
			<option class="green" value="85,255,85">Green</option>
			<option class="cyan" value="85,255,85">Cyan</option>
			<option class="red" value="255,85,85">Red</option>
			<option class="magenta" value="255,85,255">Pink</option>
			<option class="yellow" value="255,255,85">Yellow</option>
			<option class="white" value="255,255,255">White</option>
		</select>
		<input type="hidden" name="user_signature" value="<?=$user_signature?>"><input type="submit" value="Submit">
	</div>
		<?php
		} 
		?>
		</form>
		<?php

//--------------------------------------------------------------------------------
// EDIT SITELOGO FIELD
//--------------------------------------------------------------------------------

	if(isset($_POST['getsitelogo']) && $rank=="Admin")
	{
		$getsitelogo=$_POST['getsitelogo'];
		$getsitelogo=cleanInsert($getsitelogo);

		$ask="select * from logos where filename=\"$getsitelogo\"";
		$result=mysql_query($ask);
		while ($row=mysql_fetch_array($result))
		{
			$filename=$row['filename'];
			$logo_image="<img class=\"centered\" border=\"0\" src=logos/$filename>";
		}
	}

	?>
	<form enctype="multipart/form-data" action="#" method="post">
		<div class="headline">
			Edit Site Logos			
		</div>
	
		<div class="content_with_blenk">&nbsp;</div>

		<div class="content">
			<select name="getsitelogo">
				<?php
				if (isset($_POST['getsitelogo']))
				{
					echo "<option selected=\"selected\">$getsitelogo</option>";
				}
			
				$ask="select filename from logos";
				$result=mysql_query($ask,$dbh);
				while ($row=mysql_fetch_array($result))
				{
					$show_all_site_logos=$row['filename'];
					echo "<option>$show_all_site_logos</option>";
				}
				?>
		</select>
		<input type="submit" value="Select">
		</div>
	</form>
	<?php

	if (isset($_POST['edit_sitelogo']))
	{
		$editsitelogo=$_POST['getsitelogo'];
		$ask="select * from logos where filename=\"$editsitelogo\"";
		$result=mysql_query($ask);
		while ($row=mysql_fetch_array($result))
		{
			$filename=$row['filename'];
			$author=$row['author'];
			$ascii=$row['ascii'];
			$base64=$row['base64'];
			$ascii=fixOutputEdit($ascii);
		}
		?>
		<form enctype="multipart/form-data" action="#" method="post">

			<div class="content">
					<textarea name="editedsitelogo" wrap="physical" cols="80" rows="8"><?=$ascii?></textarea>
			</div>

			<div class="content">
				<select name="font">
					<option value="topaz">Topaz</option>
					<option value="microknight">MicroKnight</option>
					<option value="mosoul" selected="selected">mO'sOul</option>
					<option value="pot-noodle">P0T-NOoDLE</option>
				</select>

				Color
				<select name="set_edited_logo_color">
					<option class="darkblue" value="0,0,170">Dark Blue</option>
					<option class="darkgreen" value="0,170,0">Dark Green</option>
					<option class="darkcyan" value="0,170,170">Dark Cyan</option>
					<option class="darkred" value="170,0,0">Dark Red</option>
					<option class="magenta" value="170,0,170">Magenta</option>
					<option class="brown" value="170,85,0">Brown</option>
					<option class="darkgrey" value="85,85,85">Dark Grey</option>
					<option class="grey" value="170,170,170">Grey</option>
					<option class="blue" value="85,85,255">Blue</option>
					<option class="green" value="85,255,85">Green</option>
					<option class="cyan" value="85,255,85">Cyan</option>
					<option class="red" value="255,85,85">Red</option>
					<option class="magenta" value="255,85,255">Pink</option>
					<option class="yellow" value="255,255,85">Yellow</option>
					<option class="white" value="255,255,255">White</option>
				</select>
				<input type="hidden" name="getsitelogo" value="<?=$editsitelogo?>">
				<input type="submit" value="Submit">
			</div>
		</form>
		<?php
	} 

	if (isset($_POST['getsitelogo']) && (!isset($_POST['edit_sitelogo'])))
	{
		?>
		<form enctype="multipart/form-data" action="#" method="post">
			<div class="content">
				<br>
				<?=$logo_image?>
				<br><br>
			</div>

			<div class="content">
				<input type="hidden" name="getsitelogo" value="<?=$_POST['getsitelogo']?>">
				<input type="submit" name="edit_sitelogo" value="Edit">
				<input type="submit" name="delete_sitelogo" value="Delete">
			</div>
		</form>
		<?php
	} 
	?>
	
<!-- -------------------------------------------------------------------------------- -->
<!-- SUBMIT BBS FIELD                                                               -->
<!-- -------------------------------------------------------------------------------- -->

	<?php
	if(isset($_POST['getbbs']) && $rank=="Admin")
	{
		$getbbs=$_POST['getbbs'];
		$ask="select * from bbses where name='$getbbs'";
		$result=mysql_query($ask);
		while ($row=mysql_fetch_array($result))
		{
			$show_bbs_name=$row['name'];
			$show_bbs_sysop=$row['sysop'];
			$show_bbs_address=$row['address'];
			$show_bbs_number=$row['number'];
		}
	}

	?>
	
	<div class="headline">
		Edit BBS			
	</div>
	
	<div class="content_with_blenk">&nbsp;</div>

	<form enctype="multipart/form-data" action="admin.php" method="post">
	<div class="content">
		<select name="getbbs">
				<?php
				if (isset($_POST['getbbs']))
				{
				  	echo "<option selected=\"selected\">$show_bbs_name</option>";
				}
				$ask="SELECT name FROM bbses ORDER BY name";
				$result=mysql_query($ask,$dbh);
				while ($row=mysql_fetch_array($result))
				{
					$show_all_bbses=$row['name'];
				  	echo "<option>$show_all_bbses</option>";
				}
			?>
			</select>
			<input type="submit" value="Select">
	</div>
	</form>

	<?php
	if (isset($_POST['getbbs']))
	{
		$getbbs=$_POST['getbbs'];
		?>
		<form enctype="multipart/form-data" action="admin.php" method="post">

		<div class="content">
			Name
		</div>
		
		<div class="content">			
			<input type="text" size="24" name="edit_bbs_name" value="<?=$show_bbs_name?>" />
		</div>

		<div class="content">
			Sysop
		</div>
		
		<div class="content">
			<input type="text" size="24" name="edit_bbs_sysop" value="<?=$show_bbs_sysop?>" />
		<div>

		<div class="content">
			Address
		</div>
		
		<div class="content">
			<input type="text" size="24" name="edit_bbs_address" value="<?=$show_bbs_address?>" />
		</div>

		<div class="content">
			Phone Number
		</div>

		<div class="content">
			<input type="text" size="24" name="edit_bbs_number" value="<?=$show_bbs_number?>" />
		</div>

		<div class="content">
			<input type="SUBMIT" name="do_edit_bbs" value="Submit">
			<input type="hidden" name="getbbs" value="<?=$getbbs?>">
			<input type="submit" name="delete_bbs" value="Delete">
		</div>
		</form>
		<?php
		} 
		?>

	<form enctype="multipart/form-data" action="admin.php" method="post">

	<div class="headline">
		Forum Settings
	</div>
	
	<div class="content_with_blenk">&nbsp;</div>

		<?php
		if (!isset($_POST['edit_forum']))
		{
			?>
			<input type="submit" name='edit_forum' value="Forum Options">
			<?php
		}
		?>
		</form>
		<?php

		if (isset($_POST['edit_forum']))
		{
			?>
			<form enctype="multipart/form-data" action="admin.php" method="post">
			<?php
			$ask="SELECT * FROM forum_forum ORDER BY forum_name ASC, public ASC";
			$result=mysql_query($ask,$dbh);
			while ($row=mysql_fetch_array($result))
			{
				$forum_name=$row['forum_name'];
				$forum_id=$row['forum_id'];
				$public=$row['public'];

				?>
				<div class="content">
					<input type="text" size="32" name="edit_forum_name" value="<?=$forum_name?>">
					<select name="forum_public">
					<option selected="selected"><?=$public?></option>
					<?php
					if ($public != "Public")
					{
						?>
						<option>Public</option>
						<?php
					}
					if ($public != "Closed") 
					{
						?>
						<option>Closed</option>
						<?php
					}
					?>
				</select>
				</div>
				<?php

				$ask_members="SELECT nick FROM forum_access where forum_id=$forum_id ORDER BY nick ASC";
				$result_members=mysql_query($ask_members,$dbh);
				while ($row_members=mysql_fetch_array($result_members))
				{
					$forum_member=$row_members['nick'];				
					?>
					<div class="content">
						<?=$forum_member?>
					</div>
					<?php
					}
				if ($public != "Public") 
				{
					?>
					<div class="content">
						<form enctype="multipart/form-data" action="admin.php" method="post">
						<select name="new_forum_member">
						<?php
						echo "<option selected='selected'>None</option>";
						$ask_add_member="SELECT nick FROM users";
						$result_add_member=mysql_query($ask_add_member,$dbh);
						while ($row_add_member=mysql_fetch_array($result_add_member))
						{
							$forum_member=$row_add_member['nick'];
							echo "<option>$forum_member</option>";
						}
						?>
						</select>
						<input type="hidden" name="do_edit_forum" value="do_edit_forum"><input type="hidden" name="new_forum_id" value="<?=$forum_id?>"><input type="hidden" name="new_forum_name" value="<?=$forum_name?>"><input type="submit" name="do_add_new_forum_member" value="Add"> <input type="submit" name="do_remove_forum_member" value="Remove">
						<br><br>
					</div>
					</form>
					<?php
				}

			}
			?>
			<form enctype="multipart/form-data" action="admin.php" method="post">
			<div class="content">
			<br>
			Add New Forum
			<input type="text" size="24" name="new_forum_name">
				<select name="new_forum_public">
		  	<option selected="selected">Public</option>
			<option>Closed</option>
			</select>
			<input type="hidden" name="do_edit_forum" value="do_edit_forum"><input type="SUBMIT" name="do_add_new_forum" value="Add">
			<br><br>
			</div>
			</form>
			<?php
			}
			?>

			<div class="headline">
				Broken Collys
			</div>
	
			<div class="content_with_blenk">&nbsp;</div>

			<form enctype="multipart/form-data" action="admin.php" method="post">
			<?php
			$ask="SELECT * FROM collys WHERE broken='1' ORDER BY filename ASC";
			$result=mysql_query($ask,$dbh);
			while ($row=mysql_fetch_array($result))
			{
				$filename=$row['filename'];
				$encoded_filename=base64_encode($filename);
				$broken_comment=$row['broken_comment'];

				?>
				<form enctype="multipart/form-data" action="admin.php" method="post">		
					<div style="float: left; height: 25px; width: 635px; text-align: left; padding-left: 4px; padding-bottom: 2px; padding-top: 2px;">
						<a href="info_release.php?filename=<?=$encoded_filename?>"><?=$filename?></a>
					</div>

					<div style="float: left; height: 25px; width: 50px; text-align: left; padding-left: 4px; padding-bottom: 2px; padding-top: 2px;">
						<input type="hidden" name="filename" value="<?=$filename?>">
						<input type="submit" name="colly_fixed" value="Fixed">
					</div>
				
					<div class="content">
						Comment: <?=$broken_comment?>
						<br><br>
					</div>
				</form>
				<?php
			}
		}
		else
		{
			?>
			<div class="headline">
				Hack Attempt!
			</div>
			<div class="content">
				<br>Hack attempt detected.<br>
				Your IP has been logged and has been forwarded to the Swedish police.<br>
				Tough luck sucka!<br><br>
			</div>
			<?php
		}
		?>
	</div>
</div>
</body>
</html>
