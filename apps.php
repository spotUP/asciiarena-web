<?php
require_once "session.php";
$h1 = "aPPLiCATiONS";

$is_search = isset($_POST['search']);
$searchquery = $_POST[ 'search' ] ?? "";
if(strlen($searchquery) < 3) unset($is_search);
$viewmode = $_GET[ 'viewmode' ] ?? "Standard";

$sort_order = strtolower($_GET['sort_order']) ?? "";
switch ($sort_order) {
	case "desc": $sort_order = 'DESC'; $osort_order = 'asc'; break;
	default: $sort_order = 'ASC'; $osort_order = 'desc'; break;
}
$sort_by = $_GET['sort_by'] ?? "";
switch ($sort_by) {
        case "name": $sort_criteria = "name"; break;
        case "filename": $sort_criteria = "filename"; break;
        case "release": $sort_criteria = "filedate"; break;
        case "author": $sort_criteria = "author"; break;
        case "uploader": $sort_criteria = "uploader"; break;
        default:
                $sort_criteria = "name";
                $sort_by = "name";
                break;
}
$sort_criteria .= ' '.$sort_order;

require_once "header.php"; ?>

<div id="blacker"></div>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
                <div class="row apl-1 apb-1">
                        <div class="col-12 d-flex justify-content-between">
			<?php
			require_once "pagination.php";
			$limit = "LIMIT 30";
        		$pageno = $_GET[ 'pageno' ] ?? 1;
        		$rows_per_page = ($viewmode === "BBS") ? 6 : 30;
        		$pagination = pagination("apps", $pageno, $rows_per_page, "viewmode={$viewmode}&sort_by={$sort_by}&sort_order={$sort_order}");
    
        		if (!$is_search) {
        			echo $pagination[ "pager" ];
        		}
        		?>
                                <div class="row">
                                        <div class="col-12">
                                                <div class="btn-group" role="group" aria-label="Button group with nested dropdown">
                                                        <div class="btn-group" role="group">
                                                                <button id="btnGroupDrop1" type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">View Mode:</button>
                                                                <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
                                                                        <a class="dropdown-item" href="apps.php?sort_by=releasemonth&viewmode=Standard">Standard</a>
                                                                        <a class="dropdown-item" href="apps.php?sort_by=releasemonth&viewmode=BBS">BBS</a>
                                                                </div>
								<form action="?sort_by=<?=$sort_criteria?>&sort_order=<?=$sort_order?>&viewmode=<?=$viewmode?>" method="post">
                                                                        <span class="amr-1 d-none d-sm-block">Search: <input type="text" name="search" style="background-color: #555 !important;" value="<?=$searchquery?>"></span>
                                                                </form>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
        		</div>

        		<div class="row">
        			<div class="col-12">
                			<span class="green">- --/\-\/- -</span><span class="cyan">aSCIIaRENA</span> <span class="red">--=*=-- </span><span class="pink"><?=date("D")?>, the <?=date("d-m-y")?>]</span><span class="red"> --=*=-- </span> <span class="cyan">aSCIIaRENA</span> <span class="green"> - -/\-\/- -- -</span>
                		</div>
			</div>
			
			<?php
			if ($is_search) {
				$ask = "SELECT * FROM apps 
					WHERE name LIKE '%:searchquery%'
						OR filename LIKE '%:searchquery%'
					{$limit}";
				$rows = fetchAll($ask, [":searchquery" => $searchquery]);
			} else {
				$ask = "SELECT * FROM apps {$limit}";
				$rows = fetchAll($ask);
			}

			if ($viewmode === "BBS") {

			} else {
				?>
                                <div class="row amb-1" style="width: 100%">
                                        <div class="col-2 col-sm-4"><span class="white">FILENAME</span></div>
                                        <div class="col-2 col-sm-4"><span class="white">NAME</span></div>
                                        <div class="col-2 col-sm-4"><span class="white">AUTHOR</span></div>
                                </div>
				<?php
				foreach ($rows as $row) {
					?>
                                        <!--div class="row">
                                                <div class="col-8 col-sm-4 text-truncate">
                                                        <a class="magenta" href="/application/<?=$row->filename?>"><?=$row->filename?></a>
                                                </div>
                                                <div class="col-8 col-sm-4 text-truncate">
                                                        <a class="magenta" href="/application/<?=$row->filename?>"><?=$row->name?></a>
                                                <div class="col-4 col-sm-4 green">
                                                        <span class="yellow"><?=combinize($row->artists, $row->artists, "/artist/", $row->artists)?></span>
                                                </div>
                                                <div class="col-4 col-sm-4 yellow text-truncate d-none d-sm-block">
                                                        <span class="yellow"><?=combinize($row->crews, $row->crews, "/crew/", $row->crews)?></span>
                                                </div>
                                        </div-->
                                        <?php
				}
			}
			?>
		</div>
	</div>

	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include('sidebar.php'); ?>
	</div>

	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include('sidebar_right.php'); ?>
	</div>
</div>
</div>
<?php include('footer.php'); ?>
