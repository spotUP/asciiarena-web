<?php defined('VALID') or die('Nuh-uh!');
//test
    error_reporting(-1);
    $env = parse_ini_file("/var/www/configs/asciiarena.env");

    $dbuser = @$env['DBUSER'] ?: 'spot';
    $dbpw   = @$env['DBPW']   ?: '';
    $dbhost = @$env['DBHOST'] ?: 'localhost';
    $dbname = @$env['DBNAME'] ?: 'uprough_ascii';

	$_db = new PDO("mysql:dbname={$dbname};host={$dbhost}", $dbuser, $dbpw,
		[PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    # Avoid errors like: GET /info_artist.php - Uncaught PDOException: SQLSTATE[42000]: Syntax error or access violation: 1055 Expression #23 of SELECT list is not in GROUP BY clause and contains nonaggregated column 'uprough_ascii.c.crew' which is not functionally dependent on columns in GROUP BY clause; this is incompatible with sql_mode=only_full_group_by in /projects/asciiarena/tools/db.php:55
    $_db->query("SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
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

    # The following two methods were previously used to escape values when inserting into DB. With placeholders they can be a noop.
    # When most files are migrated/fixed the actual method calls may be skipped, just returning value for now
    function cleanInsert($q = "") {
        return $q;
    }

    function cleanInsertPost($q = "") {
        return $q;
    }
