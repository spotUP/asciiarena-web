<?php
require_once "session.php";
$h1 = "aDMiN";
include "header.php";
?>
<script type="text/javascript">
	$(document).ready(function() {
		var hash = window.location.hash;
		hash && $('ul.nav a[href="' + hash + '"]').tab('show');
	});
</script>
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
				doQuery($ask,['fixed_colly' => $fixed_colly]);
			}
			?>
			<meta http-equiv="Refresh" content="0"; url="admin.php">
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
				doQuery($ask, [ 'delete_user' => $delete_user ]);
			}
			?><meta http-equiv="Refresh" content="0"; url="admin.php"><?php
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
				doQuery($ask,[ 'delete_crew' => $delete_crew]);

				$ask="delete from bbs_of where crew=:delete_crew";
				doQuery($ask,[ 'delete_crew' => $delete_crew]);
			}
			?><meta http-equiv="Refresh" content="0"; url="admin.php"><?php
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
				doQuery($ask, ['delete_sitelogo' => $delete_sitelogo]);
			}
			?><meta http-equiv="Refresh" content="0"; url="admin.php"><?php
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

			$row = fetchOne("select sum(filesize) AS sum_filesize from collys where uploader=:nick", [":nick" => $nick]);
			if ($row)
			{
				$collysize=$row->sum_filesize;
			}

			$row = fetchOne("select sum(filesize) AS sum_filesize from mags where uploader=:nick", [":nick" => $nick]);
			if ($row)
			{
				$magsize=$row->sum_filesize;
			}

			$row = fetchOne("select sum(filesize) AS sum_filesize from apps where uploader=:nick", [":nick" => $nick]);
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
				$result_avg=fetchAll($ask_avg, ['artist' => $artist]);
				foreach ($result_avg as $row_avg)
				{
					$avg_artist_rating=$row_avg->avg_rating;
				}
				
				$ask_rate_amount="SELECT COUNT(rating) AS count_rating from comments where artist=:artist and rating>0";
				$result_rate_amount=fetchAll($ask_rate_amount,[ 'artist' => $artist ]);
				foreach ($result_rate_amount as $row_rate_amount)
				{
					$rate_amount=$row_rate_amount->count_rating;
				}

				if ($rate_amount >2)
				{
					$ask_update="update artists set rating=:avg_artist_rating where nick=:artist";
					doQuery($ask_update, [ 'artist' => $artist, 'avg_artist_rating' => $avg_artist_rating]);	
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
				$result_rating=fetchAll($ask_rating, ['crew' => $crew ]);
				foreach ($result_rating as $avg_crew_rating)
				{
					$avg_crew_rating=$row_rating->avg_rating;
				}
				if(!isset($avg_crew_rating))
				{
					$avg_crew_rating=0;
				}	
				$ask_update="update crews set rating=:avg_crew_rating where name=:crew ";
				doQuery($ask_update,['avg_crew_rating' => $avg_crew_rating, 'crew' => $crew]);	
			}
			?>
			<meta http-equiv="Refresh" content="0"; url="admin.php">
			<?php
			exit;
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
				doQuery($ask, ['delete_artist' => $delete_artist]);

				$ask="delete from member_of where nick=:delete_artist";
				doQuery($ask, ['delete_artist' => $delete_artist]);
			}
			?>
			<meta http-equiv="Refresh" content="0"; url="admin.php"><?php
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
				doQuery($ask, ['edit_colly_name' => $edit_colly_name, 'filename' => $filename]);
			}

			if(isset($_POST['old_colly_authors']) || (isset($_POST['colly_author']) && is_admin()))
			{
				$filename=$_POST['filename'];
				$filename=cleanInsert($filename);

				$ask="delete from author_of where filename=:filename";
				doQuery($ask, ['filename' => $filename]);

				if (isset($_POST['old_colly_authors']))
				{			
					foreach($_POST['old_colly_authors'] as $colly_author)
					{
						$colly_author=cleanInsert($colly_author);
						$ask="insert into author_of values (:colly_author,:filename)";
						doQuery($ask, ['colly_author' => $colly_author, 'filename' => $filename]);
					}
				}

				if (isset($_POST['colly_author']))
				{
					foreach($_POST['colly_author'] as $new_colly_author)
					{
						$new_colly_author=cleanInsert($new_colly_author);
						$ask="insert into author_of values (:new_colly_author,:filename)";
						doQuery($ask,['new_colly_author' => $new_colly_author, 'filename' => $filename]);
					}
				}
				$ask="delete from author_of where filename=:filename and nick='Delete'";
				doQuery($ask,['filename' => $filename ]);
			}
			if(isset($_POST['old_colly_crews']) || (isset($_POST['colly_crew']) && is_admin()))
			{
				$filename=$_POST['filename'];
				$filename=cleanInsert($filename);

				$ask="delete from crew_of where filename=:filename";
				doQuery($ask,['filename' => $filename]);

				if (isset($_POST[old_colly_crews]))
				{			
					foreach($_POST[old_colly_crews] as $colly_crew)
					{
						$ask="insert into crew_of values (:colly_crew,:filename)";
						doQuery($ask,['colly_crew' => $colly_crew, 'filename' => $filename]);
					}
				}

				if (isset($_POST[colly_crew]))
				{
					foreach($_POST[colly_crew] as $new_colly_crew)
					{
						$ask="insert into crew_of values (:new_colly_crew, :filename)";
						doQuery($ask, ['new_colly_crew' => $new_colly_crew, 'filename' => $filename]);
					}
				}

				$ask="delete from crew_of where filename=:filename and crew='Delete'";
				doQuery($ask,['filename' => $filename]);
			}
			if(isset($_POST['edit_colly_year']) && is_admin())
			{
				$filename=$_POST['filename'];
				$filename=cleanInsert($filename);
				$edit_colly_year=$_POST['edit_colly_year'];
				$edit_colly_year= cleanInsert($edit_colly_year); 
				$ask="update collys set year=:edit_colly_year where filename=:filename";	
				doQuery($ask,['edit_colly_year' => $edit_colly_year, 'filename' => $filename]);	
			}
			if(isset($_POST['edit_colly_type']) && is_admin())
			{
				$filename=$_POST['filename'];
				$filename=cleanInsert($filename);

				$edit_colly_type=$_POST['edit_colly_type'];
				$edit_colly_type=cleanInsert($edit_colly_type); 

				$ask="update collys set type=:edit_colly_type where filename=:filename";	
				doQuery($ask,['edit_colly_type' => $edit_colly_type, 'filename' => $filename]);	
			}
			if(isset($_POST['edit_colly_month']) && is_admin())
			{
				$filename=$_POST['filename'];
				$filename=cleanInsert($filename);

				$edit_colly_month=$_POST['edit_colly_month'];
				$edit_colly_month=cleanInsert($edit_colly_month);

				$ask="update collys set month='$edit_colly_month' where filename='$filename'";	
				doQuery($ask,['edit_colly_month' => $edit_colly_month, 'filename' => $filename]);	
			}
			if(isset($_POST['edit_colly_day']) && is_admin())
			{
				$filename=$_POST['filename'];
				$filename=cleanInsert($filename);

				$edit_colly_day=$_POST['edit_colly_day'];
				$edit_colly_day=cleanInsert($edit_colly_day); 

				$ask="update collys set day=:edit_colly_day where filename=:filename";	
				doQuery($ask,['edit_colly_day' => $edit_colly_day, 'filename' => $filename]);	
			}

//---------------------------------------------------------------------------------------------------------------
// RECALCULATE RATINGS
//---------------------------------------------------------------------------------------------------------------

			$ask="select nick from author_of";
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$artist=$row->nick;

				$ask_rating="select avg(rating) AS avg from comments where artist=:artist and rating>0";
				$result_rating=fetchAll($ask_rating,['artist' => $artist]);
				foreach ($result_rating as $row_rating)
				{
					$avg_artist_rating=$row_rating->avg;
				}

				if(!isset($avg_artist_rating))
				{
					$avg_artist_rating=0;
				}	

				$ask_update="update artists set rating=:avg_artist_rating where nick=:artist";
				doQuery($ask,['avg_artist_rating' => $avg_artist_rating, 'artist' => $artist]);	
			}
			$ask="select crew from crew_of";
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$crew=$row->crew;

				$ask_rating="select avg(rating) AS avg from comments where crew=:crew and rating>0";
				$result_rating=fetchAll($ask_rating,[ 'crew' => $crew ]);
				foreach ($result_rating as $row)
				{
					$avg_crew_rating=$row_rating->avg;
				}
				if(!isset($avg_crew_rating))
				{
					$avg_crew_rating=0;
				}	
				$ask_update="update crews set rating=:avg_crew_rating where name=:crew";
				doQuery($ask_update,['avg_crew_rating' => $avg_crew_rating, 'crew' => $crew]);	
			}
			?>
			<meta http-equiv="Refresh" content="0"; url="admin.php">
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

				doQuery("update crews     set name=:edit_crew_name where name=:crew", ['edit_crew_name' => $edit_crew_name, 'crew' => $crew]);
				doQuery("update crew_of   set crew=:edit_crew_name where crew=:crew", ['edit_crew_name' => $edit_crew_name, 'crew' => $crew]);	
				doQuery("update bbs_of    set crew=:edit_crew_name where crew=:crew", ['edit_crew_name' => $edit_crew_name, 'crew' => $crew]);	
				doQuery("update member_of set crew=:edit_crew_name where crew=:crew", ['edit_crew_name' => $edit_crew_name, 'crew' => $crew]);	
			}
			if(isset($_POST['edit_crew_www']) && is_admin())
			{
				$crew=$_POST['getcrew'];
				$crew=cleanInsert($crew);

				$edit_crew_www=$_POST['edit_crew_www'];
				$edit_crew_www=cleanInsert($edit_crew_www); 

				doQuery("update crews set www=:edit_crew_www where name=:edit_crew_name", ['edit_creq_www' => $edit_crew_www, 'edit_crew_name' => $edit_crew_name]);	
			}

			if(isset($_POST['add_bbs']) && is_admin())
			{
				foreach($_POST[add_bbs] as $add_bbs) // add new bbses
				{
					doQuery("insert into bbs_of values (:add_bbs,:crew)", ['add_bbs' => $add_bbs, 'crew' => $crew]);
				}
			}

			if(isset($_POST['edit_crew_contact']) && is_admin())
			{
				$crew=$_POST['getcrew'];
				$crew=cleanInsert($crew);

				$edit_crew_contact=$_POST['edit_crew_contact'];
				$edit_crew_contact=cleanInsert($edit_crew_contact); 

				$ask="update crews set contact='$edit_crew_contact' where name='$edit_crew_name'";	
				doQuery($ask, ['edit_crew_contact' => $edit_crew_contact, 'edit_crew_name' => $edit_crew_name]);	
			}
			if(isset($_POST['edit_crew_status']) && is_admin())
			{
				$crew=$_POST['getcrew'];
				$crew=cleanInsert($crew);

				$edit_crew_status=$_POST['edit_crew_status'];
				$edit_crew_status=cleanInsert($edit_crew_status); 

				$ask="update crews set active=:edit_crew_status where name=:edit_crew_name";	
				doQuery($ask, ['edit_crew_status' => $edit_crew_status, 'edit_crew_name' => $edit_crew_name]);	
			}
			if(isset($_POST['edit_crew_acronym']) && is_admin())
			{
				$crew=$_POST['getcrew'];
				$crew=cleanInsert($crew);

				$edit_crew_acronym=$_POST['edit_crew_acronym'];
				$edit_crew_acronym=cleanInsert($edit_crew_acronym); 

				$ask="update crews set acronym=:edit_crew_acronym where name=:edit_crew_name";
				doQuery($ask, ['edit_crew_acronym' => $edit_crew_acronym, 'edit_crew_name' => $edit_crew_name ]);
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
				doQuery($ask,['edit_artist_nick' => $edit_artist_nick, 'artist' => $artist]);	

				$ask="update member_of set nick=:edit_artist_nick' where nick=:artist";	
				doQuery($ask,['edit_artist_nick' => $edit_artist_nick, 'artist' => $artist]);	

				$ask="update author_of set nick=:edit_artist_nick' where nick=:artist";	
				doQuery($ask,['edit_artist_nick' => $edit_artist_nick, 'artist' => $artist]);	

			}
			if(isset($_POST['edit_artist_www']) && is_admin())
			{
				$artist=$_POST['getartist'];
				$artist=cleanInsert($artist);

				$edit_artist_www=$_POST['edit_artist_www'];
				$edit_artist_www = cleanInsert($edit_artist_www); 

				$ask="update artists set www=:edit_artist_www where nick=:edit_artist_nick";	
				doQuery($ask,['edit_artist_www' => $edit_artist_www, 'edit_artist_nick' => $edit_artist_nick]);	
			}
			if(isset($_POST['edit_artist_status']) && is_admin())
			{
				$artist=$_POST['getartist'];
				$artist=cleanInsert($artist);

				$edit_artist_status=$_POST['edit_artist_status'];
				$edit_artist_status = cleanInsert($edit_artist_status); 

				$ask="update artists set active=:edit_artist_status where nick=:edit_artist_nick";	
				doQuery($ask, ['edit_artist_status' => $edit_artist_status, 'edit_artist_nick' => $edit_artist_nick]);	
			}
			if(isset($_POST['old_artist_crews']) || (isset($_POST['artist_crew']) && is_admin()))
			{
				$artist=$_POST['getartist'];
				$artist=cleanInsert($artist);

				$ask="delete from member_of where nick=:edit_artist_nick";
				doQuery($ask, ['edit_artist_nick' => $edit_artist_nick]);

				if (isset($_POST[old_artist_crews]))			
				{
					foreach($_POST[old_artist_crews] as $artist_crew)
					{
						$ask="insert into member_of values (:artist_crew,:edit_artist_nick)";
						doQuery($ask,['artist_crew' => $artist_crew, 'edit_artist_nick' => $edit_artist_nick]);
					}
				}
				if (isset($_POST[artist_crew]))
				{
					foreach($_POST[artist_crew] as $new_artist_crew)
					{
						$ask="insert into member_of values (:new_artist_crew,:edit_artist_nick)";
						doQuery($ask,['new_artist_crew' => $new_artist_crew, 'edit_artist_nick' => $edit_artist_nick]);
					}
				}

				$ask="delete from member_of where nick=:edit_artist_nick and crew='Delete'";
				doQuery($ask, ['edit_artist_nick' => $edit_artist_nick]);
			}

			if(isset($_POST['change_artist_country']) && is_admin())
			{
				$artist=cleanInsert($_POST['getartist']);
				$change_artist_country = cleanInsert($_POST['change_artist_country']); 

				if (!empty($change_artist_country))
				{
					$ask="update artists set country=:change_artist_country where nick=:edit_artist_nick";	
					doQuery($ask, ['change_artist_country' => $country_list[$change_artist_country], 'edit_artist_nick' => $edit_artist_nick]);	
				}
			}

			if(isset($_POST['edit_artist_acronym']) && is_admin())
			{
				$artist=$_POST['getartist'];
				$artist=cleanInsert($artist);

				$edit_artist_acronym=$_POST['edit_artist_acronym'];
				$edit_artist_acronym=cleanInsert($edit_artist_acronym); 

				$ask="update artists set acronym=:edit_artist_acronym where nick=:edit_artist_nick";	
				doQuery($ask,['edit_artist_acronym' => $edit_artist_acronym, 'edit_artist_nick' => $edit_artist_nick]);	
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
			doQuery($ask, ['change_user_nick' => $change_user_nick, 'user_nick' => $user_nick]);	
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
			doQuery($ask,['changecrew' => $changecrew, 'change_user_nick' => $change_user_nick ]);	
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
			doQuery($ask, ['edit_user_rank' => $edit_user_rank, 'change_user_nick' => $change_user_nick]);	
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
			doQuery($ask, ['changebyear' => $changebyear, 'change_user_nick' => $change_user_nick]);	
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
			doQuery($ask, ['changebmonth' => $changebmonth, 'change_user_nick' => $change_user_nick]);	
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
			doQuery($ask, ['changebday' => $changebday, 'change_user_nick' => $change_user_nick]);	
		}
		if(isset($_POST['changeusercountry']))
		{
			$change_user_nick=$_POST['changeusernick'];
			$change_user_nick=cleanInsert($change_user_nick);

			$change_country=$_POST['changeusercountry'];
			$change_country=cleanInsert($change_country);

			$user_nick=$_POST['usernick'];
			$user_nick=cleanInsert($user_nick);

			$ask="update users set country=:change_country where nick=:change_user_nick";
			doQuery($ask,['change_country' => $country_list[$change_country], 'change_user_nick' => $change_user_nick ]);	
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
			doQuery($ask,['changemessenger' => $changemessenger, 'change_user_nick' => $change_user_nick]);	
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
				<div class="bs-component">
					<div class="animate__animated animate__shakeX alert alert-dismissible alert-danger">
						<button type="button" class="close" data-dismiss="alert">x</button>
						<span>You can not submit an empty logo!<span>
					</div>
				</div>
				<?php
			}
			$user_nick=$_POST['usernick'];
			$user_nick=cleanInsert($user_nick);

			$ask="update users set mail=:mail where nick=:change_user_nick";
			doQuery($ask, ['mail' => $mail, 'change_user_nick' => $change_user_nick ]);	
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

//			$font=$_POST['font'];
//			$font=cleanInsert($font);

			$user_nick=$_POST['usernick'];
			$user_nick=cleanInsert($user_nick);

			$signature=utf8_encode($signature); // convert UTF-8 string to ISO-88591

			if(empty($signature))
			{
				?>
				<div class="bs-component">
					<div class="animate__animated animate__shakeX alert alert-dismissible alert-danger">
						<button type="button" class="close" data-dismiss="alert">x</button>
						<span>You have to make a signature before submitting!<span>
					</div>
				</div>				
				<?php
			}

//			$rgbvalue=$_POST['setcolor'];
//			$rgbvalue = explode(",", $rgbvalue);
//			$delimiter=",";

//			file_put_contents("signatures/tempsignature.diz", $signature);
//			load_ansi("signatures/tempsignature.diz","signatures/tempsignature.diz","$font","transparent",0);

//			$old_fg_color_r="170";
//			$old_fg_color_g="170";
//			$old_fg_color_b="170";

//			$image = imageCreateFromPNG("signatures/tempsignature.diz.png");

//			$fg_color = imageColorExact($image,$old_fg_color_r,$old_fg_color_g,$old_fg_color_b);	//get color to replace
//			imageColorSet($image,$fg_color,$rgbvalue[0],$rgbvalue[1],$rgbvalue[2]);		//replace color with

//			imagepng($image,"signatures/$user_signature.png");	 											// save image		

			$ask="update users set signature=:user_signature where nick=:edit_user_nick";
			doQuery($ask, ['user_signature' => $user_signature, 'edit_user_nick' => $edit_user_nick]);

			$sigdata=cleanInsertPost($sigdata);
			$ask="update users set sigdata=:sigdata where nick=:edit_user_nick";
			doQuery($ask, ['sigdata' => $sigdata, 'edit_user_nick' => $edit_user_nick]);

//			unlink ("signatures/tempsignature.diz");
//			unlink ("signatures/tempsignature.diz.png");
		}

//---------------------------------------------------------------------------------------------------------------
// WRITE EDITED LOGO TO DISK
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['editedsitelogo']))
		{
			$logo=$_POST['getsitelogo'];
			$editedsitelogodata=$_POST['editedsitelogo'];

//			$font=$_POST['font'];
//			$font=cleanInsert($font);
//		$editedsitelogodata = htmlspecialchars($editedsitelogodata, ENT_QUOTES);

//		htmlspecialchars_decode($editedsitelogodata, ENT_QUOTES);
//		$editedsitelogodata=utf8_encode($editedsitelogodata);

			if(empty($editedsitelogodata))
			{
				?>
				<div class="bs-component">
					<div class="animate__animated animate__shakeX alert alert-dismissible alert-danger">
						<button type="button" class="close" data-dismiss="alert">x</button>
						<span>You can not submit an empty logo!<span>
					</div>
				</div>
				<?php
			}

//		$rgbvalue=$_POST['set_edited_logo_color'];
//		$rgbvalue=cleanInsert($rgbvalue);
//		$rgbvalue = explode(",", $rgbvalue);
//		$delimiter=",";

//		file_put_contents("templogo.diz", $editedsitelogodata);
//		load_ansi("templogo.diz","templogo.diz","$font","transparent",0);

//		$old_fg_color_r="170";
//		$old_fg_color_g="170";
//		$old_fg_color_b="170";

//		$image = imageCreateFromPNG("templogo.diz.png");

//		$fg_color = imageColorExact($image,$old_fg_color_r,$old_fg_color_g,$old_fg_color_b);	//get color to replace
//		imageColorSet($image,$fg_color,$rgbvalue[0],$rgbvalue[1],$rgbvalue[2]);		//replace color with

//		imagepng($image,"logos/$logo");	 											// save image		

//		unlink ("templogo.diz");
//		unlink ("templogo.diz.png");

		//$editedsitelogodata=cleanInsertPost($editedsitelogodata);
			$ask_update="update logos set ascii=:editedsitelogodata where logo_id=:logo";
			doQuery($ask_update,['editedsitelogodata' => $editedsitelogodata, 'logo' => $logo]);	

//		$ask_update="update logos set base64='1' where filename=:logo";
//		doQuery($ask_update,['logo' => $logo]);	
		}

//----------------------------------------------------------------------------------------------------------------------------

		?>

		<div class="row">
			<div class="col-lg-12">
				<?php if(is_admin()) { ?>
					<div class="bs-component">
						<ul class="nav nav-tabs apt-1 bg-secondary">
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
								<a class="nav-link" data-toggle="tab" href="#edituser">User</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#sitelogo">Site Logo</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#bbs">BBS</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#broken">Broken Collys</a>
							</li>
						</ul>
						<div id="myTabContent" class="tab-content apt-1" style="background-color: #1a1a1a;">

							<?php

							include ("admin_edit_colly.php");
							include ("admin_edit_crew.php");
							include ("admin_edit_artist.php");
							include ("admin_edit_user.php");
							include ("admin_edit_site_logo.php");
							include ("admin_edit_bbs.php");
							include ("admin_edit_broken_collys.php");

							?>
						</div>
					</div>
				<?php } else { ?>
					<div class="bs-component">
						<div class="animate__animated animate__shakeX alert alert-dismissible alert-primary">
							<button type="button" class="close" data-dismiss="alert">x</button>
							You need to be <a class="ascii" data-toggle="modal" style="padding-right: 8px;" href="#login">an admin</a>to use this feature.
						</div>
					</div>
				<?php } ?>
			</div>
		</div>
	</div>
	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>

	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>

	<?php include "footer.php";
