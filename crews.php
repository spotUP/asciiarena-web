<?php
require_once "session.php";
$h1 = "CREWS";
require_once "header.php";
$searchquery = $_POST[ 'search' ] ?? "";

?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2">
		<div class="row apl-1 apb-1">
			<div class="col-12 d-flex justify-content-between">
				<?php
				require_once "pagination.php";

				$sort_by = $_GET[ 'sort_by' ] ?? "";
				switch ($sort_by) {
					case "members":
					case "releases":
					case "rating":
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
				<div class="col-6 d-none d-sm-block">
					<form action="?sort_by=<?=$sort_by?>" method="post">
							<span class="amr-1 ">Search: <input type="text" name="search" value="<?=$searchquery?>"></span>
					</form>
				</div>
				<div class="row">
					<div class="col-12 block d-sm-none">
						<form action="?sort_by=<?=$sort_by?>" method="post">
							<span class="amr-1 ">Search: <input type="text" name="search" value="<?=$searchquery?>"></span>
						</form>
					</div>
				</div>
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
				<a class="white" href="crews.php?sort_by=rating">SCORE</a>
			</div>
		</div>
		<?php
		if (!isset($_POST[ 'search' ])) {
			$q = "SELECT crews.*, 
			(SELECT COUNT(colly_id) FROM collys_crews WHERE crew_id = crews.id) AS releases, 
			(SELECT COUNT(nick) FROM member_of WHERE crew = crews.name) AS members 
			FROM crews ORDER BY {$sort_by} {$sort_order} {$pagination["limit"]}";
			$p = [];
		} else {
			$searchquery = $_POST[ 'search' ];
			$q = "SELECT crews.*, 
			(SELECT COUNT(colly_id) FROM collys_crews WHERE crew_id = crews.id) AS releases, 
			(SELECT COUNT(nick) FROM member_of WHERE crew = crews.name) AS members 
			FROM crews 
			WHERE MATCH(crews.name, crews.acronym) AGAINST (:searchquery IN BOOLEAN MODE)
			ORDER BY {$sort_by} {$sort_order} {$pagination["limit"]}";
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
				<div class="col-4 text-truncate">
					<a href="/crew/<?=urlsafe($crew->name)?>"><?=$crew->name;?><?=($acronym) ? " (" . $acronym .")" : '' ?></a>
				</div>
				<div class="col-3 green">
					<?=(int)$crew->members?>
				</div>
				<div class="magenta col-3 nolink">
					<?=(int)$crew->releases?>
				</div>
				<div class="col-2">
					<?=(int)$crew->rating !== 0 ? sprintf("%0.2f", $crew->rating) : ''?>
				</div>
			</div>
			<?php
		}
		?>
		<div class="row apl-1 apt-1">
			<div class="col-12">
				<?php
				if (!isset($_POST[ "search" ])) {
					echo $pagination[ "pager" ];
				}
				?>
			</div>
		</div>
	</div>
	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>
	<?php include "footer.php";
