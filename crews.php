<?php
	require_once "session.php";
	$h1 = "CREWS";
	require_once "header.php";
	require_once "pagination.php";

	$sort_by = $_GET[ 'sort_by' ] ?? "";
	switch ($sort_by) {
		case "members":
		case "releases":
			$sort_criteria = $sort_by;
			break;
		default:
			$sort_criteria = "name";
			$sort_by = "name";
			break;
	}

	$pageno = $_GET[ 'pageno' ] ?? 1;
	$rows_per_page = 138;
	$pagination = pagination("crews", $pageno, $rows_per_page, "&sort_by={$sort_by}");
	if (!isset($_POST[ "search" ])) {
		echo $pagination[ "pager" ];
	}
?>
	<div class="collys_search">
		<form action="?sort_by=<?=$sort_by?>" method="post">
			<label>Search for: <input type="text" name="search"></label>
		</form>
	</div>
<?php

	//-----------------------------------------------------------------------------
	// SHOW ARTISTS
	//-----------------------------------------------------------------------------

?>
	<div class="content_slim_divider"></div>
	<div class="row">
		<div class="artist_crew col-4">
			<a href="crews.php?sort_by=name">CREW</a>
		</div>
		<div class="artist_crew col-4">
			<a href="crews.php?sort_by=members">MEMBERS</a>
		</div>
		<div class="artist_crew col-4">
			<a href="crews.php?sort_by=releases">RELEASES</a>
		</div>
	</div>
<?php
	if (!isset($_POST[ 'search' ])) {
		$q = "SELECT crews.*, COUNT(member_of.nick) AS members FROM crews LEFT JOIN member_of ON crews.name = member_of.crew GROUP BY crews.name ORDER BY {$sort_by} ASC {$pagination["limit"]}";
		$p = [];
	} else {
		$searchquery = $_POST[ 'search' ];
		$q = "SELECT crews.*, COUNT(member_of.nick) AS members FROM crews LEFT JOIN member_of ON crews.name = member_of.crew WHERE MATCH(crews.name, crews.acronym) AGAINST (:searchquery IN BOOLEAN MODE) GROUP BY crews.name ORDER BY {$sort_by} ASC {$pagination["limit"]}";
		$p = [":searchquery" => $searchquery];
	}
	$crews = [];
	foreach (fetchAll($q, $p) as $row) {
		if (!array_key_exists($row->acronym, $crews)) {
			$crews[$row->acronym] = $row;
		}
	}
	foreach ($crews as $acronym => $crew) {
		$encoded_crew = base64_encode($crew->name);
		?>
		<div class="row">
			<div class="forum_nick col-4">
				<a href="info_crew.php?crew=<?=$encoded_crew?>"><?=$crew->name;?><?=($acronym) ? " (" . $acronym .")" : '' ?></a>
			</div>
			<div class="artist_crew col-4"><?=(int)$crew->members?></div>
			<div class="artist_crew col-4">N/A</div>
		</div>
		<?php
	}
	if (!isset($_POST[ "search" ])) {
		echo $pagination[ "pager" ];
	}
?>
	<div class="collys_search">
		<form action="?sort_by=<?=$sort_by?>" method="post">
			<label>Search for: <input type="text" name="search"></label>
		</form>
	</div>
<?php include "footer.php";
