<?php
	require_once "session.php";
	$h1 = "COLLYS";
	include('header.php');
	$is_search = isset($_POST[ "search" ]);
	$searchquery = $_POST[ 'search' ] ?? "";
	$viewmode = $_GET[ 'viewmode' ] ?? "Standard";
	$crew = $_GET[ 'crew' ] ?? "";
	$sort_by = $_GET[ 'sort_by' ] ?? "";
	switch ($sort_by) {
		case "releasemonth":
			$sort_criteria = "year ASC, month";
			break;
		case "releasedate":
			$sort_criteria = "year ASC, month ASC, day";
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
			<form action="?sort_by=<?=$sort_criteria?>&viewmode=<?=$viewmode?>" method="post">
				<span style="margin-right: 16px;">Search: <input type="text" name="search" value="<?=$searchquery?>"></span>
			</form>
		</div>
	</div>
<?php
	//-----------------------------------------------------------
	// SHOW COLLYS
	//-----------------------------------------------------------

	if ($is_search) {
		if ($viewmode === "BBS") {
			$todaysday = date("D");
			$todaystime = date("d-m-y");
			?>
			<div class="col-12">
			<br>
			<span class="green">- --/\-\/- -</span>
			<span class="cyan">aSCIIaRENA</span> <span class="red">--=*=-- </span><span
					class="pink"><?=$todaysday?>, the <?=$todaystime?>]</span><span class="red"> --=*=-- </span> <span
					class="cyan">aSCIIaRENA</span> <span class="green"> - -/\-\/- -- -</span>
			<?php
			$searchquery = $_POST[ 'search' ];
			$searchquery = str_replace(" ", ",", $searchquery);
			$ask = "SELECT collys.*, author_of.nick, crew_of.crew FROM collys LEFT JOIN author_of ON collys.id = author_of.colly_id LEFT JOIN crew_of ON collys.id = crew_of.colly_id where match(collys.filename, name, nick, crew) against (:searchquery in boolean mode) GROUP BY collys.filename ORDER BY collys.filename DESC {$limit}";
			foreach (fetchAll($ask, [":searchquery" => $searchquery]) as $row) {
				$author = $row->author;
				$filename = $row->filename;
				$encoded_filename = base64_encode($filename);
				$name = $row->name;
				$mystring = $row->name;
				$shortened = myTruncate($mystring, 48, " ", "...");
				$type = $row->type;
				$uploader = $row->uploader;
				$file_id = $row->file_id;
				$encoded_filename = base64_encode($row->filename);
				$upload_date = $row->timestamp;
				$upload_date = date("d.m.y", $upload_date);
				$dirname = explode(".", $filename);
				$dirname = $dirname[ 0 ];
				{
					?>
					<a href="info_release.php?filename=<?=$encoded_filename?>">
						<span class="cyan"><?=$filename?>&nbsp;</span></a>
					<span class="green">PF--&nbsp;&nbsp;</span>
					<span class="yellow"><?=$row->filesize?>&nbsp;</span>
					<span class="yellow"><?=$upload_date?></span>
					<?php
					$ask_sig = "SELECT upload_signature from users where nick = :uploader";
					$upload_signature = fetchOne($ask_sig, [":uploader" => $uploader])->upload_signature;
					?>

					<a href="info_release.php?filename=<?=$encoded_filename?>"><img class="centered"
					                                                                src="/collections/<?=$dirname?>/<?=$file_id?>" alt=""></a>

					<span class="pink"><?=$upload_signature?></span>

					<span class="green">[ aSCIIaRENa ] [ FREE LEECH ] [ aSCIIaRENa ]</span><br>
					<?php
				}
			}
		} else {
			?>
			<div class="row" style="padding-bottom: 16px;">
				<div class="col-4">NAME</div>
				<div class="col-4">ARTiST</div>
				<div class="col-4">CREW</div>
			</div>
			<?php
			$searchquery = str_replace(" ", ",", $searchquery);
			$ask = "SELECT * FROM collys WHERE MATCH(filename, name, artists, crews) against (:searchquery in boolean mode) {$limit}";
			foreach (fetchAll($ask, [":searchquery" => $searchquery]) as $row) {
				?>
				<div class="row">
					<div class="col-4"><a
								href="info_release.php?filename=<?=base64_encode($row->filename)?>"><?=myTruncate($row->name, 48, " ", "...")?></a>
					</div>
					<div class="col-lg-4"><?=combinize($row->artists, $row->artist_ids, "/artists/", $row->artists)?></div>
					<div class="col-lg-4"><?=combinize($row->crews, $row->crew_ids, "/crews/", $row->crews)?></div>
				</div>
				<?php
			}
		}
	} else {
		?>
		<div class="btn-group" role="group" aria-label="Button group with nested dropdown">
			<div class="btn-group" role="group">
				<button id="btnGroupDrop1" type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown"
				        aria-haspopup="true" aria-expanded="false">Sort By:
				</button>
				<div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
					<a class="dropdown-item" href="collys.php?sort_by=name&viewmode=<?=$viewmode?>">Name</a>
					<a class="dropdown-item" href="collys.php?sort_by=filename&viewmode=<?=$viewmode?>">Filename</a>
					<a class="dropdown-item" href="collys.php?sort_by=nick&viewmode=<?=$viewmode?>">Artist</a>
					<a class="dropdown-item" href="collys.php?sort_by=releasedate&viewmode=<?=$viewmode?>">Release Date</a>
					<a class="dropdown-item" href="collys.php?sort_by=timestamp&viewmode=<?=$viewmode?>">Upload Date</a>
					<a class="dropdown-item" href="collys.php?sort_by=uploader&viewmode=<?=$viewmode?>">Uploader</a>
				</div>
			</div>
		</div>
		<div class="btn-group" role="group" aria-label="Button group with nested dropdown">
			<div class="btn-group" role="group">
				<button id="btnGroupDrop1" type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown"
				        aria-haspopup="true" aria-expanded="false">View Mode:
				</button>
				<div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
					<a class="dropdown-item" href="collys.php?sort_by=releasemonth&viewmode=Standard">Standard</a>
					<a class="dropdown-item" href="collys.php?sort_by=releasemonth&viewmode=BBS">BBS</a>
				</div>
			</div>
		</div>

		<?php

		if ($viewmode === 'Standard') {
			?>
			<tr class="row apb-1">
				<td class="col-12">
					<table class="table table-liquid mt-2">
						<thead>
						<tr>
							<th>NAME</th>
							<th>ARTIST</th>
							<th>CREW</th>
						</tr>
						</thead>
						<tbody>
						<?php
							$sort_order = in_array($sort_by, ["timestamp", "releasedate"]) ? "DESC" : "ASC";
							$result = fetchAll("SELECT * FROM collys ORDER BY {$sort_criteria} {$sort_order} {$pagination["limit"]}");
							foreach ($result as $row) {
								?>
								<tr>
									<td><a
												href="info_release.php?filename=<?=base64_encode($row->filename)?>"><?=myTruncate($row->name, 40, " ", "...")?></a>
									</td>
									<td><?=combinize($row->artists, $row->artist_ids, "/artists/", $row->artists)?></td>
									<td><?=combinize($row->crews, $row->crew_ids, "/crews/", $row->crews)?></td>
								</tr>
								<?php
							} ?>
						</tbody>
					</table>
			</div>
		<?php } else {
			$todaysday = date("D");
			$todaystime = date("d-m-y");
			?>
			<div class="col-lg-12">
				<br>
				<span class="green">- --/\-\/- -</span> <span class="cyan">aSCIIaRENA</span> <span
						class="red">--=*=-- </span><span class="pink"><?=$todaysday?>, the <?=$todaystime?>]</span><span
						class="red"> --=*=-- </span> <span class="cyan">aSCIIaRENA</span> <span
						class="green"> - -/\-\/- -- -</span>
				<br><br>
			</div>
			<?php
			$ask = "SELECT collys.*, author_of.nick, crew_of.crew FROM collys LEFT JOIN author_of ON collys.id = author_of.colly_id LEFT JOIN crew_of ON collys.id = crew_of.colly_id GROUP BY collys.filename ORDER BY :criteria DESC {$limit}";
			foreach (fetchAll($ask, [":criteria" => $sort_criteria]) as $row) {
				$author = $row->author;
				$filename = $row->filename;
				$encoded_filename = base64_encode($filename);
				$name = $row->name;
				$mystring = $row->name;
				$shortened = myTruncate($mystring, 48, " ", "...");
				$type = $row->type;
				$uploader = $row->uploader;
				$file_id = $row->file_id;
				$encoded_filename = base64_encode($row->filename);
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
				$a = htmlentities($orig);
				{
					?>
					<div class="row">
						<div class="col-lg-12 d-flex">
							<a href=""><span class="cyan"><?=$filename?>&nbsp;</span></a>
							<span class="green">PF--&nbsp;&nbsp;</span>
							<span class="yellow"><?=$row->filesize?>&nbsp;</span>
							<span class="yellow"><?=$upload_date?></span>
							<?php
								$ask_sig = "SELECT upload_signature from users where nick = :uploader";
								$upload_signature = fetchOne($ask_sig, [":uploader" => $uploader])->upload_signature;
							?>
							<a href="info_release.php?filename=<?=$encoded_filename?>">
								<pre><?=$orig?></pre>
							</a><br><span class="pink"><?=$upload_signature?></span><br><br> <span class="green">[ aSCIIaRENa ] [ FREE LEECH ] [ aSCIIaRENa ]</span><br><br>
						</div>
					</div>
					<div class="row">
						<div class="col-lg-12 d-flex">
							<span class="pink"><?=$upload_signature?></span><br>
						</div>
						<div class="col-lg-12 d-flex"></div>
					</div>
					<?php
				}
			}
		}
		echo $pagination[ "pager" ];
	}

	require_once "footer.php";
