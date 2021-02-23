<?php defined('VALID') or die('Nuh-uh!');
	$_db = new PDO("mysql:dbname=uprough_ascii;host=srv-captain--mariadb-db", "root", getenv('DBPW'),
		[PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
	$_queries = [];
	if (DEBUG) {
		doQuery("SET profiling = 1");
	}

	function dbgDump($stmt) {
		global $_queries;
		ob_start();
		$stmt->debugDumpParams();
		$_queries[] = [ob_get_contents(), $stmt->errorInfo()];
		ob_end_clean();
	}

	function doQuery($q = "", $binds = []) {
		global $_db, $_queries;
		if ($stmt = $_db->prepare($q)) {
			$status = $stmt->execute($binds);
			if (DEBUG) {
				dbgDump($stmt);
			}
			return $status;
		}
		return false;
	}

	function fetchOne($q = "", $binds = [], $unset = []) {
		global $_db;

		$hasLimit = stripos($q, "LIMIT");
		if ($hasLimit === false) {
			$q .= " LIMIT 1";
		}
		if ($stmt = $_db->prepare($q)) {
			$stmt->execute($binds);
			if (DEBUG) {
				dbgDump($stmt);
			}
			$obj = $stmt->fetch(PDO::FETCH_OBJ);
			if (!empty($unset)) {
				foreach ($unset as $prop) {
					unset($obj->$prop);
				}
			}
			return $obj;
		}
		return false;
	}

	function fetchAll($q = "", $binds = []) {
		global $_db;
		if ($stmt = $_db->prepare($q)) {
			$stmt->execute($binds);
			if (DEBUG) {
				dbgDump($stmt);
			}
			return $stmt->fetchAll(PDO::FETCH_OBJ);
		}
		return false;
	}
