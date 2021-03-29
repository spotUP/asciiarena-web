<?php
require_once "session.php";
$h1 = "CREWS";
require_once "header.php";

?>
<div class="row">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2">
		<div class="row apl-1">
			<div class="col-12 d-flex justify-content-between">
				<?php
				require_once "pagination.php";

				$sort_by = $_GET[ 'sort_by' ] ?? "";
				switch ($sort_by) {
					case "members":
					case "releases":
					$sort_order = "DESC";
					break;
					default:
					$sort_order = "ASC";
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
				<form action="?sort_by=<?=$sort_by?>" method="post">
					<label>Search for: <input type="text" name="search"></label>
				</form>
			</div>
		</div>
		<?php

	//-----------------------------------------------------------------------------
	// SHOW CREWS
	//-----------------------------------------------------------------------------


		?>
		<div class="row amb-1">
			<div class="col-4">
				<a class="white" href="crews.php?sort_by=name">CREW</a>
			</div>
			<div class="col-3">
				<a class="white" href="crews.php?sort_by=members">MEMBERS</a>
			</div>
			<div class="col-3">
				<a class="white" href="crews.php?sort_by=releases">RELEASES</a>
			</div>
			<div class="col-2">
				<a class="white" href="crews.php?sort_by=releases">SCORE</a>
			</div>
		</div>
		<?php
		if (!isset($_POST[ 'search' ])) {
			$q = "SELECT crews.*, COUNT(member_of.nick) AS members FROM crews LEFT JOIN member_of ON crews.name = member_of.crew GROUP BY crews.name ORDER BY {$sort_by} {$sort_order} {$pagination["limit"]}";
			$p = [];
		} else {
			$searchquery = $_POST[ 'search' ];
			$q = "SELECT crews.*, COUNT(member_of.nick) AS members FROM crews LEFT JOIN member_of ON crews.name = member_of.crew WHERE MATCH(crews.name, crews.acronym) AGAINST (:searchquery IN BOOLEAN MODE) GROUP BY crews.name ORDER BY {$sort_by} {$sort_order} {$pagination["limit"]}";
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
				<div class="col-4">
					<a href="info_crew.php?crew=<?=$encoded_crew?>"><?=$crew->name;?><?=($acronym) ? " (" . $acronym .")" : '' ?></a>
				</div>
				<div class="col-3 green">
					<?=(int)$crew->members?>
				</div>
				<div class="magenta col-3 nolink">
					N/A
				</div>
				<div class="col-2">
					N/A
				</div>
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
	</div>
	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>
	<?php include "footer.php";
