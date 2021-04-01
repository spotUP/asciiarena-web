<?php defined('VALID') or die('Nuh-uh!'); ?>
	<div class="header col-lg-12">
		<h2 class="ap-1 bg-header"><a class="lightgreen" href="/mags.php?sort_by=timestamp">LATEST ADDED MAGS</a> <a class="lightgreen"
		                                                                                     href="/rss.php?class=0">[RSS]</a>
		</h2>
	</div>
<?php

	foreach (fetchAll("SELECT * FROM mags ORDER BY timestamp DESC LIMIT 5") as $row) {
		$filename = $row->filename;
		$filename = str_replace("&#39;", "'", $filename);        // replace ' with &#39
		$filename = myTruncate($filename, 12);            // truncate
		$filename = str_replace("'", "&#39;", $filename);        // replace ' with &#39

		$upload_date = $row->timestamp;
		$upload_date = date("o-m-d", $upload_date);

		?>
		<div class="col-lg-12 d-flex justify-content-between">
			<a class="magenta" href="/mags.php?sort_by=timestamp"><?=$filename?></a>
			<?=$upload_date?>
		</div>
		<?php
	}
