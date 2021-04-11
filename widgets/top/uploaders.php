<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid col-12 apl-1 apr-1">
	<div class="header col-lg-12 m-0 p-0">
		<h2 class="ap-1 bg-header">TOP UPLOADERS</h2>
	</div>
	<div class="container col-12 bg-green m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT id, nick, uploaded FROM users WHERE uploaded > 0 ORDER BY uploaded DESC LIMIT 5") as $row) {
			$kb=formatBytes($row->uploaded);
			?>
			<div class="col-lg-12 d-flex justify-content-between">
				<a href="/member/<?=urlsafe($row->nick)?>"><?=$row->nick?></a>
				<?=$kb?>
			</div>
			<?php
		}
		?>
	</div>
</div>
