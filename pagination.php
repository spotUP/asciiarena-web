<?php defined('VALID') or die('Nuh-uh!');

	function pagination($table = "", $pageno = 1, $perpage = 10, $additional = "") {
		if (empty($table)) {
			return ["pager" => "", "limit" => ""];
		}
		$query = "SELECT COUNT(*) total from {$table}";
		$numrows = fetchOne($query)->total;
		$lastpage = ceil($numrows / $perpage);
		if ($pageno > $lastpage) {
			$pageno = $lastpage;
		}
		if ($pageno < 1) {
			$pageno = 1;
		}
		$limit = 'LIMIT ' . ($pageno - 1) * $perpage . ',' . $perpage;
		ob_start();
		echo "<div class='row' style='margin-bottom: 16px; margin-top: 16px;'>";
		echo "<ul class='pagination'>";
		if ($pageno !== 1) {
			echo "<li class='page-item'><a class='page-link' href='?pageno=1&{$additional}'>FIRST</a></li>";
			$prevpage = $pageno - 1;
			echo "<li class='page-item'><a class='page-link' href='?pageno={$prevpage}&{$additional}'>PREV</a></li>";
		}
		echo " ( Page {$pageno} of {$lastpage} ) ";
		if ($pageno < $lastpage) {
			$nextpage = $pageno + 1;
			echo "<li class='page-item'> <a class='page-link' href='?pageno=$nextpage&{$additional}'>NEXT</a></li>";
			echo "<li class='page-item'> <a class='page-link' href='?pageno=$lastpage&{$additional}'>LAST</a></li>";
		}
		echo "</ul>";
		echo "</div>";

		$pagination = ob_get_contents();
		ob_end_clean();
		return ["pager" => $pagination, "limit" => $limit];
	}
