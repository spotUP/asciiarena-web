<?php defined('VALID') or die('Nuh-uh!'); ?>
	<div class="header col-lg-12">
		<h2 class="ap-1 bg-header">NEW USERS</h2>
	</div>
<?php
	foreach (fetchAll("SELECT id, nick, joined FROM users ORDER BY joined DESC LIMIT 5") as $row) {
		$join_date = date("y-m-d", $row->joined);
		?>
		<div class="col-lg-12 d-flex justify-content-between">
			<a class="yellow" href="members/<?=$row->id?>"><?=$row->nick?></a>
			<?=$join_date?>
		</div>
		<?php
	}
