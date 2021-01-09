<?php defined('VALID') or die('Nuh-uh!');
$dirname = explode(".", $filename);
$dirname = $dirname[ 0 ];

	$filenameandpath = "collections/$dirname/$filename"; // fetch path + filename to get filesize.

	foreach (fetchAll("SELECT * FROM collys WHERE filename = :filename", [":filename" => $filename]) as $colly) {
		$viewtimes = $colly->view_counter;
		$year = $colly->year;
		$prodmonth = $colly->month;
		$prodday = $colly->day;
		$type = $colly->type;
		$uploader = $colly->uploader;
		$dirname = explode(".", $filename);
		$dirname = $dirname[ 0 ];
		$file_id = "$filenameandpath.diz";

		if (file_exists($file_id)) {
			$file_id_diz = file_get_contents($file_id);
		}

		if (!isset($_POST[ 'edit_colly' ])) {
			?>
			<div class="row">
				<div class="header col-lg-12">
					<h1 class="ap-1"><?=$colly->name?></h1>
				</div>
			</div>


			<div class="container-fluid">
				<div class="row ap-1 bg-secondary">
					<div class="col-8 m-0 p-0" style="position: relative; top: -16px;">
						<span>
							<?php if ($colly->file_id == "file_id.diz.png") {
								$file_id_diz = file_get_contents("collections/file_id.diz.txt");
								echo "<pre>";
								echo $file_id_diz;
								echo "</pre>";
							} else {
								if (file_exists("$file_id")) {
									echo "<pre>";
									echo utf8_encode($file_id_diz);
									echo "</pre>";
								}
							}
							?>
						</span>
					</div>
					<div class="col-4">
						<div class="row d-flex justify-content-between">

							<span>Artist(s):</span>

							<?php
							$authors = [];
							foreach (fetchAll("SELECT * FROM author_of WHERE filename = :filename", [":filename" => $filename]) as $row) {
								$encoded_author = base64_encode($row->nick);
								$authors[] = "<a href=\"info_artist.php?artist={$encoded_author}&sort_by=filename\">{$row->nick}</a>";
							}
							?>
							<span>
								<?php
								echo pluralize($authors);
								?>
							</span>
						</div>
						<div class="row d-flex justify-content-between">
							<span>Crew(s):</span>
							<?php
							$crews = [];
							foreach (fetchAll("SELECT * FROM crew_of WHERE filename = :filename", [":filename" => $filename]) as $row) {
								$encoded_crew = base64_encode($row->crew);
								$crews[] = "<a href=\"info_crew.php?crew={$encoded_crew}&sort_by=filename\">{$row->crew}</a>";
							}
							?>
							<span>
								<?php
								echo pluralize($crews);
								?>
							</span>
						</div>

						<div class="row d-flex justify-content-between">
							<span>Filename:</span>
							<span><?=$colly->filename?></span>
						</div>
						<div class="row d-flex justify-content-between">
							<span>Size:</span>
							<span><?=$colly->filesize?></span>
						</div>
						<div class="row d-flex justify-content-between">
							<span>Released:</span>
							<span>
								<?php
								if (!empty($prodday)) {
									echo "<span>{$prodday}</span>";
								}
								if (isset($prodmonth) && $month_list[ $prodmonth ] !== "Unknown") {
									echo " {$month_list[$prodmonth]} ";
								}
								if (!empty($year)) {
									echo $year;
								}
								?>
							</span>
						</div>

						<div class="row d-flex justify-content-between">
							<span>Rating:</span>

							<?php
							foreach (fetchAll("SELECT rating FROM collys WHERE filename = :filename", [":filename" => $filename]) as $row) {
								$collyrating = $row->rating;
							}

							foreach (fetchAll("SELECT COUNT(rating) votes FROM comments WHERE filename = :filename", [":filename" => $filename]) as $row) {
								$votecount = $row->votes;
							}
							?>
							<?php
							if (empty($collyrating)) {
								$votesleft = (3 - $votecount);
								echo "Awaiting $votesleft vote";
								if ($votesleft > 1) {
									echo "s";
								}
							} else {
								echo "$collyrating ($votecount votes)";
							}
							?>
						</div>

						<div class="row d-flex justify-content-between">
							<span>Added by:</span>
							<span><a href="members.php?user=<?=$uploader?>"><?=$uploader?></a></span>
						</div>
						<div class="row d-flex justify-content-between">
							<span>Viewed:</span>
							<span><?=$viewtimes?> times</span>
						</div>
						<div class="row d-flex justify-content-between">

							<span>Downloaded:</span>
							<?php
							$downloads = fetchOne("SELECT downloads FROM collys WHERE filename = :filename", [":filename" => $filename])->downloads ?? 0;
							?>
							<span>
								<?php
								echo "{$downloads} Time";
								if ($downloads !== 1) {
									echo "s";
								}
								?>
							</span>
							<?php
						}
						?>
					</div>
				</div>
			</div>
		</div>

		<?php
	}
	?>
