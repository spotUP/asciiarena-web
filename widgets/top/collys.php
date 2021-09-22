<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
	<div class="header col-lg-12 p-0">
		<h2 class="ap-1 bg-header">TOP 5 COLLYS</h2>
	</div>
	<div class="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT * FROM collys where (SELECT COUNT(rating) votes FROM comments WHERE filename = collys.filename)>=3 ORDER BY rating DESC LIMIT 5") as $row) {
			$filename = htmlentities($row->filename);
			$colly_rating = sprintf("%0.2f", $row->rating)
			?>
			<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
				<a class="magenta text-truncate" href="/release/<?=$filename?>"><?=$filename?></a>
				<span class="text-truncate"><?=$colly_rating?> PTS</span>
			</div>
			<?php
		}
		?>
	</div>
</div>
