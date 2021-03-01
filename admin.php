<?php
require_once "session.php";
$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
include "header.php";

?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
		<?php

//---------------------------------------------------------------------------------------------------------------
// SET COLLY TO FIXED
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['colly_fixed']) && is_admin())
		{
			$fixed_colly=cleanInsert($_POST['filename']);
			$fixed_colly=stripslashes($fixed_colly);
			if(!empty($fixed_colly))
			{
				$ask="update collys set broken=0 where filename=:fixed_colly";
				doQuery($ask,[':fixed_colly' => $fixed_colly]);
			}
			?>
			<meta http-equiv="Refresh" content="0; url=admin.php">
			<?php
		}	



//---------------------------------------------------------------------------------------------------------------
// DELETE USER FROM DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['delete_user']) && is_admin())
		{
			$delete_user=$_POST['getuser'];
			$delete_user=cleanInsert($delete_user);

			if(!empty($delete_user))
			{
				$ask="delete from users where nick=:delete_user";
				doQuery($ask, [ ':delete_user' => $delete_user ]);
			}
			?><meta http-equiv="Refresh" content="0; url=admin.php"><?php
		}	


//---------------------------------------------------------------------------------------------------------------
// DELETE CREW FROM DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['do_delete_crew']) && is_admin())
		{
			$delete_crew=$_POST['getcrew'];
			$delete_crew=cleanInsert($delete_crew);

			if(!empty($delete_crew))
			{
				$ask="delete from crews where name=:delete_crew";
				doQuery($ask,[ ':delete_crew' => $delete_crew]);

				$ask="delete from bbs_of where crew=:delete_crew";
				doQuery($ask,[ ':delete_crew' => $delete_crew]);
			}
			?><meta http-equiv="Refresh" content="0; url=admin.php"><?php
		}	

//---------------------------------------------------------------------------------------------------------------
// DELETE SITELOGO FROM DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['delete_sitelogo']) && is_admin())
		{
			$delete_sitelogo=$_POST['getsitelogo'];

			if(!empty($delete_sitelogo))
			{
				$ask="delete from logos where logo_id=:delete_sitelogo";
				doQuery($ask, [':delete_sitelogo' => $delete_sitelogo]);
			}
			?><meta http-equiv="Refresh" content="0; url=admin.php"><?php
		}	

//---------------------------------------------------------------------------------------------------------------
// DELETE COLLY FROM DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['do_delete_colly']) && is_admin())
		{
			$delete_colly=$_POST['filename'];
			$delete_colly=cleanInsert($delete_colly);

		$ask="select uploader from collys where filename='$delete_colly'"; // fetch uploader of deleted colly
		$result=fetchAll($ask);
		foreach ($result as $row)
		{
			$uploader=$row->uploader;
		}

		$ask="SELECT * FROM image_of WHERE filename LIKE '$delete_colly%'"; // fetch uploader of deleted colly
		$result=fetchAll($ask);
		foreach ($result as $row)
		{
			$collyimage=$row->images;
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
			doQuery("delete from collys    WHERE filename    = :delete_colly", [ ":delete_colly" =>  $delete_colly   ]); 
			doQuery("delete from comments  WHERE filename    = :delete_colly", [ ":delete_colly" =>  $delete_colly   ]); 
			doQuery("DELETE FROM image_of  WHERE filename LIKE :delete_colly", [ ":delete_colly" => "$delete_colly%" ]); 
			doQuery("DELETE FROM crew_of   WHERE filename LIKE :delete_colly", [ ":delete_colly" => "$delete_colly%" ]); 
			doQuery("DELETE FROM author_of WHERE filename LIKE :delete_colly", [ ":delete_colly" => "$delete_colly%" ]); 
		}

		$row = fetchOne("select sum(filesize) AS sum_filesize from collys where uploader=':nick'", [":nick" => $nick]);
		if ($row)
		{
			$collysize=$row->sum_filesize;
		}

		$row = fetchOne("select sum(filesize) AS sum_filesize from mags where uploader=':nick'", [":nick" => $nick]);
		if ($row)
		{
			$magsize=$row->sum_filesize;
		}

		$row = fetchOne("select sum(filesize) AS sum_filesize from apps where uploader=':nick'", [":nick" => $nick]);
		if ($row)
		{
			$appsize=$row->sum_filesize;
		}
		$pumped = $collysize + $appsize + $magsize;
		doQuery("update users set uploaded = :pumped where nick = :nick", [":nick" => $nick, ":pumped" => $pumped]);

//---------------------------------------------------------------------------------------------------------------
// RECALCULATE RATINGS FOR ARTISTS
//---------------------------------------------------------------------------------------------------------------

		$ask="select nick from author_of";
		$result=fetchAll($ask);
		foreach ($result as $row)
		{
			$artist=$row->nick;

			$ask_avg="select avg(rating) AS avg_rating from comments where artist= :artist and rating > 0";
			$result_avg=fetchAll($ask_avg, [':artist' => $artist]);
			foreach ($result_avg as $row_avg)
			{
				$avg_artist_rating=$row_avg->avg_rating;
			}
			
			$ask_rate_amount="SELECT COUNT(rating) AS count_rating from comments where artist=:artist and rating>0";
			$result_rate_amount=fetchAll($ask_rate_amount,[ ':artist' => $artist ]);
			foreach ($result_rate_amount as $row_rate_amount)
			{
				$rate_amount=$row_rate_amount->count_rating;
			}

			if ($rate_amount >2)
			{
				$ask_update="update artists set rating=:avg_artist_rating where nick=:artist";
				doQuery($ask_update, [ ':artist' => $artist, ':avg_artist_rating' => $avg_artist_rating]);	
			}
		}

//---------------------------------------------------------------------------------------------------------------
// RECALCULATE RATINGS FOR CREWS
//---------------------------------------------------------------------------------------------------------------


		$ask="select name from crews";
		$result=fetchAll($ask);
		foreach ($result as $row)
		{
			$crew=$row->name;

			# FIXME: Probably fetchOne ?
			$ask_rating="select avg(rating) AS avg_rating from comments where crew=:crew and rating>0";
			$result_rating=fetchAll($ask_rating, [':crew' => $crew ]);
			foreach ($result_rating as $avg_crew_rating)
			{
				$avg_crew_rating=$row_rating->avg_rating;
			}
			if(!isset($avg_crew_rating))
			{
				$avg_crew_rating=0;
			}	
			$ask_update="update crews set rating=:avg_crew_rating where name=:crew ";
			doQuery($ask_update,[':avg_crew_rating' => $avg_crew_rating, ':crew' => $crew]);	
		}
		?>
		<meta http-equiv="Refresh" content="0; url=admin.php">
		<?php
		exit;
	}	

//---------------------------------------------------------------------------------------------------------------
// DELETE BBS FROM DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['delete_bbs']) && is_admin())
	{
		$delete_bbs=$_POST['getbbs'];
		$delete_bbs=cleanInsert($delete_bbs);

		if(!empty($delete_bbs))
		{
			$ask="delete from bbses where name=:delete_bbs";
			doQuery($ask,[ ':delete_bbs' => $delete_bbs ]);
		}
		?><meta http-equiv="Refresh" content="0; url=admin.php"><?php
	}	

//---------------------------------------------------------------------------------------------------------------
// DELETE ARTIST FROM DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['delete_artist']) && is_admin())
	{
		$delete_artist=$_POST['getartist'];
		$delete_artist=cleanInsert($delete_artist);
		if(!empty($delete_artist))
		{
			$ask="delete from artists where nick=:delete_artist";
			doQuery($ask, [':delete_artist' => $delete_artist]);

			$ask="delete from member_of where nick=:delete_artist";
			doQuery($ask, [':delete_artist' => $delete_artist]);
		}
		?><meta http-equiv="Refresh" content="0; url=admin.php"><?php
	}	

//---------------------------------------------------------------------------------------------------------------
// WRITE COLLY INFO TO DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['do_edit_colly']) && is_admin())
	{
		if(isset($_POST['edit_colly_name']) && is_admin())
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);

			$edit_colly_name=$_POST['edit_colly_name'];
			$edit_colly_name = cleanInsert($edit_colly_name); 
			$ask="update collys set name=:edit_colly_name where filename=:filename";	
			doQuery($ask, [':edit_colly_name' => $edit_colly_name, ':filename' => $filename]);
		}

		if(isset($_POST['old_colly_authors']) || (isset($_POST['colly_author']) && is_admin()))
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);

			$ask="delete from author_of where filename=:filename";
			doQuery($ask, [':filename' => $filename]);

			if (isset($_POST['old_colly_authors']))
			{			
				foreach($_POST['old_colly_authors'] as $colly_author)
				{
					$colly_author=cleanInsert($colly_author);
					$ask="insert into author_of values (:colly_author,:filename)";
					doQuery($ask, [':colly_author' => $colly_author, ':filename' => $filename]);
				}
			}

			if (isset($_POST['colly_author']))
			{
				foreach($_POST['colly_author'] as $new_colly_author)
				{
					$new_colly_author=cleanInsert($new_colly_author);
					$ask="insert into author_of values (:new_colly_author,:filename)";
					doQuery($ask,[':new_colly_author' => $new_colly_author, ':filename' => $filename]);
				}
			}
			$ask="delete from author_of where filename=:filename and nick='Delete'";
			doQuery($ask,[':filename' => $filename ]);
		}
		if(isset($_POST['old_colly_crews']) || (isset($_POST['colly_crew']) && is_admin()))
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);

			$ask="delete from crew_of where filename=:filename";
			doQuery($ask,[':filename' => $filename]);

			if (isset($_POST[old_colly_crews]))
			{			
				foreach($_POST[old_colly_crews] as $colly_crew)
				{
					$ask="insert into crew_of values (:colly_crew,:filename)";
					doQuery($ask,[':colly_crew' => $colly_crew, ':filename' => $filename]);
				}
			}

			if (isset($_POST[colly_crew]))
			{
				foreach($_POST[colly_crew] as $new_colly_crew)
				{
					$ask="insert into crew_of values (:new_colly_crew, :filename)";
					doQuery($ask, [':new_colly_crew' => $new_colly_crew, ':filename' => $filename]);
				}
			}
			
			$ask="delete from crew_of where filename=:filename and crew='Delete'";
			doQuery($ask,[':filename' => $filename]);
		}
		if(isset($_POST['edit_colly_year']) && is_admin())
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);
			$edit_colly_year=$_POST['edit_colly_year'];
			$edit_colly_year= cleanInsert($edit_colly_year); 
			$ask="update collys set year=:edit_colly_year where filename=:filename";	
			doQuery($ask,[':edit_colly_year' => $edit_colly_year, ':filename' => $filename]);	
		}
		if(isset($_POST['edit_colly_type']) && is_admin())
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);
			
			$edit_colly_type=$_POST['edit_colly_type'];
			$edit_colly_type=cleanInsert($edit_colly_type); 

			$ask="update collys set type=:edit_colly_type where filename=:filename";	
			doQuery($ask,[':edit_colly_type' => $edit_colly_type, ':filename' => $filename]);	
		}
		if(isset($_POST['edit_colly_month']) && is_admin())
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);
			
			$edit_colly_month=$_POST['edit_colly_month'];
			$edit_colly_month=cleanInsert($edit_colly_month);
			
			$ask="update collys set month='$edit_colly_month' where filename='$filename'";	
			doQuery($ask,[':edit_colly_month' => $edit_colly_month, ':filename' => $filename]);	
		}
		if(isset($_POST['edit_colly_day']) && is_admin())
		{
			$filename=$_POST['filename'];
			$filename=cleanInsert($filename);

			$edit_colly_day=$_POST['edit_colly_day'];
			$edit_colly_day=cleanInsert($edit_colly_day); 
			
			$ask="update collys set day=:edit_colly_day where filename=:filename";	
			doQuery($ask,[':edit_colly_day' => $edit_colly_day, ':filename' => $filename]);	
		}

//---------------------------------------------------------------------------------------------------------------
// RECALCULATE RATINGS
//---------------------------------------------------------------------------------------------------------------

		$ask="select nick from author_of";
		$result=fetchAll($ask);
		foreach ($result as $row)
		{
			$artist=$row->nick;

			$ask_rating="select avg(rating) from comments where artist=:artist and rating>0";
			$result_rating=fetchAll($ask_rating,[':artist' => $artist]);
			foreach ($result_rating as $row_rating)
			{
				$avg_artist_rating=$row_rating[0];
			}

			if(!isset($avg_artist_rating))
			{
				$avg_artist_rating=0;
			}	

			$ask_update="update artists set rating=:avg_artist_rating where nick=:artist";
			doQuery($ask,[':avg_artist_rating' => $avg_artist_rating, ':artist' => $artist]);	
		}
		$ask="select crew from crew_of";
		$result=fetchAll($ask);
		foreach ($result as $row)
		{
			$crew=$row->crew;

			$ask_rating="select avg(rating) from comments where crew=:crew and rating>0";
			$result_rating=fetchAll($ask_rating,[ ':crew' => $crew ]);
			foreach ($result_rating as $row)
			{
				$avg_crew_rating=$row_rating[0];
			}
			if(!isset($avg_crew_rating))
			{
				$avg_crew_rating=0;
			}	
			$ask_update="update crews set rating=:avg_crew_rating where name=:crew";
			doQuery($ask_update,[':avg_crew_rating' => $avg_crew_rating, ':crew' => $crew]);	
		}
		?>
		<meta http-equiv="Refresh" content="0; url=admin.php">
		<?php
		exit;
	}	


//---------------------------------------------------------------------------------------------------------------
// WRITE CREW INFO TO DB
//---------------------------------------------------------------------------------------------------------------

	if(isset($_POST['do_change_crew']) && is_admin())
	{
		if(isset($_POST['edit_crew_name']) && is_admin())
		{
			$crew=$_POST['getcrew'];
			$crew=cleanInsert($crew);

			$edit_crew_name=$_POST['edit_crew_name'];
			$edit_crew_name=cleanInsert($edit_crew_name); 

			doQuery("update crews     set name=:edit_crew_name where name=:crew", [':edit_crew_name' => $edit_crew_name, ':crew' => $crew]);
			doQuery("update crew_of   set crew=:edit_crew_name where crew=:crew", [':edit_crew_name' => $edit_crew_name, ':crew' => $crew]);	
			doQuery("update bbs_of    set crew=:edit_crew_name where crew=:crew", [':edit_crew_name' => $edit_crew_name, ':crew' => $crew]);	
			doQuery("update member_of set crew=:edit_crew_name where crew=:crew", [':edit_crew_name' => $edit_crew_name, ':crew' => $crew]);	
		}
		if(isset($_POST['edit_crew_www']) && is_admin())
		{
			$crew=$_POST['getcrew'];
			$crew=cleanInsert($crew);

			$edit_crew_www=$_POST['edit_crew_www'];
			$edit_crew_www=cleanInsert($edit_crew_www); 

			doQuery("update crews set www=:edit_crew_www where name=:edit_crew_name", [':edit_creq_www' => $edit_crew_www, ':edit_crew_name' => $edit_crew_name]);	
		}

		if(isset($_POST['add_bbs']) && is_admin())
		{
				foreach($_POST[add_bbs] as $add_bbs) // add new bbses
				{
					doQuery("insert into bbs_of values (:add_bbs,:crew)", [':add_bbs' => $add_bbs, ':crew' => $crew]);
				}
			}

			if(isset($_POST['edit_crew_contact']) && is_admin())
			{
				$crew=$_POST['getcrew'];
				$crew=cleanInsert($crew);

				$edit_crew_contact=$_POST['edit_crew_contact'];
				$edit_crew_contact=cleanInsert($edit_crew_contact); 

				$ask="update crews set contact='$edit_crew_contact' where name='$edit_crew_name'";	
				doQuery($ask, [':edit_crew_contact' => $edit_crew_contact, ':edit_crew_name' => $edit_crew_name]);	
			}
			if(isset($_POST['edit_crew_status']) && is_admin())
			{
				$crew=$_POST['getcrew'];
				$crew=cleanInsert($crew);

				$edit_crew_status=$_POST['edit_crew_status'];
				$edit_crew_status=cleanInsert($edit_crew_status); 

				$ask="update crews set active=:edit_crew_status where name=:edit_crew_name";	
				doQuery($ask, [':edit_crew_status' => $edit_crew_status, ':edit_crew_name' => $edit_crew_name]);	
			}
			if(isset($_POST['edit_crew_acronym']) && is_admin())
			{
				$crew=$_POST['getcrew'];
				$crew=cleanInsert($crew);

				$edit_crew_acronym=$_POST['edit_crew_acronym'];
				$edit_crew_acronym=cleanInsert($edit_crew_acronym); 

				$ask="update crews set acronym=:edit_crew_acronym where name=:edit_crew_name";
				doQuery($ask, [':edit_crew_acronym' => $edit_crew_acronym, ':edit_crew_name' => $edit_crew_name ]);
			}
		}
//---------------------------------------------------------------------------------------------------------------
// WRITE ARTIST INFO TO DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['do_edit_artist']) && is_admin())
		{
			if(isset($_POST['edit_artist_nick']) && is_admin())
			{
				$artist=$_POST['getartist'];
				$artist=cleanInsert($artist);

				$edit_artist_nick=$_POST['edit_artist_nick'];
				$edit_artist_nick = cleanInsert($edit_artist_nick); 

				$ask="update artists   set nick=:edit_artist_nick where nick=:artist";	
				doQuery($ask,[':edit_artist_nick' => $edit_artist_nick, ':artist' => $artist]);	

				$ask="update member_of set nick=:edit_artist_nick' where nick=:artist";	
				doQuery($ask,[':edit_artist_nick' => $edit_artist_nick, ':artist' => $artist]);	

				$ask="update author_of set nick=:edit_artist_nick' where nick=:artist";	
				doQuery($ask,[':edit_artist_nick' => $edit_artist_nick, ':artist' => $artist]);	

			}
			if(isset($_POST['edit_artist_www']) && is_admin())
			{
				$artist=$_POST['getartist'];
				$artist=cleanInsert($artist);

				$edit_artist_www=$_POST['edit_artist_www'];
				$edit_artist_www = cleanInsert($edit_artist_www); 

				$ask="update artists set www=:edit_artist_www where nick=:edit_artist_nick";	
				doQuery($ask,[':edit_artist_www' => $edit_artist_www, ':edit_artist_nick' => $edit_artist_nick]);	
			}
			if(isset($_POST['edit_artist_status']) && is_admin())
			{
				$artist=$_POST['getartist'];
				$artist=cleanInsert($artist);

				$edit_artist_status=$_POST['edit_artist_status'];
				$edit_artist_status = cleanInsert($edit_artist_status); 

				$ask="update artists set active=:edit_artist_status where nick=:edit_artist_nick";	
				doQuery($ask, [':edit_artist_status' => $edit_artist_status, ':edit_artist_nick' => $edit_artist_nick]);	
			}
			if(isset($_POST['old_artist_crews']) || (isset($_POST['artist_crew']) && is_admin()))
			{
				$artist=$_POST['getartist'];
				$artist=cleanInsert($artist);

				$ask="delete from member_of where nick=:edit_artist_nick";
				doQuery($ask, [':edit_artist_nick' => $edit_artist_nick]);

				if (isset($_POST[old_artist_crews]))			
				{
					foreach($_POST[old_artist_crews] as $artist_crew)
					{
						$ask="insert into member_of values (:artist_crew,:edit_artist_nick)";
						doQuery($ask,[':artist_crew' => $artist_crew, ':edit_artist_nick' => $edit_artist_nick]);
					}
				}
				if (isset($_POST[artist_crew]))
				{
					foreach($_POST[artist_crew] as $new_artist_crew)
					{
						$ask="insert into member_of values (:new_artist_crew,:edit_artist_nick)";
						doQuery($ask,[':new_artist_crew' => $new_artist_crew, ':edit_artist_nick' => $edit_artist_nick]);
					}
				}

				$ask="delete from member_of where nick=:edit_artist_nick and crew='Delete'";
				doQuery($ask, [':edit_artist_nick' => $edit_artist_nick]);
			}

			if(isset($_POST['change_artist_country']) && is_admin())
			{
				$artist=cleanInsert($_POST['getartist']);
				$change_artist_country = cleanInsert($_POST['change_artist_country']); 

				if (!empty($change_artist_country))
				{
					$ask="update artists set country=:change_artist_country where nick=:edit_artist_nick";	
					doQuery($ask, [':change_artist_country' => $country_list[$change_artist_country], ':edit_artist_nick' => $edit_artist_nick]);	
				}
			}

			if(isset($_POST['edit_artist_acronym']) && is_admin())
			{
				$artist=$_POST['getartist'];
				$artist=cleanInsert($artist);

				$edit_artist_acronym=$_POST['edit_artist_acronym'];
				$edit_artist_acronym=cleanInsert($edit_artist_acronym); 

				$ask="update artists set acronym=:edit_artist_acronym where nick=:edit_artist_nick";	
				doQuery($ask,['edit_artist_acronym' => $edit_artist_acronym, ':edit_artist_nick' => $edit_artist_nick]);	
			}
		}

//---------------------------------------------------------------------------------------------------------------
// WRITE BBS INFO TO DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['do_edit_bbs']) && is_admin())
		{
			if(isset($_POST['edit_bbs_name']) && is_admin())
			{
				$bbs_name=$_POST['getbbs'];
				$bbs_name=cleanInsert($bbs_name);

				$edit_bbs_name=$_POST['edit_bbs_name'];
				$edit_bbs_name=cleanInsert($edit_bbs_name); 

				$ask="update bbses set name=:edit_bbs_name where name=:bbs_name";	
				doQuery($ask, [':edit_bbs_name' => $edit_bbs_name, ':bbs_name' => $bbs_name]);	

				$ask="update bbs_of set name=:edit_bbs_name where name=:bbs_name";	
				doQuery($ask, [':edit_bbs_name' => $edit_bbs_name, ':bbs_name' => $bbs_name]);	
			}
			if(isset($_POST['edit_bbs_sysop']) && is_admin())
			{
				$bbs_name=$_POST['getbbs'];
				$bbs_name=cleanInsert($bbs_name);

				$edit_bbs_sysop=$_POST['edit_bbs_sysop'];
				$edit_bbs_sysop= cleanInsert($edit_bbs_sysop); 

				$ask="update bbses set sysop=:edit_bbs_sysop where name=:edit_bbs_name";	
				doQuery($ask,[':edit_bbs_sysop' => $edit_bbs_sysop, ':edit_bbs_name' => $edit_bbs_name]);	
			}
			if(isset($_POST['edit_bbs_address']) && is_admin())
			{
				$bbs_name=$_POST['getbbs'];
				$bbs_name=cleanInsert($bbs_name);

				$edit_bbs_address = $_POST['edit_bbs_address'];
				$edit_bbs_address = cleanInsert($edit_bbs_address); 

				$ask="update bbses set address=:edit_bbs_address where name=:edit_bbs_name";	
				doQuery($ask, [':edit_bbs_address' => $edit_bbs_address, ':edit_bbs_name' => $edit_bbs_name]);	
			}
			if(isset($_POST['edit_bbs_number']) && is_admin())
			{
				$bbs_name=$_POST['getbbs'];
				$bbs_name=cleanInsert($bbs_name);

				$edit_bbs_number=$_POST['edit_bbs_number'];
				$edit_bbs_number=cleanInsert($edit_bbs_number); 

				$ask="update bbses set number=:edit_bbs_number where name=:edit_bbs_name";	
				doQuery($ask,[':edit_bbs_number' => $edit_bbs_number, ':edit_bbs_name' => $edit_bbs_name]);	
			}
		}

//---------------------------------------------------------------------------------------------------------------
// WRITE FORUM DATA TO DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['do_edit_forum']) && is_admin())
		{
			if(isset($_POST['do_add_new_forum_member']) && is_admin())
			{
				$new_forum_member=$_POST['new_forum_member'];
				$new_forum_member=cleanInsert($new_forum_member);

				$new_forum_name=$_POST['new_forum_name'];
				$new_forum_name=cleanInsert($new_forum_name);

				$new_forum_id=$_POST['new_forum_id'];
				$new_forum_id=cleanInsert($new_forum_id);

				$ask="insert into forum_access values (:new_forum_member, :new_forum_name, :new_forum_id";	
				doQuery($ask, [':new_forum_member' => $new_forum_member, ':new_forum_name' => $new_forum_name, ':new_forum_id' => $new_forum_id]);	
			}
			
			if(isset($_POST['do_add_new_forum']) && is_admin())
			{
				$new_forum_name=$_POST['new_forum_name'];
				$new_forum_name=cleanInsert($new_forum_name); 

				$new_forum_public=$_POST['new_forum_public'];
				$new_forum_public=cleanInsert($new_forum_public); 

			$ask="select forum_id from forum_forum ORDER BY forum_id DESC LIMIT 1"; // grab latest id
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$new_forum_id=$row->forum_id;
			}
			if(!isset($new_forum_id))
			{
				$new_forum_id=1;
			}
			else
			{
				$new_forum_id=$new_forum_id+1;
			}

			$ask="insert into forum_forum values (:new_forum_id,:new_forum_name,:new_forum_public)";	
			doQuery($ask,[':new_forum_id' => $new_forum_id, ':new_forum_name' => $new_forum_name, ':new_forum_public' => $new_forum_public]);	
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

		$ask="update users set nick=:change_user_nick where nick=:user_nick";
		doQuery($ask, [':change_user_nick' => $change_user_nick, ':user_nick' => $user_nick]);	
	}
	if(isset($_POST['changeusercrew']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);
		
		$changecrew=$_POST['changeusercrew'];
		$changecrew=cleanInsert($changecrew);
		
		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);
		
		$ask="update users set crew=:changecrew where nick=:change_user_nick";
		doQuery($ask,[':changecrew' => $changecrew, ':change_user_nick' => $change_user_nick ]);	
	}
	if(isset($_POST['edit_user_rank']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);

		$edit_user_rank=$_POST['edit_user_rank'];
		$edit_user_rank=cleanInsert($edit_user_rank);

		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);

		$ask="update users set rank=:edit_user_rank where nick=:change_user_nick";
		doQuery($ask, [':edit_user_rank' => $edit_user_rank, ':change_user_nick' => $change_user_nick]);	
	}
	if(isset($_POST['changeuserbyear']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);

		$changebyear=$_POST['changeuserbyear'];
		$changebyear=cleanInsert($changebyear);

		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);

		$ask="update users set byear=:changebyear where nick=:change_user_nick";
		doQuery($ask, [':changebyear' => $changebyear, ':change_user_nick' => $change_user_nick]);	
	}
	if(isset($_POST['changeuserbmonth']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);

		$changebmonth=$_POST['changeuserbmonth'];
		$changebmonth=cleanInsert($changebmonth);

		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);

		$ask="update users set bmonth=:changebmonth where nick=:change_user_nick";
		doQuery($ask, [':changebmonth' => $changebmonth, ':change_user_nick' => $change_user_nick]);	
	}
	if(isset($_POST['changeuserbday']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);

		$changebday=$_POST['changeuserbday'];
		$changebday=cleanInsert($changebday);

		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);

		$ask="update users set bday=:changebday where nick=:change_user_nick";
		doQuery($ask, [':changebday' => $changebday, ':change_user_nick' => $change_user_nick]);	
	}
	if(isset($_POST['changeusercountry']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);
		
		$change_country=$_POST['changeusercountry'];
		$change_country=cleanInsert($change_country);

		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);

		$ask="update users set country=':change_country' where nick=:change_user_nick";
		doQuery($ask,[':change_country' => $country_list[$change_country], ':change_user_nick' => $change_user_nick ]);	
	}
	if(isset($_POST['changeusermessenger']))
	{
		$change_user_nick=$_POST['changeusernick'];
		$change_user_nick=cleanInsert($change_user_nick);

		$changemessenger=$_POST['changeusermessenger'];
		$changemessenger=cleanInsert($changemessenger);

		$user_nick=$_POST['usernick'];
		$user_nick=cleanInsert($user_nick);
		
		$ask="update users set messenger=:changemessenger where nick=:change_user_nick";
		doQuery($ask,[':changemessenger' => $changemessenger, ':change_user_nick' => $change_user_nick]);	
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

		$ask="update users set mail=:mail where nick=:change_user_nick";
		doQuery($ask, [':mail' => $mail, ':change_user_nick' => $change_user_nick ]);	
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

		$ask="update users set signature=:user_signature where nick=:edit_user_nick";
		doQuery($ask, [':user_signature' => $user_signature, ':edit_user_nick' => $edit_user_nick]);

		$sigdata=cleanInsertPost($sigdata);
		$ask="update users set sigdata=:sigdata where nick=:edit_user_nick";
		doQuery($ask, [':sigdata' => $sigdata, ':edit_user_nick' => $edit_user_nick]);

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
		$ask_update="update logos set ascii=:editedsitelogodata where filename=:logo";
		doQuery($ask_update,[':editedsitelogodata' => $editedsitelogodata, ':logo' => $logo]);	

		$ask_update="update logos set base64='1' where filename=:logo";
		doQuery($ask_update,[':logo' => $logo]);	
	}

//--------------------------------------------------------------------------------
// EDIT COLLY FIELD
//--------------------------------------------------------------------------------

    $getcollyname=$_POST['getcollyname'];
	if(isset($_POST['getcollyname']) && (!isset($_POST['do_edit_colly'])))
	{
		error_log($getcollyname);
		$getcollyname=cleanInsert($getcollyname);
		error_log($getcollyname);
		$ask="select * from collys where filename=:getcollyname";
		$result=doQuery($ask, [ ':getcollyname' => $getcollyname]);
		foreach ($result as $row)
		{
			$show_colly_name  = $row->name;
			$show_colly_crew  = $row->crew;
			$show_colly_year  = $row->year;
			$show_colly_month = $row->month;
			$show_colly_day   = $row->day;
			$show_colly_type  = $row->type;
			$show_colly_diz   = $row->file_id;
		}
	}
	?>
	<form enctype="multipart/form-data" action="admin.php" method="post">		
		<div class="wrap">
			<div class="headline">
				Edit ASCII Collection				
			</div>

			<div class="content">
				<select name="getcollyname">
					<?php if (isset($show_colly_name))
					{
						echo "<option>$show_colly_name</option>";
					}
					$ask="SELECT name, filename FROM collys ORDER BY filename";
					$result=fetchAll($ask);
					foreach ($result as $row)
					{
						$show_all_colly_names=$row->name;
						$show_all_colly_filenames=$row->filename;
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
				$result=fetchAll($ask);
				foreach ($result as $row)
				{
					$colly_author=$row->nick;
					echo "<select name=\"old_colly_authors[]\">"; 
					echo "<option selected=\"selected\">$colly_author</option>";
					echo "<option value='Delete'>Remove Author</option>";

					$ask_authors="select nick from artists";
					$result_authors=fetchAll($ask_authors);
					foreach ($result_authors as $row_authors)
					{
						$authors=$row_authors->nick;
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
				$ask="select crew from crew_of where filename=:getcollyname";
				$result=fetchAll($ask, [':getcollyname' => $getcollyname]);
				foreach ($result as $row)
				{
					$colly_crew=$row->crew;
					echo "<select name=\"old_colly_crews[]\">"; 
					echo "<option selected=\"selected\">$colly_crew</option>";
					echo "<option value='Delete'>Remove Crew</option>";
					$ask_crews="select name from crews";
					$result_crews=fetchAll($ask_crews);
					foreach ($result_crews as $row_crews)
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

if(isset($_POST['getcrew']) && is_admin())
{
	$getcrew=$_POST['getcrew'];
	$getcrew=cleanInsert($getcrew);
	$ask="select * from crews where name=:getcrew";
	$result=fetchAll($ask, [ ':getcrew' => $getcrew ]);
	foreach ($result as $row)
	{
		$show_crew_name    = $row->name;
		$show_crew_www     = $row->www;
		$show_crew_bbs     = $row->bbs;
		$show_crew_contact = $row->contact;
		$show_crew_status  = $row->active;
		$show_crew_acronym = $row->acronym;
	}
}
?>
<form enctype="multipart/form-data" action="admin.php" method="post">
	<div class="headline">
		Edit Crew				
	</div>
	<div class="content">
		<select name="getcrew">
			<?php
			if (isset($show_crew_name))
			{
				echo "<option selected=\"selected\">$show_crew_name</option>";
			}
			$ask="select name from crews";
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$show_all_crew_names=$row->name;
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

	$ask="select * from crews where name=:getcrew";
	$result=fetchAll($ask, [':getcrew' => $getcrew ]);
	foreach ($result as $row)
	{
		$show_crew_name=$row->name;
		$show_crew_www=$row->www;
		$show_crew_bbs=$row->bbs;
		$show_crew_contact=$row->contact;
		$show_crew_status=$row->active;
		$show_crew_acronym=$row->acronym;
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
			$ask="select name from bbs_of where crew = :getcrew ";
			$result=fetchAll($ask, [ ':getcrew' => $getcrew ]);
			foreach ($result as $row)
			{
				$bbs = $row->name;
				echo "<select name=\"edit_bbs[]\">";
				echo "<option selected=\"selected\">$bbs</option>";

				$ask_bbs="select name from bbses";
				$result_bbs=fetchAll($ask_bbs);
				foreach ($result_bbs as $row_bbs)
				{
					$all_bbses=$row_bbs->name;
					echo "<option>$all_bbses</option>";
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

if(isset($_POST['getartist']) && is_admin())
{
	$getartist=$_POST['getartist'];
	$getartist=cleanInsert($getartist);

	$ask="select * from artists where nick=:getartist";
	$result=fetchAll($ask, [':getartist' => $getartist]);
	foreach ($result as $row)
	{
		$show_artist_nick=$row->nick;
		$show_artist_www=$row->www;
		$show_artist_status=$row->active;
		$show_artist_crew=$row->crew;
		$show_artist_bbs=$row->bbs;
		$show_artist_country=$row->country;
		$show_artist_acronym=$row->acronym;
	}
}
?>
<form enctype="multipart/form-data" action="#" method="post">

	<div class="headline">
		Edit Artist				
	</div>

	<select name="getartist">
		<?php
		if (isset($show_artist_nick))
		{
			echo "<option selected=\"selected\" value=\"$show_all_user_names\">$show_artist_nick</option>";
		}
		$ask="select nick from artists";
		$result=fetchAll($ask);
		foreach ($result as $row)
		{
			$show_all_artist_names=$row->nick;
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
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$artist_crew=$row[0];
				?>
				<select name="old_artist_crews[]"> 
					<option selected="selected"><?=$artist_crew?></option>
					<option value="Delete">Remove Crew</option>
					<?php
					$ask_crews="select name from crews";
					$result_crews=fetchAll($ask_crews);
					foreach ($result_crews as $row_crews)
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

		if(isset($_POST['getuser']) && is_admin())
		{
			$getuser=$_POST['getuser'];
			$getuser=cleanInsert($getuser);

			$ask="select * from users where nick=:getuser";
			$result=fetchAll($ask, [ ':getuser' => $getuser]);
			foreach ($result as $row)
			{
				$show_user_nick=$row->nick;
				$show_user_www=$row->www;
				$show_user_status=$row->active;
				$show_user_crew=$row->crew;
				$show_user_bbs=$row->bbs;
				$show_user_country=$row->country;
				$show_user_acronym=$row->acronym;
				$show_user_rank=$row->rank;
			}
		}
		?>
		<form enctype="multipart/form-data" action="#" method="post">
			<div class="headline">
				Edit User				
			</div>

			<div class="content">
				<select name="getuser">
					<?php
					if (isset($show_user_nick))
					{
						echo "<option selected value=\"$show_all_user_names\">$show_user_nick</option>";
					}
					$ask="SELECT nick FROM users";
					$result=fetchAll($ask);
					foreach ($result as $row)
					{
						$show_all_user_names=$row->nick;
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
				$ask="select * from users where nick=:getuser";
				$result=fetchAll($ask, [ ':getuser' => $getuser ]);

				foreach ($result as $row)
				{
					$show_user_nick    = $row->nick;
					$show_user_crew    = $row->crew;
					$show_user_byear   = $row->byear;
					$show_user_bmonth  = $row->bmonth;
					$show_user_bday    = $row->bday;
					$show_user_country = $row->country;
					$show_user_avatar  = $row->avatar;
					$show_user_mail    = $row->mail;
					$show_user_webpage = $row->webpage;		
					$show_user_sigdata = $row->sigdata;
					$show_user_rank    = $row->rank;
					$user_signature    = $row->signature;
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

			if(isset($_POST['getsitelogo']) && is_admin())
			{
				$getsitelogo=$_POST['getsitelogo'];
				$getsitelogo=cleanInsert($getsitelogo);

				$ask="select * from logos where logo_id=:getsitelogo";
				$result=fetchAll($ask, [':getsitelogo' => $getsitelogo]);
				foreach ($result as $row)
				{
					$logo_id=$row->logo_id;
					$logo_image="<img class=\"centered\" border=\"0\" src=logos/$logo_id>";
				}
			}

			?>
			<form enctype="multipart/form-data" action="#" method="post">
				<div class="headline">
					Edit Site Logos			
				</div>

				<div class="content">
					<select name="getsitelogo">
						<?php
						if (isset($_POST['getsitelogo']))
						{
							echo "<option selected=\"selected\">$getsitelogo</option>";
						}

						$ask="select logo_id from logos";
						$result=fetchAll($ask);
						foreach ($result as $row)
						{
							$show_all_site_logos=$row->logo_id;
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
				$ask="select * from logos where logo_id=:editsitelogo";
				$result=fetchAll($ask, [ ':editsitelogo' => $editsitelogo]);
				foreach ($result as $row)
				{
					$logo_id = $row->logo_id;
					$author   = $row->author;
					$ascii    = $row->ascii;
					$base64   = $row->base64;
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
			if(isset($_POST['getbbs']) && is_admin())
			{
				$getbbs=$_POST['getbbs'];
				$ask="select * from bbses where name=:getbbs";
				$result=fetchAll($ask, [ ':getbbs' => $getbbs ]);
				foreach ($result as $row)
				{
					$show_bbs_name    = $row->name;
					$show_bbs_sysop   = $row->sysop;
					$show_bbs_address = $row->address;
					$show_bbs_number  = $row->number;
				}
			}

			?>

			<div class="headline">
				Edit BBS			
			</div>

			<form enctype="multipart/form-data" action="admin.php" method="post">
				<div class="content">
					<select name="getbbs">
						<?php
						if (isset($_POST['getbbs']))
						{
							echo "<option selected=\"selected\">$show_bbs_name</option>";
						}
						$ask="SELECT name FROM bbses ORDER BY name";
						$result=fetchAll($ask);
						foreach ($result as $row)
						{
							$show_all_bbses=$row->name;
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
							$result=fetchAll($ask);
							foreach ($result as $row)
							{
								$forum_name = $row->forum_name;
								$forum_id   = $row->forum_id;
								$public     = $row->public;

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

								$ask_members="SELECT nick FROM forum_access where forum_id=:forum_id ORDER BY nick ASC";
								$result_members=fetchAll($ask_members,[':forum_id' => $forum_id]);
								foreach ($result_members as $row_members)
								{
									$forum_member=$row_members->nick;				
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
												$result_add_member=fetchAll($ask_add_member);
												foreach ($result_add_member as $row_add_member)
												{
													$forum_member=$row_add_member->nick;
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

						<form enctype="multipart/form-data" action="admin.php" method="post">
							<?php
							$ask="SELECT * FROM collys WHERE broken='1' ORDER BY filename ASC";
							$result=fetchAll($ask);
							foreach ($result as $row)
							{
								$filename=$row->filename;
								$encoded_filename=base64_encode($filename);
								$broken_comment=$row->broken_comment;

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
