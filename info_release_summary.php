<?php defined('VALID') or die('Nuh-uh!');
require_once "tools/text.php";
$colly = fetchOne("SELECT * FROM collys WHERE filename = :filename", [":filename" => $filename]);

$dirname = explode(".", $colly->filename);
$dirname = $dirname[0];
	$filenameandpath = "collections/".$dirname."/".$colly->filename; // fetch path + filename to get filesize.
	$viewtimes = $colly->view_counter;
	$year = $colly->year;
	$prodmonth = $colly->month;
	$prodday = $colly->day;
	$type = $colly->type;
	$uploader = $colly->uploader;
	$dirname = explode(".", $filename);
	$dirname = $dirname[ 0 ];
	$file_id = "$filenameandpath.diz";
	$colly_id = $colly->id;
	$show_colly_name = preg_replace('/[^(\x20-\xFF)]*/','', $colly->name);
	htmlspecialchars($show_colly_name, ENT_QUOTES);
	if (file_exists($file_id)) {
		$file_id_diz = file_get_contents($file_id);
	}
	if (!isset($_POST[ 'edit_colly' ])) {
		?>
		<div class="row">
			<div class="header col-lg-12">
				<h1 class="ap-1 bg-header"><?=$show_colly_name?></h1>
			</div>
		</div>
		<div class="container-fluid">
			<div class="row apt-1 apl-1 apr-1 bg-secondary overflow-hidden">
				<div class="animate__animated animate__backInLeft col-lg-8 d-flex justify-content-center justify-content-lg-start" style="position: relative; top: -16px;">
					<span>
						<?php
						if (file_exists($file_id))
						{
							$file_id_diz = encodeFileText($file_id);
							echo "<pre class=\"magenta apt-1\">";
							echo $file_id_diz;
							echo "</pre>";
						}
						else 
						{
							$file_id_diz = encodeFileText("collections/file_id.diz.txt");
							echo "<pre class=\"magenta apt-1\">";
							echo $file_id_diz;
							echo "</pre>";
						}
						?>
					</span>
				</div>
				<div class="col-lg-4">
					<div class="row d-flex justify-content-between">

						<span>Artist(s):</span>

						<?php
						$authors = [];
						foreach (fetchAll("SELECT a.nick FROM collys c LEFT JOIN artists_collys ac ON ac.colly_id=c.id LEFT JOIN artists a ON a.id=ac.artist_id 
							WHERE c.filename=:filename", [":filename" => $filename]) as $row) {
							$author = $row->nick;
						$authors[] = "<a class=\"green\" href=\"/artist/".urlsafe($author)."\">{$row->nick}</a>";
					}
					?>
					<span>
						<?php
						echo pluralize($authors);
						?>
					</span>
				</div>
<div class="row d-flex justify-content-between">
    <?php
        $crews = [];
        foreach (fetchAll("SELECT w.name as crew FROM collys c LEFT JOIN collys_crews cc ON cc.colly_id=c.id LEFT JOIN crews w ON w.id=cc.crew_id 
        WHERE c.filename=:filename", [":filename" => $filename]) as $row) {
            if(!empty($row->crew)) {
                $crews[] = '<a href="/crew/'.urlsafe($row->crew).'">' . $row->crew . '</a>';
        }
        }
        if(!empty($crews)) {
            ?>
            <span>Crew(s):</span>
            <span class="truncate">
            <?php
                echo pluralize($crews);
            ?>
        </span>
            <?php
        }
    ?>
</div>

			<div class="row d-flex justify-content-between">
				<span>Filename:</span>
				<span><?=$colly->filename?></span>
			</div>
			<div class="row d-flex justify-content-between">
				<span>Size:</span>
				<span><?=formatBytes($colly->filesize)?></span>
			</div>
					<?php
            if (($prodday!=0) || ($prodmonth!=0) || ($prodyear!=0)) {
          ?>
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
					<?php
            }
          ?>

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
				if ($votecount<3) {
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
				<span><a href="/member/<?=urlsafe($uploader)?>"><?=$uploader?></a></span>
			</div>
			<?php
			if (strpos($type, "ASCII") !== false) {
				?>
				<div class="row d-flex justify-content-between">
					<span>Viewed:</span>
					<span><?=$viewtimes?> times</span>
				</div>
				<?php
			}
			if (strpos($type, "ANSI") !== false) {
				?>
				<div class="row d-flex justify-content-between">
					<span>Viewed:</span>
					<span><?=$viewtimes?> times</span>
				</div>
				<?php
			}
			?>
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
?>
