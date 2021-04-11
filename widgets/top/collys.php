<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid col-12 apl-1 apr-1">
	<div class="header col-lg-12 p-0 m-0">
		<h2 class="ap-1 bg-header">TOP 5 COLLYS</h2>
	</div>
	<div class="container col-12 bg-green m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT * FROM collys ORDER BY rating DESC LIMIT 5") as $row) {
			$filename = htmlentities($row->filename);
			$colly_rating = sprintf("%0.2f", $row->rating)
			?>
			<div class="col-lg-12 d-flex justify-content-between">
				<a class="magenta" href="/release/<?=$filename?>"><?=$filename?></a>
				<?=$colly_rating?> PTS
			</div>
			<?php
		}
		?>
	</div>
</div>
