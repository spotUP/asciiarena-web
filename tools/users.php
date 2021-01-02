<?php defined('VALID') or die('Nuh-uh!');

	function is_admin() {
		global $_user;
		return ($_user[ "rank" ] === "Admin");
	}

	function is_logged_in() {
		global $_user;
		return ($_user[ "id" ] > 0);
	}

	function valid_current() {
		$invalids = ["map", "js", "css"];
		$current = $_SERVER[ "REQUEST_URI" ] ?? "";
		if (!empty($current)) {
			$arr = explode(".", $current);
			return !in_array(array_pop($arr), $invalids, true);
		}
		return true;
	}
