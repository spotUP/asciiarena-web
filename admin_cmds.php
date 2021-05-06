<?php
	define("NO_PING", true);
	require_once "session.php";

	$cmd = $_GET[ "cmd" ] ?? $_current[ 0 ] ?? "";
	$reDir = "/";

	$is_ajax = (isset($_SERVER[ "HTTP_X_REQUESTED_WITH" ]) && $_SERVER[ "HTTP_X_REQUESTED_WITH" ] === "XMLHttpRequest") ?? false;

	if(is_admin()) {
		switch($cmd) {
			case "get_colly":
				$id = $_GET[ "id" ] ?? 0;
				$data = [];
				if($id) {
					$collys = fetchAll("SELECT * FROM collys WHERE id = :id", [":id" => $id]);
				} else {
					$collys = fetchAll("SELECT * FROM collys ORDER BY name");
				}
				foreach($collys as $colly) {
          				$crewdata = [];
          				$artistdata = [];
					if($id) {
						$crews = fetchAll("SELECT collys_crews.id,crews.name FROM collys_crews, crews where crews.id = collys_crews.crew_id and collys_crews.colly_id=:id",[":id" => $colly->id]);
						foreach($crews as $crew) {
							$crewdata[] = [
								"id" => (int)$crew->id,
								"name" => $crew->name,
							];
						}
            
            					$artists = fetchAll("SELECT artists_collys.id,artists.nick FROM artists_collys, artists where artists.id = artists_collys.artist_id and artists_collys.colly_id=:id",[":id" => $colly->id]);
						foreach($artists as $artist) {
							$artistdata[] = [
								"id" => (int)$artist->id,
								"nick" => $artist->nick,
							];
						}
					}
          
					$data[] = [
						"id" => (int)$colly->id,
						"name" => $colly->name,
            					"filename" => $colly->filename,
						"year" => $colly->year,
						"month" => $colly->month,
						"day" => $colly->day,
						"type" => $colly->type,
						"diz" => $colly->file_id,
            					"crews" => $crewdata,
            					"artists" => $artistdata,
					];
				}
				if(!empty($data)) {
					exit(json_out($data));
				}
				exit(json_out(["status" => false], 404));
			case "save_colly":
				$response = 200;
				$data = [
          				":name" => $_POST[ "name" ] ?? "",
					":filename" => $_POST[ "filename" ] ?? "",
					":year" => $_POST[ "year" ] ?? 1900,
					":month" => $_POST[ "month" ] ?? 1,
					":day" => $_POST[ "day" ] ?? 1,
					":type" => $_POST[ "type" ] ?? "",
					":file_id" => $_POST[ "diz" ] ?? "",
				];
				if(!empty($_POST[ "id" ])) {
					$q = "UPDATE collys SET name = :name, filename = :filename, year = :year, month = :month, day = :day, type = :type, file_id = :file_id WHERE id = :id";
					$data[ ":id" ] = $_POST[ "id" ];
          $id = $_POST[ "id" ];
          $collyid = $id;
				} else {
					$q = "INSERT INTO collys (name, filename, year, month, day, type, file_id) VALUES (:name, :filename, :year, :month, :day, :type, :file_id)";
          $id = "";
					$response = 201;
				}
        
        if(!doQuery($q, $data)) {
					exit(json_out(["status" => true], 400));     
				}

        if (empty($id)) {
          $rowInserted = fetchOne("SELECT LAST_INSERT_ID() rowid");
          $collyid = $rowInserted->rowid;
        }
  
        if (!empty($id)) {
					if(!doQuery("UPDATE collys_crews SET updated='Y' WHERE colly_id = :id", [":id" => $id]))
					{
						exit(json_out(["status" => true], 400));     
					}
        }
        
				$crewnames = $_POST[ "crewname" ] ?? "";     
				
				if(!empty($crewnames)) {
					foreach($crewnames as $crewname) {
						$q = "INSERT INTO collys_crews (colly_id,crew_id) select :colly_id, id from crews where name = :name and (select count(*) from collys_crews where colly_id = :colly_id and crew_id = crews.id)=0";
						$data = [
							":colly_id" => $collyid,
							":name" => $crewname
							
						];
						if(!doQuery($q, $data)) {
							exit(json_out(["status" => true], 400));     
						}

						$q = "UPDATE collys_crews SET updated = null where colly_id = :colly_id and crew_id = (select id from crews where name = :name)";
						if(!doQuery($q, $data)) {
							exit(json_out(["status" => true], 400));     
						}
					}
				}
				
				if (!empty($id)) {
					if(!doQuery("DELETE FROM collys_crews WHERE updated='Y' AND colly_id = :id", [":id" => $id])) {
						exit(json_out(["status" => true], 400));     
					}
				}
					
        if (!empty($id)) {
					if(!doQuery("UPDATE artists_collys SET updated='Y' WHERE colly_id = :id", [":id" => $id]))
					{
						exit(json_out(["status" => true], 400));     
					}
				}
        
				$artistnames = $_POST[ "artistname" ] ?? "";     
				
				if(!empty($artistnames)) {
					foreach($artistnames as $artistname) {
						$q = "INSERT INTO artists_collys (colly_id,artist_id) select :colly_id, id from artists where nick = :nick and (select count(*) from artists_collys where colly_id = :colly_id and artist_id = artists.id)=0";
						$data = [
							":colly_id" => $collyid,
							":nick" => $artistname
							
						];
						if(!doQuery($q, $data)) {
							exit(json_out(["status" => true], 400));     
						}

						$q = "UPDATE artists_collys SET updated = null where colly_id = :colly_id and artist_id = (select id from artists where nick = :nick)";
						if(!doQuery($q, $data)) {
							exit(json_out(["status" => true], 400));     
						}
					}
				}
				
				if (!empty($id)) {
					if(!doQuery("DELETE FROM artists_collys WHERE updated='Y' AND colly_id = :id", [":id" => $id])) {
						exit(json_out(["status" => true], 400));     
					}
				}
					
				exit(json_out(["status" => true], $response));
        
			case "del_colly":
        if(!empty($_POST[ 'id' ])) {
					$id = (int)$_POST[ 'id' ];
					if($id) {
						if (!doQuery("DELETE FROM artists_collys WHERE colly_id = :id", [":id" => $id])) {
							exit(json_out(["status" => false], 400));
						}
							
						if (!doQuery("DELETE FROM collys_crews WHERE colly_id = :id", [":id" => $id])) {
							exit(json_out(["status" => false], 400));
						}

						if (!doQuery("DELETE FROM collys WHERE id = :id", [":id" => $id])) {
							exit(json_out(["status" => false], 404));
						}
					}
				}
				exit(json_out(["status" => true]));  
			case "get_logo":
				$id = $_GET[ "id" ] ?? 0;
				$data = [];
				if($id) {
					$logos = fetchAll("SELECT * FROM logos WHERE logo_id = :id", [":id" => $id]);
				} else {
					$logos = fetchAll("SELECT * FROM logos ORDER BY logo_id");
				}
				foreach($logos as $logo) {
					$data[] = [
						"id" => (int)$logo->logo_id,
						"author" => $logo->author,
						"ascii" => $logo->ascii,
					];
				}
				if(!empty($data)) {
					exit(json_out($data));
				}
				exit(json_out(["status" => false], 404));
			case "del_logo":
				if(!empty($_POST[ 'id' ])) {
					$id = (int)$_POST[ 'id' ];
					if($id && doQuery("DELETE FROM logos WHERE logo_id = :id", [":id" => $id])) {
						exit(json_out(["status" => true]));
					}
				}
				exit(json_out(["status" => false], 404));   
			case "save_logo":
				$response = 200;
				$data = [
					":author" => $_POST[ "author" ] ?? "",
					":ascii" => $_POST[ "ascii" ] ?? "",
				];
				if(!empty($_POST[ "id" ])) {
					$q = "UPDATE logos SET author = :author, ascii = :ascii WHERE logo_id = :id";
					$data[ ":id" ] = $_POST[ "id" ];
				} else {
					$q = "INSERT INTO logos (author, ascii) VALUES (:author, :ascii)";
					$response = 201;
				}
				if(doQuery($q, $data)) {
					exit(json_out(["status" => true], $response));
				}
				exit(json_out(["status" => true], 400));           
			case "get_user":
				$id = $_GET[ "id" ] ?? 0;
				$data = [];
				if($id) {
					$users = fetchAll("SELECT * FROM users WHERE id = :id", [":id" => $id]);
				} else {
					$users = fetchAll("SELECT * FROM users ORDER BY nick");
				}
				foreach($users as $user) {
					$data[] = [
						"id" => (int)$user->id,
						"nick" => $user->nick,
						"rank" => $user->rank,
						"crew" => $user->crew,
						"byear" => $user->byear,
						"bmonth" => $user->bmonth,
						"bday" => $user->bday,
						"country" => $user->country,
						"mail" => $user->mail,
					];
				}
				if(!empty($data)) {
					exit(json_out($data));
				}
				exit(json_out(["status" => false], 404));
			case "del_user":
				if(!empty($_POST[ 'id' ])) {
					$id = (int)$_POST[ 'id' ];
					if($id && doQuery("DELETE FROM users WHERE id = :id", [":id" => $id])) {
						exit(json_out(["status" => true]));
					}
				}
				exit(json_out(["status" => false], 404));   
			case "save_user":
				$response = 200;
				$data = [
					":nick" => $_POST[ "nick" ] ?? "",
					":rank" => $_POST[ "rank" ] ?? "",
					":crew" => $_POST[ "crew" ] ?? "",
					":byear" => $_POST[ "byear" ] ?? null,
					":bmonth" => $_POST[ "bmonth" ] ?? null,
					":bday" => $_POST[ "bday" ] ?? null,
					":country" => $_POST[ "country" ] ?? "",
					":mail" => $_POST[ "mail" ] ?? "",
				];
				if(!empty($_POST[ "id" ])) {
					$q = "UPDATE users SET nick = :nick, rank = :rank, crew = :crew, byear = :byear, bmonth = :bmonth, bday = :bday, country = :country, mail = :mail WHERE id = :id";
					$data[ ":id" ] = $_POST[ "id" ];
				} else {
					$q = "INSERT INTO users (nick, rank, crew, byear, bmonth, bday, country, mail) VALUES (:nick, :rank, :crew, :byear, :bmonth, :bday, :country, :mail)";
					$response = 201;
				}
				if(doQuery($q, $data)) {
					exit(json_out(["status" => true], $response));
				}
				exit(json_out(["status" => true], 400));        
			case "get_artist":
				$id = $_GET[ "id" ] ?? 0;
				$data = [];
				if($id) {
					$artists = fetchAll("SELECT * FROM artists WHERE id = :id", [":id" => $id]);
				} else {
					$artists = fetchAll("SELECT * FROM artists ORDER BY nick");
				}
				foreach($artists as $artist) {
					$crewdata = [];
					if($id) {
						$crews = fetchAll("SELECT member_of.id,member_of.crew FROM member_of, artists where member_of.nick=artists.nick and artists.id=:id",[":id" => $artist->id]);
						foreach($crews as $crew) {
							$crewdata[] = [
								"id" => (int)$crew->id,
								"name" => $crew->crew,
							];
						}
					}
					$data[] = [
						"id" => (int)$artist->id,
						"nick" => $artist->nick,
						"acronym" => $artist->acronym,
						"www" => $artist->www,
						"country" => $artist->country,
						"active" => $artist->active,
						"crews" => $crewdata
					];
				}
				if(!empty($data)) {
					exit(json_out($data));
				}
				exit(json_out(["status" => false], 404));
			case "del_artist":
				if(!empty($_POST[ 'id' ])) {
					$id = (int)$_POST[ 'id' ];
					if($id) {
						if (!doQuery("DELETE FROM member_of WHERE nick = (select nick from artists where id = :id)", [":id" => $id])) {
							exit(json_out(["status" => false], 400));
						}
							
						if (!doQuery("DELETE FROM artists WHERE id = :id", [":id" => $id])) {
							exit(json_out(["status" => false], 404));
						}
					}
				}
				exit(json_out(["status" => true]));      
			case "save_artist":
				$response = 200;
				$data = [
					":nick" => $_POST[ "nick" ] ?? "",
					":acronym" => $_POST[ "acronym" ] ?? "",
					":www" => $_POST[ "www" ] ?? "",
					":country" => $_POST[ "country" ] ?? "",
					":active" => $_POST[ "active" ] ?? "",
				];
				if(!empty($_POST[ "id" ])) {
					$q = "UPDATE artists SET nick = :nick, acronym = :acronym, www = :www, active = :active, country = :country WHERE id = :id";
					$data[ ":id" ] = $_POST[ "id" ];
					$id = $_POST[ "id" ];
				} else {
					$q = "INSERT INTO artists (nick, acronym, www, active, country) VALUES (:nick, :acronym, :www, :active, :country)";
					$response = 201;
					$id = "";
				}
				if(!doQuery($q, $data)) {
					exit(json_out(["status" => true], 400));  
				}
				
				if (!empty($id)) {
					if(!doQuery("UPDATE member_of SET updated='Y' WHERE nick = (select nick from artists where id = :id)", [":id" => $id]))
					{
						exit(json_out(["status" => true], 400));     
					}
				}
				
				$crewnames = $_POST[ "crewname" ] ?? "";     
				
				if(!empty($crewnames)) {
					foreach($crewnames as $crewname) {
						$q = "INSERT INTO member_of (crew,nick) select :crew, :nick where (select count(*) from member_of where crew = :crew and nick = :nick)=0";
						$data = [
							":crew" => $crewname ?? "",
							":nick" => $_POST[ "nick" ] ?? ""
							
						];
						if(!doQuery($q, $data)) {
							exit(json_out(["status" => true], 400));     
						}

						$q = "UPDATE member_of SET updated = null where crew = :crew and nick = :nick";
						if(!doQuery($q, $data)) {
							exit(json_out(["status" => true], 400));     
						}
					}
				}
				
				if (!empty($id)) {
					if(!doQuery("DELETE FROM member_of WHERE updated='Y' AND nick = (select nick from artists where id = :id)", [":id" => $id])) {
						exit(json_out(["status" => true], 400));     
					}
				}
					
				exit(json_out(["status" => true], $response));
			case "get_crew":
				$id = $_GET[ "id" ] ?? 0;
				$data = [];
				if($id) {
					$crews = fetchAll("SELECT * FROM crews WHERE id = :id", [":id" => $id]);
				} else {
					$crews = fetchAll("SELECT * FROM crews ORDER BY name");
				}
				foreach($crews as $crew) {
					$bbsdata = [];
					if($id) {
						$bbses = fetchAll("SELECT bbs_of.id,bbs_of.name FROM bbs_of, crews where bbs_of.crew=crews.name and crews.id=:id",[":id" => $crew->id]);
						foreach($bbses as $bbs) {
							$bbsdata[] = [
								"id" => (int)$bbs->id,
								"name" => $bbs->name,
							];
						}
					}
					$data[] = [
						"id" => (int)$crew->id,
						"name" => $crew->name,
						"acronym" => $crew->acronym,
						"contact" => $crew->contact,
						"crewurl" => $crew->crewurl,
						"rating" => $crew->rating,
						"www" => $crew->www,
						"active" => $crew->active,
						"bbses" => $bbsdata
					];
				}
				if(!empty($data)) {
					exit(json_out($data));
				}
				exit(json_out(["status" => false], 404));
			case "del_crew":
				if(!empty($_POST[ 'id' ])) {
					$id = (int)$_POST[ 'id' ];
					if($id) {
						if (!doQuery("DELETE FROM bbs_of WHERE crew = (select crew from crews where id = :id)", [":id" => $id])) {
							exit(json_out(["status" => false], 400));
						}
						if (!doQuery("DELETE FROM crews WHERE id = :id", [":id" => $id])) {
							exit(json_out(["status" => false], 404));
						}
					}
				}
				exit(json_out(["status" => true]));
			case "save_crew":
				$response = 200;
				$data = [
					":name" => $_POST[ "name" ] ?? "",
					":acronym" => $_POST[ "acronym" ] ?? "",
					":contact" => $_POST[ "contact" ] ?? "",
					":crewurl" => $_POST[ "crewurl" ] ?? "",
					":rating" => $_POST[ "rating" ] ?? "",
					":www" => $_POST[ "www" ] ?? "",
					":active" => $_POST[ "active" ] ?? "",
				];
				if(!empty($_POST[ "id" ])) {
					$q = "UPDATE crews SET name = :name, acronym = :acronym, contact = :contact, crewurl = :crewurl, rating = :rating, www = :www, active = :active WHERE id = :id";
					$data[ ":id" ] = $_POST[ "id" ];
					$id = $_POST[ "id" ];
				} else {
					$q = "INSERT INTO crews (name, acronym, contact, crewurl, rating, www, active) VALUES (:name, :acronym, :contact, :crewurl, :rating, :www, :active)";
					$response = 201;
					$id = "";
				}
				if(!doQuery($q, $data)) {
					exit(json_out(["status" => true], 400));     
				}

				if (!empty($id)) {
					if(!doQuery("UPDATE bbs_of SET updated='Y' WHERE crew = (select name from crews where id = :id)", [":id" => $id]))
					{
						exit(json_out(["status" => true], 400));     
					}
				}
				
				$bbsnames = $_POST[ "bbsname" ] ?? "";     
				
				if(!empty($bbsnames)) {
					foreach($bbsnames as $bbsname) {
						$q = "INSERT INTO bbs_of (name,crew) select :name, :crew where (select count(*) from bbs_of where name = :name and crew = :crew)=0";
						$data = [
							":name" => $bbsname ?? "",
							":crew" => $_POST[ "name" ] ?? ""
						];
						if(!doQuery($q, $data)) {
							exit(json_out(["status" => true], 400));     
						}

						$q = "UPDATE bbs_of SET updated = null where name = :name and crew = :crew";
						if(!doQuery($q, $data)) {
							exit(json_out(["status" => true], 400));     
						}
					}
				}

				if (!empty($id)) {
					if(!doQuery("DELETE FROM bbs_of WHERE updated='Y' AND crew = (select name from crews where id = :id)", [":id" => $id])) {
						exit(json_out(["status" => true], 400));     
					}
				}
					
				exit(json_out(["status" => true], $response));
				
			case "get_bbs":
				$id = $_GET[ "id" ] ?? 0;
				$data = [];
				if($id) {
					$bbses = fetchAll("SELECT * FROM bbses WHERE id = :id", [":id" => $id]);
				} else {
					$bbses = fetchAll("SELECT * FROM bbses ORDER BY name");
				}
				foreach($bbses as $bbs) {
					$data[] = [
						"id" => (int)$bbs->id,
						"name" => $bbs->name,
						"sysop" => $bbs->sysop,
						"address" => $bbs->address,
						"number" => $bbs->number,
					];
				}
				if(!empty($data)) {
					exit(json_out($data));
				}
				exit(json_out(["status" => false], 404));
			case "del_bbs":
				if(!empty($_POST[ 'id' ])) {
					$id = (int)$_POST[ 'id' ];
					if($id && doQuery("DELETE FROM bbses WHERE id = :id", [":id" => $id])) {
						exit(json_out(["status" => true]));
					}
				}
				exit(json_out(["status" => false], 404));
			case "save_bbs":
				$response = 200;
				$data = [
					":name" => $_POST[ "name" ] ?? "",
					":address" => $_POST[ "address" ] ?? "",
					":sysop" => $_POST[ "sysop" ] ?? "",
					":number" => $_POST[ "number" ] ?? "",
				];
				if(!empty($_POST[ "id" ])) {
					$q = "UPDATE bbses SET name = :name, address = :address, sysop = :sysop, number = :number WHERE id = :id";
					$data[ ":id" ] = $_POST[ "id" ];
				} else {
					$q = "INSERT INTO bbses (name, address, sysop, number) VALUES (:name, :address, :sysop, :number)";
					$response = 201;
				}
				if(doQuery($q, $data)) {
					exit(json_out(["status" => true], $response));
				}
				exit(json_out(["status" => true], 400));
			default:
				if($is_ajax) {
					exit(json_out(["status" => false], 404));
				}
				break;
		}
	}
	header("Location: {$reDir}");
