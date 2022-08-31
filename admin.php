<?php
require_once "session.php";
$h1 = "aDMiN";
include "header.php";
?>
<script type="text/javascript">
	$(document).ready(function() {
		var hash = window.location.hash;
		hash && $('ul.nav a[href="' + hash + '"]').tab('show');

		window.addEventListener('hashchange', function(){
			var hash = window.location.hash;
			hash && $('ul.nav a[href="' + hash + '"]').tab('show');
    	});
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
			$fixed_colly=$_POST['filename'];
			if(!empty($fixed_colly))
			{
				$ask="update collys set broken=0 where filename=:fixed_colly";
				doQuery($ask,['fixed_colly' => $fixed_colly]);
			}
			?>
			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-success">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>Good bwai! Colly marked as fixed!</span>
				</div>
			</div>
			<meta http-equiv="Refresh" content="4"; url="admin.php">
			<?php
			exit;
		}	

//---------------------------------------------------------------------------------------------------------------
// DELETE USER FROM DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['delete_user']) && is_admin())
		{
			$delete_user=$_POST['getuser'];

			if(!empty($delete_user))
			{
				$ask="delete from users where nick=:delete_user";
				doQuery($ask, [ 'delete_user' => $delete_user ]);
			}
			?>
			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-success">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>User successfully deleted.</span>
				</div>
			</div>
			<meta http-equiv="Refresh" content="4"; url="admin.php">
			<?php
			exit;
		}	

//---------------------------------------------------------------------------------------------------------------
// DELETE CREW FROM DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['do_delete_crew']) && is_admin())
		{
			$delete_crew=$_POST['getcrew'];

			if(!empty($delete_crew))
			{
				$ask="delete from crews where name=:delete_crew";
				doQuery($ask,[ 'delete_crew' => $delete_crew]);

				$ask="delete from bbs_of where crew=:delete_crew";
				doQuery($ask,[ 'delete_crew' => $delete_crew]);
			}
			?>
			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-success">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>Crew successfully deleted.</span>
				</div>
			</div>	
			<meta http-equiv="Refresh" content="4"; url="admin.php">
			<?php
			exit;
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
			?>
			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-success">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>Logo successfully deleted!</span>
				</div>
			</div>
			<meta http-equiv="Refresh" content="4"; url="admin.php">
			<?php
			exit;
		}	

//---------------------------------------------------------------------------------------------------------------
// DELETE COLLY FROM DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['do_delete_colly']) && is_admin())
		{
			$delete_colly=$_POST['filename'];
			$ask="select uploader from collys where filename='$delete_colly'"; // fetch uploader of deleted colly
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$uploader=$row->uploader;
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

			if (file_exists("collys/$delete_colly.diz"))
			{		
				$delete_colly=addslashes($delete_colly);
				unlink("collys/$delete_colly.diz");
			}
			
			if(!empty($delete_colly))
			{
				doQuery("delete from collys    WHERE filename    = :delete_colly", [ ":delete_colly" =>  $delete_colly   ]); 
				doQuery("delete from comments  WHERE filename    = :delete_colly", [ ":delete_colly" =>  $delete_colly   ]); 
				doQuery("DELETE FROM collys_crews WHERE colly_id IN (SELECT id FROM collys WHERE filename=:delete_colly)", [ ":delete_colly" => "$delete_colly%" ]); 
				doQuery("DELETE FROM artists_collys WHERE colly_id IN (SELECT id FROM collys WHERE filename=:delete_colly)", [ ":delete_colly" => "$delete_colly%" ]); 
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

			recalculate_ratings();
			?>
			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-success">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>Colly successfully deleted!</span>
				</div>
			</div>	
			<meta http-equiv="Refresh" content="4"; url="admin.php">
			<?php
			exit;
		}	

//---------------------------------------------------------------------------------------------------------------
// DELETE ARTIST FROM DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['delete_artist']) && is_admin())
		{
			$delete_artist=$_POST['getartist'];
			if(!empty($delete_artist))
			{
				$ask="delete from artists where nick=:delete_artist";
				doQuery($ask, ['delete_artist' => $delete_artist]);

				$ask="delete from member_of where nick=:delete_artist";
				doQuery($ask, ['delete_artist' => $delete_artist]);
			}
			?>
			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-success">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>Artist successfully deleted!</span>
				</div>
			</div>	
			<meta http-equiv="Refresh" content="4"; url="admin.php">
			<?php
			exit;
		}	

//---------------------------------------------------------------------------------------------------------------
// WRITE COLLY INFO TO DB
//---------------------------------------------------------------------------------------------------------------

		$filename = (isset($_POST['filename'])) ? $_POST['filename'] : "";

		if(isset($_POST['do_edit_colly']) && is_admin())
		{
			if(isset($_POST['edit_colly_name']) && is_admin())
			{

				$edit_colly_name=$_POST['edit_colly_name'];
				$ask="update collys set name=:edit_colly_name where filename=:filename";	
				doQuery($ask, ['edit_colly_name' => $edit_colly_name, 'filename' => $filename]);
			}

			$_POST['old_colly_authors'] = array_filter($_POST['old_colly_authors'], function($x) { return !empty($x); });
			if(count($_POST['old_colly_authors']) > 0 || (isset($_POST['colly_author']) && is_admin()))
			{

				$ask = "DELETE FROM artists_collys WHERE colly_id in (SELECT id FROM collys WHERE filename=:filename)";
				doQuery($ask, ['filename' => $filename]);

				if (isset($_POST['old_colly_authors']))
				{			
					foreach($_POST['old_colly_authors'] as $colly_author)
					{
						if ($colly_author === 'Delete') continue;
						$ask = "INSERT INTO artists_collys (artist_id, colly_id) VALUES (
						(SELECT id FROM artists WHERE nick=:artist),
						(SELECT id FROM collys WHERE filename=:filename))";
						doQuery($ask, ['artist' => $colly_author, 'filename' => $filename]);
					}
				}

				if (isset($_POST['colly_author']))
				{
					foreach($_POST['colly_author'] as $new_colly_author)
					{
						if ($new_colly_author === 'Delete') continue;
						$ask = "INSERT INTO artists_collys (artist_id, colly_id) VALUES (
						(SELECT id FROM artists WHERE nick=:artist),
						(SELECT id FROM collys WHERE filename=:filename))";
						doQuery($ask, ['artist' => $new_colly_author, 'filename' => $filename]);
					}
				}
				?>
				<div class="bs-component">
					<div class="animate__animated animate__tada alert alert-dismissible alert-success">
						<button type="button" class="close" data-dismiss="alert">x</button>
						<span>Colly updated successfully!</span>
					</div>
				</div>
				<?php
			}
			$_POST['old_colly_crews'] = array_filter($_POST['old_colly_crews'], function($x) { return !empty($x); });
			if(isset($_POST['old_colly_crews']) || (isset($_POST['colly_crew']) && is_admin()))
			{
				$filename=$_POST['filename'];
				$ask = "DELETE FROM collys_crews WHERE colly_id in (SELECT id FROM collys WHERE filename=:filename)";
				doQuery($ask,['filename' => $filename]);

				if (isset($_POST['old_colly_crews']))
				{			
					foreach($_POST['old_colly_crews'] as $colly_crew)
					{
						if ($colly_crew === 'Delete') continue;
						$ask = "INSERT INTO collys_crews (colly_id, crew_id) VALUES (
						(SELECT id FROM collys WHERE filename=:filename),
						(SELECT id FROM crews WHERE name=:crew))";
						doQuery($ask, [ 'crew' => $colly_crew, 'filename' => $filename ]);
					}
				}

				if (isset($_POST['colly_crew']))
				{
					foreach($_POST['colly_crew'] as $new_colly_crew)
					{
						if ($new_colly_crew === 'Delete') continue;
						$ask = "INSERT INTO collys_crews (colly_id, crew_id) VALUES (
						(SELECT id FROM collys WHERE filename=:filename),
						(SELECT id FROM crews WHERE name=:crew))";
						doQuery($ask, [ 'crew' => $new_colly_crew, 'filename' => $filename ]);
					}
				}
				?>
				<div class="bs-component">
					<div class="animate__animated animate__tada alert alert-dismissible alert-success">
						<button type="button" class="close" data-dismiss="alert">x</button>
						<span>Colly updated successfully!</span>
					</div>
				</div>
				<?php
			}
			if(isset($_POST['edit_colly_year']) && is_admin())
			{
				$filename=$_POST['filename'];
				$edit_colly_year=$_POST['edit_colly_year'];
				$ask="update collys set year=:edit_colly_year where filename=:filename";	
				doQuery($ask,['edit_colly_year' => $edit_colly_year, 'filename' => $filename]);	
			}
			if(isset($_POST['edit_colly_type']) && is_admin())
			{
				$filename=$_POST['filename'];

				$edit_colly_type=$_POST['edit_colly_type'];

				$ask="update collys set type=:edit_colly_type where filename=:filename";	
				doQuery($ask,['edit_colly_type' => $edit_colly_type, 'filename' => $filename]);	
			}
			if(isset($_POST['edit_colly_month']) && is_admin())
			{
				$filename=$_POST['filename'];

				$edit_colly_month=$_POST['edit_colly_month'];

				$ask="update collys set month=:edit_colly_month where filename=:filename";	
				doQuery($ask,['edit_colly_month' => $edit_colly_month, 'filename' => $filename]);	
			}
			if(isset($_POST['edit_colly_day']) && is_admin())
			{
				$filename=$_POST['filename'];

				$edit_colly_day=$_POST['edit_colly_day'];

				$ask="update collys set day=:edit_colly_day where filename=:filename";	
				doQuery($ask,['edit_colly_day' => $edit_colly_day, 'filename' => $filename]);	
			}

			recalculate_ratings();
			?>

			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-success">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>Colly successfully updated!</span>
				</div>
			</div>
			<meta http-equiv="Refresh" content="4"; url="admin.php">
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
				$edit_crew_name=$_POST['edit_crew_name'];

				doQuery("update crews     set name=:edit_crew_name where name=:crew", ['edit_crew_name' => $edit_crew_name, 'crew' => $crew]);
				doQuery("update bbs_of    set crew=:edit_crew_name where crew=:crew", ['edit_crew_name' => $edit_crew_name, 'crew' => $crew]);	
				doQuery("update member_of set crew=:edit_crew_name where crew=:crew", ['edit_crew_name' => $edit_crew_name, 'crew' => $crew]);	
			}
			if(isset($_POST['edit_crew_www']) && is_admin())
			{
				$crew=$_POST['getcrew'];

				$edit_crew_www=$_POST['edit_crew_www'];

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
				$edit_crew_contact=$_POST['edit_crew_contact'];

				$ask="update crews set contact='$edit_crew_contact' where name='$edit_crew_name'";	
				doQuery($ask, ['edit_crew_contact' => $edit_crew_contact, 'edit_crew_name' => $edit_crew_name]);	
			}
			if(isset($_POST['edit_crew_status']) && is_admin())
			{
				$crew=$_POST['getcrew'];
				$edit_crew_status=$_POST['edit_crew_status'];

				$ask="update crews set active=:edit_crew_status where name=:edit_crew_name";	
				doQuery($ask, ['edit_crew_status' => $edit_crew_status, 'edit_crew_name' => $edit_crew_name]);	
			}
			if(isset($_POST['edit_crew_acronym']) && is_admin())
			{
				$crew=$_POST['getcrew'];
				$edit_crew_acronym=$_POST['edit_crew_acronym'];

				$ask="update crews set acronym=:edit_crew_acronym where name=:edit_crew_name";
				doQuery($ask, ['edit_crew_acronym' => $edit_crew_acronym, 'edit_crew_name' => $edit_crew_name ]);
			}
			?>
			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-success">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>Crew successfully updated!</span>
				</div>
			</div>	
			<meta http-equiv="Refresh" content="4"; url="admin.php">
			<?php
			exit;
		}

//---------------------------------------------------------------------------------------------------------------
// WRITE ARTIST INFO TO DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['do_edit_artist']) && is_admin())
		{
			if(isset($_POST['edit_artist_nick']) && is_admin())
			{
				$artist=$_POST['getartist'];

				$edit_artist_nick=$_POST['edit_artist_nick'];

				$ask="update artists   set nick=:edit_artist_nick where nick=:artist";	
				doQuery($ask,['edit_artist_nick' => $edit_artist_nick, 'artist' => $artist]);	

				$ask="update member_of set nick=:edit_artist_nick where nick=:artist";	
				doQuery($ask,['edit_artist_nick' => $edit_artist_nick, 'artist' => $artist]);	
			}
			if(isset($_POST['edit_artist_www']) && is_admin())
			{
				$artist=$_POST['getartist'];

				$edit_artist_www=$_POST['edit_artist_www'];

				$ask="update artists set www=:edit_artist_www where nick=:edit_artist_nick";	
				doQuery($ask,['edit_artist_www' => $edit_artist_www, 'edit_artist_nick' => $edit_artist_nick]);	
			}
			if(isset($_POST['edit_artist_status']) && is_admin())
			{
				$artist=$_POST['getartist'];

				$edit_artist_status=$_POST['edit_artist_status'];

				$ask="update artists set active=:edit_artist_status where nick=:edit_artist_nick";	
				doQuery($ask, ['edit_artist_status' => $edit_artist_status, 'edit_artist_nick' => $edit_artist_nick]);	
			}
			if(isset($_POST['old_artist_crews']) || (isset($_POST['artist_crew']) && is_admin()))
			{
				$artist=$_POST['getartist'];

				$ask="delete from member_of where nick=:edit_artist_nick";
				doQuery($ask, ['edit_artist_nick' => $edit_artist_nick]);

				if (isset($_POST['old_artist_crews']))			
				{
					foreach($_POST['old_artist_crews'] as $artist_crew)
					{
						$ask="insert into member_of (crew, nick) values (:artist_crew,:edit_artist_nick)";
						doQuery($ask,['artist_crew' => $artist_crew, 'edit_artist_nick' => $edit_artist_nick]);
					}
				}
				if (isset($_POST['artist_crew']))
				{
					foreach($_POST['artist_crew'] as $new_artist_crew)
					{
						$ask="insert into member_of (crew, nick) values (:new_artist_crew,:edit_artist_nick)";
						doQuery($ask,['new_artist_crew' => $new_artist_crew, 'edit_artist_nick' => $edit_artist_nick]);
					}
				}

				$ask="delete from member_of where nick=:edit_artist_nick and crew='Delete'";
				doQuery($ask, ['edit_artist_nick' => $edit_artist_nick]);
			}

			if(isset($_POST['change_artist_country']) && is_admin())
			{
				$artist=$_POST['getartist'];
				$change_artist_country = $_POST['change_artist_country']; 

				if (!empty($change_artist_country))
				{
					$ask="update artists set country=:change_artist_country where nick=:edit_artist_nick";	
					doQuery($ask, ['change_artist_country' => $country_list[$change_artist_country], 'edit_artist_nick' => $edit_artist_nick]);	
				}
			}

			if(isset($_POST['edit_artist_acronym']) && is_admin())
			{
				$artist=$_POST['getartist'];

				$edit_artist_acronym=$_POST['edit_artist_acronym'];

				$ask="update artists set acronym=:edit_artist_acronym where nick=:edit_artist_nick";	
				doQuery($ask,['edit_artist_acronym' => $edit_artist_acronym, 'edit_artist_nick' => $edit_artist_nick]);	
			}
			?>
			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-success">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>Artist successfully updated!</span>
				</div>
			</div>	
			<meta http-equiv="Refresh" content="4"; url="admin.php">
			<?php
			exit;
		}

//---------------------------------------------------------------------------------------------------------------
// WRITE USER INFO TO DB
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['do_edit_user']))
		{
			if(isset($_POST['changeusernick']))
			{
				$change_user_nick=$_POST['changeusernick'];
				$user_nick=$_POST['getuser'];

				$ask="update users set nick=:change_user_nick where nick=:user_nick";
				doQuery($ask, ['change_user_nick' => $change_user_nick, 'user_nick' => $user_nick]);	
				?>
				<div class="bs-component">
					<div class="animate__animated animate__shakeX alert alert-dismissible alert-success">
						<button type="button" class="close" data-dismiss="alert">x</button>
						<span>User name field updated successfully!</span>
					</div>
				</div>
				<?php
			}
			if(isset($_POST['changeusercrew']))
			{
				$change_user_nick=$_POST['changeusernick'];
				$changecrew=$_POST['changeusercrew'];
				$user_nick=$_POST['usernick'];

				$ask="update users set crew=:changecrew where nick=:change_user_nick";
				doQuery($ask,['changecrew' => $changecrew, 'change_user_nick' => $change_user_nick ]);	
			}
			if(isset($_POST['edit_user_rank']))
			{
				$change_user_nick=$_POST['changeusernick'];
				$edit_user_rank=$_POST['edit_user_rank'];
				$user_nick=$_POST['usernick'];

				$ask="update users set rank=:edit_user_rank where nick=:change_user_nick";
				doQuery($ask, ['edit_user_rank' => $edit_user_rank, 'change_user_nick' => $change_user_nick]);	
			}
			if(isset($_POST['changeuserbyear']))
			{
				$change_user_nick=$_POST['changeusernick'];
				$changebyear=$_POST['changeuserbyear'];
				$user_nick=$_POST['usernick'];

				$ask="update users set byear=:changebyear where nick=:change_user_nick";
				doQuery($ask, ['changebyear' => $changebyear, 'change_user_nick' => $change_user_nick]);	
			}
			if(isset($_POST['changeuserbmonth']))
			{
				$change_user_nick=$_POST['changeusernick'];
				$changebmonth=$_POST['changeuserbmonth'];
				$user_nick=$_POST['usernick'];

				$ask="update users set bmonth=:changebmonth where nick=:change_user_nick";
				doQuery($ask, ['changebmonth' => $changebmonth, 'change_user_nick' => $change_user_nick]);	
			}
			if(isset($_POST['changeuserbday']))
			{
				$change_user_nick=$_POST['changeusernick'];
				$changebday=$_POST['changeuserbday'];
				$user_nick=$_POST['usernick'];

				$ask="update users set bday=:changebday where nick=:change_user_nick";
				doQuery($ask, ['changebday' => $changebday, 'change_user_nick' => $change_user_nick]);	
			}
			if(isset($_POST['changeusercountry']))
			{
				$change_user_nick=$_POST['changeusernick'];
				$change_country=$_POST['changeusercountry'];
				$user_nick=$_POST['usernick'];

				$ask="update users set country=:change_country where nick=:change_user_nick";
				doQuery($ask,['change_country' => $country_list[$change_country], 'change_user_nick' => $change_user_nick ]);	
			}
			if(isset($_POST['changeusermail']))
			{
				$change_user_nick=$_POST['changeusernick'];
				$mail=$_POST['changeusermail'];

				$mail = trim($_POST['changeusermail']);  
				if(!checkEmail($mail)) 
				{
					$user_nick=$_POST['usernick'];
					$ask="update users set mail=:mail where nick=:change_user_nick";
					doQuery($ask, ['mail' => $mail, 'change_user_nick' => $change_user_nick ]);	
				}
			}
			?>
			<div class="bs-component">
				<div class="animate__animated animate__shakeX alert alert-dismissible alert-success">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>Mail field updated successfully!</span>
				</div>
			</div>
			<?php
			?>
			<meta http-equiv="Refresh" content="4"; url="admin.php">
			<?php
			exit;
		}

//---------------------------------------------------------------------------------------------------------------
// WRITE EDITED LOGO TO DISK
//---------------------------------------------------------------------------------------------------------------

		if(isset($_POST['editedsitelogo']))
		{
			$logo=$_POST['getsitelogo'];
			$editedsitelogodata=$_POST['editedsitelogo'];

			if(empty($editedsitelogodata))
			{
				?>
				<div class="bs-component">
					<div class="animate__animated animate__shakeX alert alert-dismissible alert-danger">
						<button type="button" class="close" data-dismiss="alert">x</button>
						<span>You can not submit an empty logo!</span>
					</div>
				</div>
				<?php
			}
			$ask_update="update logos set ascii=:editedsitelogodata where logo_id=:logo";
			doQuery($ask_update,['editedsitelogodata' => $editedsitelogodata, 'logo' => $logo]);
			?>
			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-success">
					<button type="button" class="close" data-dismiss="alert">x</button>
					<span>Logo saved!</span>
				</div>
			</div>
			<?php
		}
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
								<a class="nav-link" data-toggle="tab" href="#sitelogo">Logo</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#bbs">BBS</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#broken">Broken</a>
							</li>
						</ul>
						<div id="myTabContent" class="tab-content apt-1" style="background-color: #1a1a1a;">

							<?php
           					$admin_edit=true;
							include ("edit_colly.php");
							include ("edit_crew.php");
							include ("edit_artist.php");
							include ("admin_edit_user.php");
							include ("admin_edit_site_logo.php");
							include ("edit_bbs.php");
							include ("admin_edit_broken_collys.php");

							?>
						</div>
					</div>
				<?php } else { ?>
					<div class="bs-component">
						<div class="animate__animated animate__shakeX alert alert-dismissible alert-primary">
							<button type="button" class="close" data-dismiss="alert">x</button>
							<span>You need to be <a class="ascii" data-toggle="modal" style="padding-right: 8px;" href="#login">an admin</a>to use this feature.</span>
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
