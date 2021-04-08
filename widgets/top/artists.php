<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid">
	<div class="header col-lg-12 p-0 m-0">
		<h2 class="ap-1 bg-header">TOP 5 ARTISTS</h2>
	</div>
	<div class="container bg-green m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT nick, rating FROM artists ORDER BY rating DESC LIMIT 5") as $row) {
			$artist = $row->nick;
			$artist_rating = sprintf("%0.2f", $row->rating);
			?>
			<div class="col-lg-12 d-flex justify-content-between">
				<a class="green" href="/artist/<?=urlsafe($artist)?>"><?=$row->nick?></a>
				<?=$artist_rating?>
			</div>
			<?php
		}
		?>
	</div>
</div>
<?php