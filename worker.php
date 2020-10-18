<?php
	if ($_SERVER[ "REMOTE_ADDR" ] !== "77.53.224.247") {
		die();
	}
	set_time_limit(0);
	require_once "session.php";
	$collys = [];
	$values = [];
	foreach (fetchAll("SELECT a.*, b.nick FROM `artists_collys` a INNER JOIN artists b ON a.artist_id = b.id ORDER BY a.colly_id ASC, b.nick ASC") as $row) {
		if (!array_key_exists($row->colly_id, $collys)) {
			$collys[ $row->colly_id ] = ["artists" => [], "crews" => []];
		}
		$collys[ $row->colly_id ][ "artists" ][ $row->artist_id ] = $row->nick;
	}
	foreach (fetchAll("SELECT a.*, b.name FROM `collys_crews` a INNER JOIN crews b ON a.crew_id = b.id ORDER BY a.colly_id ASC, b.name ASC") as $row) {
		if (!array_key_exists($row->colly_id, $collys)) {
			$collys[ $row->colly_id ] = ["artists" => [], "crews" => []];
		}
		$collys[ $row->colly_id ][ "crews" ][ $row->crew_id ] = $row->name;
	}
	$params = [];
	foreach ($collys as $id => $colly) {
		if ($id >= 3500 && $id < 4000) {
			$params[] = [
				":id" => $id,
				":artists" => pluralize(array_values($colly[ "artists" ])),
				":artist_ids" => implode(",", array_keys($colly[ "artists" ])),
				":crews" => pluralize(array_values($colly[ "crews" ])),
				":crew_ids" => implode(",", array_keys($colly[ "crews" ])),
			];
		}
	}
	foreach ($params as $param) {
		echo "{$param[":id"]}: ";
		var_dump(doQuery("UPDATE collys SET artists = :artists, artist_ids = :artist_ids, crews = :crews, crew_ids = :crew_ids WHERE id = :id", $param));
	}
//	print_r($params);
	die();
	if (!empty($values)) {
		$start = 0;
		$end = count($values);
		$chunk = 20;
		$pages = ceil($end / $chunk);
		for ($i = 0; $i < $pages; $i++) {
			$q = "INSERT INTO artists_collys (artist_id, colly_id)\nVALUES\n\t" . implode(", ", array_slice($values, ($i * $chunk), $chunk)) . ";";
			echo $q . PHP_EOL;
//			echo $i . ": " . $q . PHP_EOL;
//			doQuery($q);
		}
//		$q = "INSERT INTO artists_collys (artist_id, colly_id)\nVALUES\n\t" . implode(",\n\t", $values) . ";";
//		echo $q;
//		doQuery();
	}
