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
					<span class="amr-1">Search: <input type="text" name="search" autocomplete="off" value="<?=$searchquery?>"></span>
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
			$q = "SELECT a.nick,GROUP_CONCAT(m.crew) as crews FROM artists a LEFT JOIN member_of m on a.nick=m.nick GROUP BY a.id ORDER BY {$sort_by} ASC {$pagination["limit"]}";
			$p = [];
		} else {
			$searchquery = $_POST[ 'search' ];
			$q = "SELECT a.nick,GROUP_CONCAT(m.crew) as crews FROM artists a LEFT JOIN member_of m on a.nick=m.nick 
				  WHERE MATCH(a.nick) AGAINST (:searchquery IN BOOLEAN MODE) 
				    OR MATCH(m.crew) AGAINST (:searchquery IN BOOLEAN MODE)
				    OR a.nick LIKE :wcquery
				  GROUP BY a.id ORDER BY {$sort_by} ASC {$pagination["limit"]}";
			$p = [":searchquery" => $searchquery, ":wcquery" => '%'.$searchquery.'%'];
		}
		foreach (fetchAll($q, $p) as $row) {
			$artist = $row->nick;
			$crews = explode(',', $row->crews);
			$crews = array_map(function($crew) { return '<a href="/crew/'.urlsafe($crew).'">'.$crew.'</a>'; }, $crews);
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
