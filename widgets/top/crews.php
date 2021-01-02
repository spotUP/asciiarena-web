<?php defined('VALID') or die('Nuh-uh!'); ?>
	<div class="header col-lg-12">
		<h2>TOP 5 CREWS</h2>
	</div>
<?php
	foreach (fetchAll("SELECT name, rating FROM crews ORDER BY rating DESC LIMIT 5") as $row) {
		$crew_ratings = $row->rating;
		$crew_ratings = round($crew_ratings, 2);
		$crew = base64_encode($row->name);

		?>
		<div class="col-lg-12 d-flex justify-content-between">
			<a href="info_crew.php?crew=<?=$crew?>&sort_by=a.filename"><?=$row->name?></a>
			<?=$crew_ratings?>
		</div>
		<?php
	}
