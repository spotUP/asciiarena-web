<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid">
	<div class="header col-lg-12 m-0 p-0">
		<h2 class="ap-1 bg-header">NEW USERS</h2>
	</div>
	<div class="container bg-green m-0 p-0 apt-1 apb-1 bg-secondary">

		<?php
		foreach (fetchAll("SELECT id, nick, joined FROM users ORDER BY joined DESC LIMIT 5") as $row) {
			$join_date = date("y-m-d", $row->joined);
			?>
			<div class="col-lg-12 d-flex justify-content-between">
				<a class="yellow" href="/member/<?=urlsafe($row->nick)?>"><?=$row->nick?></a>
				<?=$join_date?>
			</div>
			<?php
		}
		?>
	</div>
</div>
