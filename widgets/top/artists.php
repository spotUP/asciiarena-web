<?php defined('VALID') or die('Nuh-uh!'); ?>
	<div class="header col-lg-12">
		<h2>TOP 5 ARTISTS</h2>
	</div>
<?php
	foreach (fetchAll("SELECT nick, rating FROM artists ORDER BY rating DESC LIMIT 5") as $row) {
		$decoded_artist = base64_encode($row->nick);
		$artist_rating = $row->rating;
		$artist_rating = round($artist_rating, 2);
		?>
		<div class="col-lg-12 d-flex justify-content-between">
			<a href="info_artist.php?artist=<?=$decoded_artist?>&sort_by=filename"><?=$row->nick?></a>
			<?=$artist_rating?>
		</div>
		<?php
	}
