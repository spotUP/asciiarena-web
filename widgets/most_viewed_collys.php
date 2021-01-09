<?php defined('VALID') or die('Nuh-uh!'); ?>
	<div class="header col-lg-12">
		<h2 class="ap-1">MOST VIEWED COLLYS</h2>
	</div>
<?php

	foreach (fetchAll("SELECT * FROM collys ORDER BY view_counter DESC LIMIT 5") as $row) {
		$filename = $row->filename;
		$filename = str_replace("&#39;", "'", $filename);        // replace ' with &#39
		$filename = myTruncate($filename, 12);            // truncate
		$filename = str_replace("'", "&#39;", $filename);        // replace ' with &#39
		$decodedfilename = base64_encode($row->filename);
		$views = $row->view_counter;
		?>
		<div class="col-lg-12 d-flex justify-content-between">
			<a href="info_release.php?filename=<?=$decodedfilename?>"><?=$filename?></a>
			<?=$views?>
		</div>
		<?php
	}
