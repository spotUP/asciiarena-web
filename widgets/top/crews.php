<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid">
	<div class="header col-lg-12 p-0 m-0">
		<h2 class="ap-1 bg-header">TOP 5 CREWS</h2>
	</div>
	<div class="container bg-green m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT name, rating FROM crews ORDER BY rating DESC LIMIT 5") as $row) {
			$crew_ratings = $row->rating;
			$crew_ratings = sprintf("%0.2f", $row->rating);
			$crew = $row->name;

			?>
			<div class="col-lg-12 d-flex justify-content-between">
				<a href="/crew/<?=urlsafe($crew)?>/"><?=$row->name?></a>
				<?=$crew_ratings?>
			</div>
			<?php
		}
		?>
	</div>
</div>
