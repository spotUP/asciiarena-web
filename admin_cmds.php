<?php
	define("NO_PING", true);
	require_once "session.php";

	$cmd = $_GET[ "cmd" ] ?? $_current[ 0 ] ?? "";
	$reDir = "/";

	$is_ajax = (isset($_SERVER[ "HTTP_X_REQUESTED_WITH" ]) && $_SERVER[ "HTTP_X_REQUESTED_WITH" ] === "XMLHttpRequest") ?? false;

	if(is_admin()) {
		switch($cmd) {
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
