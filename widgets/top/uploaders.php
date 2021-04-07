<?php defined('VALID') or die('Nuh-uh!'); ?>
	<div class="header col-lg-12">
		<h2 class="ap-1 bg-header">TOP UPLOADERS</h2>
	</div>
<?php
	foreach (fetchAll("SELECT id, nick, uploaded FROM users WHERE uploaded > 0 ORDER BY uploaded DESC LIMIT 5") as $row) {
		$kb = round($row->uploaded / 1000);
		?>
		<div class="col-lg-12 d-flex justify-content-between">
			<a href="/member/<?=urlsafe($row->nick)?>"><?=$row->nick?></a>
			<?=$kb?>kB
		</div>
		<?php
	}
