<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid">
	<div class="header col-lg-12 m-0 p-0">
		<h2 class="ap-1 bg-header"><a class="lightgreen" href="/collys.php?sort_by=timestamp">LATEST ADDED COLLYS</a> <a class="lightgreen"
			href="/rss.php?id=1">[RSS]</a>
		</h2>
	</div>
	<div class="container m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT * FROM collys ORDER BY timestamp DESC LIMIT 5") as $row) {
			$filename = $row->filename;

		$filename = str_replace("&#39;", "'", $filename);        // replace ' with &#39
		$filename = myTruncate($filename, 12);            // truncate
		$filename = str_replace("'", "&#39;", $filename);        // replace ' with &#39
		$encodedfilename = base64_encode($row->filename);
		$upload_date = $row->timestamp;
		$upload_date = date("y-m-d", $upload_date);

		?>
		<div class="col-lg-12 d-flex justify-content-between">
			<a class="magenta" href="/info_release.php?filename=<?=$encodedfilename?>"><?=$filename?></a>
			<?=$upload_date?>
		</div>
		<?php}
		?>
	</div>
</div>
<?php