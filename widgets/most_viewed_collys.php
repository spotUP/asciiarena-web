<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid">
	<div class="header col-lg-12 p-0 m-0">
		<h2 class="ap-1 bg-header">MOST VIEWED COLLYS</h2>
	</div>
	<div class="container bg-green m-0 p-0 apt-1 apb-1 bg-secondary">
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
			<a class="magenta" href="/info_release.php?filename=<?=$decodedfilename?>"><?=$filename?></a>
			<?=$views?>
		</div>
		<?php
	}
	?>
</div>
</div>
<?php