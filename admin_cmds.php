<?php
	define("NO_PING", true);
	require_once "session.php";

	$cmd = $_GET[ "cmd" ] ?? $_current[ 0 ] ?? "";
	$reDir = "/";

	$is_ajax = (isset($_SERVER[ "HTTP_X_REQUESTED_WITH" ]) && $_SERVER[ "HTTP_X_REQUESTED_WITH" ] === "XMLHttpRequest") ?? false;

	if(is_admin()) {
		switch($cmd) {
      case "get_crew_bbs":
        $id = $_GET[ "id" ] ?? 0;
				$data = [];
        $bbses = fetchAll("SELECT bbs_of.id,bbs_of.name FROM bbs_of, crews where bbs_of.crew=crews.name and crews.id=:id",[":id" => $id]);
				foreach($bbses as $bbs) {
					$data[] = [
						"id" => (int)$bbs->id,
						"name" => $bbs->name,
					];
				}
				if(!empty($data)) {
					exit(json_out($data));
				}
        exit(json_out(["status" => false], 404));
      case "del_crew_bbs":
				if(!empty($_POST[ 'id' ])) {
					$id = (int)$_POST[ 'id' ];
					if($id && doQuery("DELETE FROM bbs_of WHERE id = :id", [":id" => $id])) {
						exit(json_out(["status" => true]));
					}
				}
				exit(json_out(["status" => false], 404));
      case "add_crew_bbs":        
        $response = 200;
				$data = [
					":crew" => $_POST[ "crew" ] ?? "",
					":name" => $_POST[ "bbs" ] ?? "",
				];
        $q = "INSERT INTO bbs_of (name, crew) VALUES (:name, :crew)";
				$response = 201;
				if(doQuery($q, $data)) {
					exit(json_out(["status" => true], $response));
				}
				exit(json_out(["status" => true], 400));            
      case "get_crew":
				$id = $_GET[ "id" ] ?? 0;
				$data = [];
				if($id) {
					$crews = fetchAll("SELECT * FROM crews WHERE id = :id", [":id" => $id]);
				} else {
					$crews = fetchAll("SELECT * FROM crews ORDER BY name");
				}
				foreach($crews as $crew) {
					$data[] = [
						"id" => (int)$crew->id,
						"name" => $crew->name,
						"acronym" => $crew->acronym,
						"contact" => $crew->contact,
						"crewurl" => $crew->crewurl,
						"rating" => $crew->rating,
            "www" => $crew->www,
            "active" => $crew->active,
					];
				}
				if(!empty($data)) {
					exit(json_out($data));
				}
				exit(json_out(["status" => false], 404));
      case "del_crew":
				if(!empty($_POST[ 'id' ])) {
					$id = (int)$_POST[ 'id' ];
					if($id && doQuery("DELETE FROM crews WHERE id = :id", [":id" => $id])) {
						exit(json_out(["status" => true]));
					}
				}
				exit(json_out(["status" => false], 404));
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
				} else {
					$q = "INSERT INTO crews (name, acronym, contact, crewurl, rating, www, active) VALUES (:name, :acronym, :contact, :crewurl, :rating, :www, :active)";
					$response = 201;
				}
				if(doQuery($q, $data)) {
					exit(json_out(["status" => true], $response));
				}
				exit(json_out(["status" => true], 400));      
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
