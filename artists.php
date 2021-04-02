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

?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2">
		<div class="row apl-1">
			<div class="col-12 d-flex justify-content-between">
				<?php
				$pageno = $_GET[ 'pageno' ] ?? 1;
				$rows_per_page = 138;
				$pagination = pagination("artists", $pageno, $rows_per_page, "&sort_by={$sort_by}");
				if (!isset($_POST[ "search" ])) {
					echo $pagination[ "pager" ];
				}
				?>				
				<div>
					<form action="?sort_by=<?=$sort_by?>" method="post">
						<label>Search for: <input type="text" name="search"></label>
					</form>
				</div>
			</div>
		</div>
		<?php
		//-----------------------------------------------------------------------------
		// SHOW ARTISTS
		//-----------------------------------------------------------------------------
		?>

		<div class="row amb-1 amt-1">
			<div class="col-2">
				<a class="white" href="artists.php?sort_by=nick">ARTiST</a>
			</div>
			<div class="col-10">
				<a class="white" href="artists.php?sort_by=crew">CREW</a>
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
				$artists[ $row->nick ][] = "<a href=\"/crew/" . urlsafe($row->crew) . "\">{$row->crew}</a>";
			}
		}
		foreach ($artists as $artist => $crews) {
			?>
			<div class="row">
				<div class="forum_nick col-2">
					<a href="/artist/<?=urlsafe($artist)?>"><?=$artist?></a>
				</div>
				<div class="artist_crew col-10"><?=pluralize($crews)?></div>
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
