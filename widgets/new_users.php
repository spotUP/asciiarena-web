<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
	<div class="header col-lg-12 p-0">
		<h2 class="ap-1 bg-header">NEW USERS</h2>
	</div>
	<div class="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT id, nick, joined FROM users ORDER BY joined DESC LIMIT 5") as $row) {
			$join_date = date("y-m-d", $row->joined);
			?>
			<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
				<a class="yellow text-truncate" href="/member/<?=urlsafe($row->nick)?>"><?=$row->nick?></a>
				<span class="text-truncate"><?=$join_date?></span>
			</div>
			<?php
		}
		?>
	</div>
</div>
