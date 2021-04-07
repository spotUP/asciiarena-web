<?php defined('VALID') or die('Nuh-uh!'); ?>
	<div class="header col-lg-12">
		<h2 class="ap-1 bg-header">TOP 5 COLLYS</h2>
	</div>
<?php
	foreach (fetchAll("SELECT * FROM collys ORDER BY rating DESC LIMIT 5") as $row) {
		$filename = htmlentities($row->filename);
		$decodedfilename = base64_encode($row->filename);
		$colly_rating = sprintf("%0.2f", $row->rating)
		?>
		<div class="col-lg-12 d-flex justify-content-between">
			<a class="magenta" href="/info_release.php?filename=<?=$decodedfilename?>"><?=$filename?></a>
			<?=$colly_rating?>
		</div>
		<?php
	}
