<?php
require_once "session.php";
$h1 = "COLLYS";
include('header.php');
$is_search = isset($_POST[ "search" ]);
$searchquery = $_POST[ 'search' ] ?? "";
if(strlen($searchquery) < 3) unset($is_search);
$searchquery = str_replace('-', ' ', $searchquery);
$viewmode = $_GET[ 'viewmode' ] ?? "Standard";
$crew = $_GET[ 'crew' ] ?? "";
$sort_by = $_GET[ 'sort_by' ] ?? "";
switch ($sort_by) {
	case "releasemonth":
	$sort_criteria = "year ASC, month";
	break;
	case "releasedate":
	$sort_criteria = "year DESC, month DESC, day";
	break;
	case "nick":
	$sort_criteria = "artists";
	break;
	case "timestamp":
	case "uploader":
	case "filename":
	$sort_criteria = $sort_by;
	break;
	default:
	$sort_criteria = "name";
	$sort_by = "name";
	break;
}
?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2">
		<div class="row apl-1 apb-1">
			<div class="col-12 d-flex justify-content-between">
				<?php
				require_once "pagination.php";
				$limit = "LIMIT 30";
				$pageno = $_GET[ 'pageno' ] ?? 1;
				$rows_per_page = ($viewmode === "BBS") ? 6 : 68;
				$pagination = pagination("collys", $pageno, $rows_per_page, "viewmode={$viewmode}&sort_by={$sort_by}");

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
									<a class="dropdown-item" href="collys.php?sort_by=releasemonth&viewmode=Standard">Standard</a>
									<a class="dropdown-item" href="collys.php?sort_by=releasemonth&viewmode=BBS">BBS</a>
								</div>
								<form action="?sort_by=<?=$sort_criteria?>&viewmode=<?=$viewmode?>" method="post">
									<span class="amr-1 d-none d-sm-block">Search: <input type="text" name="search" style="background-color: #555 !important;" value="<?=$searchquery?>"></span>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col-12 apb-1 block d-sm-none">
				<form action="?sort_by=<?=$sort_criteria?>&viewmode=<?=$viewmode?>" method="post">
					<span class="amr-1 ">Search: <input type="text" name="search" style="background-color: #555 !important;" value="<?=$searchquery?>"></span>
				</form>
			</div>
		</div>

		<?php
	//-----------------------------------------------------------
	// SHOW COLLYS
	//-----------------------------------------------------------

		if ($is_search) {
			$searchquery = str_replace(" ", ",", $searchquery);
			//$ask = "SELECT * FROM collys WHERE MATCH(filename, name, artists, crews) against (:searchquery in boolean mode) {$limit}";
			$ask = "SELECT c.id,c.name,c.filename,c.type,c.uploader,c.file_id,c.timestamp,c.year,c.month,c.day,
			GROUP_CONCAT(a.nick) as artists,GROUP_CONCAT(cw.name) as crews
			FROM collys c
			LEFT JOIN artists_collys ac ON c.id=ac.colly_id
			LEFT JOIN artists a ON ac.artist_id=a.id
			LEFT JOIN collys_crews cc ON c.id=cc.colly_id
			LEFT JOIN crews cw ON cc.crew_id=cw.id
			WHERE 
			MATCH(c.filename, c.name) against (:searchquery in boolean mode)
			OR MATCH(a.nick) against (:searchquery in boolean mode)
			OR MATCH(cw.name) against (:searchquery in boolean mode)
			GROUP BY c.filename {$limit}";
			$rows = fetchAll($ask, [":searchquery" => $searchquery]);

			if ($viewmode === "BBS") {
				$todaysday = date("D");
				$todaystime = date("d-m-y");
				?>
				<div class="row">
					<div class="col-12">
						<span class="green">- --/\-\/- -</span><span class="cyan">aSCIIaRENA</span> <span class="red">--=*=-- </span><span class="pink"><?=$todaysday?>, the <?=$todaystime?>]</span><span class="red"> --=*=-- </span> <span class="cyan">aSCIIaRENA</span> <span class="green"> - -/\-\/- -- -</span>
					</div>
				</div>

				<?php
				foreach ($rows as $row) {
					$filename = $row->filename;
					$name = $row->name;
					$type = $row->type;
					$uploader = $row->uploader;
					$file_id = $row->file_id;
					$upload_date = $row->timestamp;
					$upload_date = date("d.m.y", $upload_date);
					$dirname = explode(".", $filename);
					$dirname = $dirname[ 0 ];
					$year = $row->year;
					$month = $row->month;
					$day = $row->day;
					$dirname = explode(".", $filename);
					$dirname = $dirname[ 0 ];
					$orig = (file_exists(BASEDIR . "/collections/{$dirname}/{$filename}.diz")) ? file_get_contents(BASEDIR . "/collections/{$dirname}/{$filename}.diz") : "";
					$orig = utf8_encode($orig);
					{
						?>
						<div class="row">
							<div class="col-6">
								<a href=""><span class="cyan" style="margin-right: 8px;"><?=$filename?></span></a> <span class="green" style="margin-right: 16px;">PF--</span> <span class="yellow" style="margin-right: 8px;"><?=$row->filesize?></span> <span class="yellow"><?=$upload_date?></span>
								<?php
								$ask_sig = "SELECT upload_signature from users where nick = :uploader";
								$upload_signature = fetchOne($ask_sig, [":uploader" => $uploader])->upload_signature;
								?>
							</div>
							<div class="col-6 apb-1" style="margin-top: -16px;">				
								<pre style="overflow: hidden;"><a class="magenta ascii" href="/release/<?=$filename?>"><?=$orig?></a></pre>
							</div>
						</div>
						<div class="row apb-1">
							<div class="col-6">
							</div>
							<div class="col-6">
								<span class="pink text-right"><?=$upload_signature?></span>
							</div>
						</div>
						<div class="row apb-2">
							<div class="col-6">
							</div>
							<div class="col-6">
								<span class="green text-right">[ aSCIIaRENa ] [ FREE LEECH ] [ aSCIIaRENa ]</span>
							</div>
						</div>
						<?php
					}
				}
			} else {
				?>
				<div class="row apb-1">
					<div class="col-4"><span class="white">NAME</span></div>
					<div class="col-4"><span class="white">ARTiST</span></div>
					<div class="col-4"><span class="white">CREW</span></div>
				</div>
				<?php
				foreach ($rows as $row) {
					?>
					<div class="row">
						<div class="col-4 text-truncate">
							<a href="/release/<?=$row->filename?>"><?=$row->name?></a>
						</div>
						<div class="col-lg-4 green">
							<span class="yellow"><?=combinize($row->artists, $row->artists, "/artist/", $row->artists)?></span>
						</div>
						<div class="col-lg-4 yellow text-truncate">
							<span class="yellow"><?=combinize($row->crews, $row->crews, "/crew/", $row->crews)?></span>
						</div>
					</div>
					<?php
				}
			}
		} else {
			if ($viewmode === 'Standard') 
			{
				?>
				<div class="row amb-1">
					<div class="col-4 col-sm-4"><span class="white"><a class="white" href="collys.php?sort_by=name&viewmode=Standard">NAME</a></span></div>
					<div class="col-2 d-none d-sm-block"><span class="white"><a class="white" href="collys.php?sort_by=filename&viewmode=Standard">FiLENAME</a></span></div>
					<div class="col-4 col-sm-2"><span class="white"><a class="white" href="collys.php?sort_by=nick&viewmode=Standard">ARTIST</a></span></div>
					<div class="col-4 col-sm-2"><span class="white"><a class="white" href="collys.php?sort_by=crew&viewmode=Standard">CREW</a></span></div>
					<div class="col-2 d-none d-sm-block"><span class="white"><a class="white" href="collys.php?sort_by=releasedate&viewmode=Standard">DATE</a></span></div>
				</div>

				<div class="row">
					<?php
					$sort_order = in_array($sort_by, ["timestamp", "releasedate"]) ? "DESC" : "ASC";
										//$result = fetchAll("SELECT * FROM collys ORDER BY {$sort_criteria} {$sort_order} {$pagination["limit"]}");
					$result = fetchAll("SELECT c.filename,c.name,c.year,c.month,c.day, 
						GROUP_CONCAT(a.nick) as artists,GROUP_CONCAT(cw.name) as crews
						FROM collys c
						LEFT JOIN artists_collys ac ON c.id=ac.colly_id
						LEFT JOIN artists a ON ac.artist_id=a.id
						LEFT JOIN collys_crews cc ON c.id=cc.colly_id
						LEFT JOIN crews cw ON cc.crew_id=cw.id
						GROUP BY c.filename
						ORDER BY {$sort_criteria} {$sort_order} {$pagination["limit"]}");
					foreach ($result as $row) {
						$year = $row->year;
						$month = $row->month;
						$day = $row->day;
						if (empty($year)) {
							$year = "0000";
						}
						if (empty($month)) {
							$month = 0;
						}
						if (empty($day)) {
							$day = 0;
						}
						if ($month < 10) {
							$month = "0$month";
						}
						if ($day < 10) {
							$day = "0$day";
						}
						?>
						<div class="col-4 col-sm-4 text-truncate">
							<a class="magenta" href="/release/<?=$row->filename?>"><?=$row->name?></a>
						</div>
						<div class="col-sm-2 d-none d-sm-block">
							<a href="/release/<?=$row->filename?>"><?=$row->filename?></a>
						</div>
						<div class="col-4 col-sm-2 text-truncate">
							<span class="yellow"><?=combinize($row->artists, $row->artist_ids, "/artist/", $row->artists)?></span>
						</div>
						<div class="col-4 col-sm-2 text-truncate">
							<span class="yellow"><?=combinize($row->crews, $row->crew_ids, "/crew/", $row->crews)?></span>
						</div>
						<div class="col-sm-2 d-none d-sm-block">
							<span class="lightgrey"><?=$year?>-<?=$month?>-<?=$day?></span>
						</div>
						<?php
					} ?>
				</div>
			<?php } else {
				$todaysday = date("D");
				$todaystime = date("d-m-y");
				?>
				<div class="row">
					<div class="col-lg-12">
						<span class="green">- --/\-\/- -</span> <span class="cyan">aSCIIaRENA</span> <span class="red">--=*=-- </span><span class="pink"><?=$todaysday?>, the <?=$todaystime?>]</span><span class="red"> --=*=-- </span> <span class="cyan">aSCIIaRENA</span> <span class="green"> - -/\-\/- -- -</span><br/><br/>
					</div>
				</div>

				<?php
				$ask = "SELECT * FROM collys filename ORDER BY :criteria DESC {$pagination["limit"]}";
				foreach (fetchAll($ask, [":criteria" => $sort_criteria]) as $row) {
					$filename = $row->filename;
					$name = $row->name;
					$type = $row->type;
					$uploader = $row->uploader;
					$file_id = $row->file_id;
					$upload_date = $row->timestamp;
					$upload_date = date("d.m.y", $upload_date);
					$year = $row->year;
					$month = $row->month;
					$day = $row->day;
					$dirname = explode(".", $filename);
					$dirname = $dirname[ 0 ];

					if (empty($year)) {
						$year = "0000";
					}
					if (empty($month)) {
						$month = 0;
					}
					if (empty($day)) {
						$day = 0;
					}
					if ($month < 10) {
						$month = "0$month";
					}
					if ($day < 10) {
						$day = "0$day";
					}
					$orig = (file_exists(BASEDIR . "/collections/{$dirname}/{$filename}.diz")) ? file_get_contents(BASEDIR . "/collections/{$dirname}/{$filename}.diz") : "";
					$orig = utf8_encode($orig);

					$a = htmlentities($orig);
					{
						?>
						<div class="row">
							<div class="col-6">
								<a href="/release/<?=$filename?>"><span class="cyan" style="margin-right: 8px;"><?=$filename?></span></a> <span class="green" style="margin-right: 16px;">PF--</span> <span class="yellow" style="margin-right: 8px;"><?=$row->filesize?></span> <span class="yellow"><?=$upload_date?></span>
								<?php
								$ask_sig = "SELECT upload_signature from users where nick = :uploader";
								$upload_signature = fetchOne($ask_sig, [":uploader" => $uploader])->upload_signature;
								?>
							</div>
							<div class="col-6 apb-1" style="margin-top: -16px;">				
								<pre style="overflow: hidden;"><a class="magenta ascii" href="/release/<?=$filename?>"><?=$orig?></a></pre>
							</div>
						</div>
						<div class="row apb-1">
							<div class="col-6">
							</div>
							<div class="col-6">
								<span class="pink text-right"><?=$upload_signature?></span>
							</div>
						</div>
						<div class="row apb-2">
							<div class="col-6">
							</div>
							<div class="col-6">
								<span class="green text-right">[ aSCIIaRENa ] [ FREE LEECH ] [ aSCIIaRENa ]</span>
							</div>
						</div>
						<?php
					}
				}
			}
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
	<?php include "footer.php"; ?>
