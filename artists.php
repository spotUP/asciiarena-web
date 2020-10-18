<?php
	require_once "session.php";
	$h1 = "ARTISTS";
	require_once "header.php";
	require_once "pagination.php";

	$sort_by = $_GET[ 'sort_by' ] ?? "";
	switch ($sort_by) {
		case "crew":
		case "nick":
			$sort_criteria = $sort_by;
			break;
		default:
			$sort_criteria = "nick";
			$sort_by = "nick";
			break;
	}

	$pageno = $_GET[ 'pageno' ] ?? 1;
	$rows_per_page = 138;
	$pagination = pagination("artists", $pageno, $rows_per_page, "&sort_by={$sort_by}");
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
		<div class="forum_nick col-2">
			<a href="artists.php?sort_by=nick">ARTiST</a>
		</div>
		<div class="artist_crew col-10">
			<a href="artists.php?sort_by=crew">CREW</a>
		</div>
	</div>
<?php
	if (!isset($_POST[ 'search' ])) {
		$q = "SELECT * FROM member_of ORDER BY {$sort_by} ASC {$pagination["limit"]}";
		$p = [];
	} else {
		$searchquery = $_POST[ 'search' ];
		$q = "SELECT * FROM member_of WHERE MATCH(nick, crew) AGAINST (:searchquery IN BOOLEAN MODE) ORDER BY {$sort_by} ASC {$pagination["limit"]}";
		$p = [":searchquery" => $searchquery];
	}
	$artists = [];
	foreach (fetchAll($q, $p) as $row) {
		if (!array_key_exists($row->nick, $artists)) {
			$artists[ $row->nick ] = [];
		}
		if (!in_array($row->crew, $artists[ $row->nick ], true)) {
			$artists[ $row->nick ][] = "<a href=\"info_crew.php?" . base64_encode($row->crew) . "\">{$row->crew}</a>";
		}
	}
	foreach ($artists as $artist => $crews) {
		$encoded_artist = base64_encode($artist);
		?>
		<div class="row">
			<div class="forum_nick col-2">
				<a href="info_artist.php?artist=<?=$encoded_artist?>&sort_by=filename"><?=$artist?></a>
			</div>
			<div class="artist_crew col-10"><?=pluralize($crews)?></div>
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
