<?php
require_once "session.php";
$h1 = "COLLYS";

$is_search = (isset($_POST['search'])) ? true : false;
$searchquery = $_POST['search'] ?? "";
if(strlen($searchquery) < 3) $is_search = false;
$searchquery = preg_replace('/[^A-Za-z0-9\s\.-]/', '', $searchquery);
$viewmode = $_GET['viewmode'] ?? "Standard";

$sort_order = (isset($_GET['sort_order'])) ? strtolower($_GET['sort_order']) : "";
switch ($sort_order) {
	case "desc": $sort_order = 'DESC'; $osort_order = 'asc'; break;
	default: $sort_order = 'ASC'; $osort_order = 'desc'; break;
}
$sort_by = $_GET['sort_by'] ?? "";
switch ($sort_by) {
	case "name": $sort_criteria = "c.name"; break;
	case "filename": $sort_criteria = "filename"; break;
	case "artist": $sort_criteria = "artists"; break;
	case "crew": $sort_criteria = "crews"; break;
	case "date": $sort_criteria = "c.year ".$sort_order.", c.month ".$sort_order.", c.day"; break;
	case "uploaddate": $sort_criteria = "c.timestamp"; $sort_order = 'desc'; break;
	case "uploader": $sort_criteria = "c.uploader"; break;
	default:
	$sort_criteria = "c.name";
	$sort_by = "name";
	break;
}
$sort_criteria .= ' '.$sort_order;

require_once "header.php"; ?>

<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0">
		<div class="row apl-1 apb-1 apt-0">
			<div class="col-4 bg-secondary apb-1">
				<?php
				require_once "pagination.php";
				$limit = "LIMIT 30";
				$pageno = $_GET['pageno'] ?? 1;
				$rows_per_page = ($viewmode === "BBS") ? 6 : 68;
				$pagination = pagination("collys", $pageno, $rows_per_page, "viewmode={$viewmode}&sort_by={$sort_by}&sort_order={$sort_order}");

				if (!$is_search) {
					echo $pagination[ "pager" ];
				}
				?>
			</div>
			<div class="col-3 apt-1 bg-secondary apb-1">
				<div class="btn-group" role="group" aria-label="Button group with nested dropdown">
					<div class="btn-group" role="group">
						<button id="btnGroupDrop1" type="button" class="w-100 btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">View Mode:</button>
						<div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
							<a class="dropdown-item" href="?sort_by=releasemonth&viewmode=Standard">Standard</a>
							<a class="dropdown-item" href="?sort_by=releasemonth&viewmode=BBS">BBS</a>
						</div>
					</div>
				</div>
			</div>

			<div class="col-5 apt-1 bg-secondary apb-1">
				<form action="?sort_by=<?=$sort_by?>&sort_order=<?=$sort_order?>&viewmode=<?=$viewmode?>" method="post">
					<span class="amr-1 d-none d-sm-block"><input placeholder="search" type="text" name="search" autocomplete="off" class="w-100" style="background-color: #555 !important;" value="<?=$searchquery?>"></span>
				</form>
			</div>


			<?php
			if ($viewmode === "BBS") 
				{ ?>
					<div class="container-fluid bg-secondary apb-1">
						<div class="d-none d-sm-block text-truncate text-center">
							<span class="green">- --/\-\/- -</span> <span class="cyan">aSCIIaRENA</span> <span class="red">--=*=-- </span><span class="pink">[<?=date("D")?>, the <?=date("d-m-y")?>]</span><span class="red"> --=*=-- </span> <span class="cyan">aSCIIaRENA</span> <span class="green"> - -/\-\/- -- -</span><br><br>
						</div>
					</div>
					<?php
				}
				?>
				<?php
				if ($is_search) {
					$ask = "SELECT c.id,c.name,c.filename,c.type,c.uploader,c.file_id,c.timestamp,c.year,c.month,c.day,c.filesize,c.timestamp,
					GROUP_CONCAT(a.nick) as artists,GROUP_CONCAT(cw.name) as crews,u.upload_signature
					FROM collys c
					LEFT JOIN artists_collys ac ON c.id=ac.colly_id
					LEFT JOIN artists a ON ac.artist_id=a.id
					LEFT JOIN collys_crews cc ON c.id=cc.colly_id
					LEFT JOIN crews cw ON cc.crew_id=cw.id
					LEFT JOIN users u ON u.id=c.uploader_id
					WHERE 
					MATCH(c.filename, c.name) against (:searchquery in boolean mode)
					OR MATCH(a.nick) against (:searchquery in boolean mode)
					OR MATCH(cw.name) against (:searchquery in boolean mode)
					OR c.filename LIKE :wcquery OR c.name LIKE :wcquery OR a.nick LIKE :wcquery OR cw.name LIKE :wcquery
					GROUP BY c.filename
					ORDER BY {$sort_criteria} {$pagination["limit"]}";
					$rows = fetchAll($ask, [":searchquery" => $searchquery, ":wcquery" => '%'.$searchquery.'%']);
				} else {
					$rows = fetchAll("SELECT c.filename,c.name,c.year,c.month,c.day,c.filesize,c.timestamp,
						GROUP_CONCAT(a.nick) as artists,GROUP_CONCAT(cw.name) as crews,u.upload_signature
						FROM collys c
						LEFT JOIN artists_collys ac ON c.id=ac.colly_id
						LEFT JOIN artists a ON ac.artist_id=a.id
						LEFT JOIN collys_crews cc ON c.id=cc.colly_id
						LEFT JOIN crews cw ON cc.crew_id=cw.id
						LEFT JOIN users u ON u.id=c.uploader_id
						GROUP BY c.filename
						ORDER BY {$sort_criteria} {$pagination["limit"]}");
				}

				if ($viewmode === "BBS") { ?>
					<div class="container bg-secondary d-none d-sm-none d-md-block d-lg-block d-xl-block d-xxl-block">
						<?php foreach ($rows as $row) { ?>
							<div class="row apt-1">
								<div class="col-6 col-am-6 text-center text-md-left">
									<a href="/release/<?=$row->filename?>"><span class="cyan" style="margin-right: 8px;"><?=$row->filename?></span></a> <span class="green" style="margin-right: 16px;">PF--</span> <span class="yellow" style="margin-right: 8px;"><?=$row->filesize?></span> <span class="yellow"><?=date("d.m.y", $row->timestamp);?></span>
								</div>
								<div class="col-6 col-sm-6 apb-1 text-center text-md-left">
									<?php
									$dirname = @array_shift(explode(".", $row->filename));
									$filen = 'collections/'.$dirname.'/'.$row->filename;
									$file_id = preg_match('/@BEGIN_FILE_ID\.DIZ(.{1,2000})@END_FILE_ID\.DIZ/s', file_get_contents($filen), $m) ? $m[1] : '';
									if (strlen($file_id) > 0) { 
										$file_id = utf8_encode($file_id);
										$file_id = htmlentities($file_id, ENT_SUBSTITUTE);
										?>
										<pre style="overflow: hidden;"><a class="magenta ascii" href="/release/<?=$row->filename?>"><?=$file_id?></a></pre>
									<?php } ?>
								</div>
							</div>
							<div class="row apb-1">
								<div class="col-12 col-sm-6"></div>
								<div class="col-12 col-sm-6 text-center text-md-left">
									<span class="pink text-right"><?=$row->upload_signature?></span>
								</div>
							</div>
							<div class="row apb-2">
								<div class="col-12 col-sm-6"></div>
								<div class="col-12 col-sm-6 text-center text-md-left d-none d-sm-block">
									<span class="green text-right">[ aSCIIaRENa ] [ FREE LEECH ] [ aSCIIaRENa ]</span>
								</div>
								<div class="col-12 col-sm-6 text-center text-md-left">
									<span class="green text-right block d-sm-none">[ aSCIIaRENa ] [ FREE LEECH ]</span>
								</div>
							</div>
						<?php } ?>
					</div>

					<div class="container bg-secondary d-block d-xs-block d-sm-block d-md-none d-lg-none d-xl-none d-xxl-none">
						<?php foreach ($rows as $row) { ?>
							<div class="row apt-1">
								<div class="col-12 text-left">
									<a href="/release/<?=$row->filename?>"><span class="cyan" style="margin-right: 8px;"><?=$row->filename?></span></a> <span class="green" style="margin-right: 16px;">PF--</span> <span class="yellow" style="margin-right: 8px;"><?=$row->filesize?></span> <span class="yellow"><?=date("d.m.y", $row->timestamp);?></span><br>
									<?php
									$dirname = @array_shift(explode(".", $row->filename));
									$filen = 'collections/'.$dirname.'/'.$row->filename;
									$file_id = preg_match('/@BEGIN_FILE_ID\.DIZ(.{1,2000})@END_FILE_ID\.DIZ/s', file_get_contents($filen), $m) ? $m[1] : '';
									if (strlen($file_id) > 0) { 
										$file_id = utf8_encode($file_id);
										$file_id = htmlentities($file_id, ENT_SUBSTITUTE);
										?>
										<pre style="overflow: hidden;"><a class="magenta ascii" href="/release/<?=$row->filename?>"><?=$file_id?></a></pre><br>
									<?php } ?>
									<span class="pink text-left"><?=$row->upload_signature?></span><br><br>
									<span class="green text-left">[ aSCIIaRENa ] [ FREE LEECH ]</span><br><br><br><br>
								</div>
							</div>
						<?php } ?>
					</div>

				<?php } else { ?>
					<div class="container-fluid bg-secondary apb-1">



						<div class="row mb-4">
							<div class="col-md-7 text-truncate d-none d-md-block">
								<a href="?sort_by=name&sort_order=<?=$osort_order?>">NAME</a>
							</div>
							<div class="col text-truncate">
								<a href="?sort_by=filename&sort_order=<?=$osort_order?>">FILENAME</a>
							</div>
							<div class="col green text-truncate">
								<a href="?sort_by=artist&sort_order=<?=$osort_order?>">ARTiST</a>
							</div>
							<div class="col green text-truncate">
								<a href="?sort_by=crew&sort_order=<?=$osort_order?>">CREW</a>
							</div>
							<div class="col text-truncate d-none d-md-block">
								<a href="?sort_by=date&sort_order=<?=$osort_order?>">DATE</a>
							</div>
						</div>




						<?php foreach ($rows as $row) { ?>
							<div class="row mb-4 mb-sm-0">
								<div class="col-md-7 text-truncate">
									<a class="magenta" href="/release/<?=$row->filename?>"><?=$row->name?></a>
								</div>
								<div class="col text-truncate">
									<a class="magenta" href="/release/<?=$row->filename?>"><?=$row->filename?></a>
								</div>
								<div class="col green text-truncate">
									<span class="yellow"><?=combinize($row->artists, $row->artists, "/artist/", $row->artists)?></span>
								</div>
								<div class="col green text-truncate">
									<span class="yellow"><?=combinize($row->crews, $row->crews, "/crew/", $row->crews)?></span>
								</div>
								<div class="col text-truncate d-none d-md-block">
									<?=sprintf("%04d", $row->year).'-'.sprintf("%02d", $row->month).'-'.sprintf("%02d", $row->day)?>
								</div>
							</div>
						<?php } ?>
					</div>
				<?php } ?>
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
