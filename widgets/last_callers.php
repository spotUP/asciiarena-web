<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid col-12 apl-1 apr-1">
	<div class="header col-lg-12 m-0 p-0">
		<h2 class="ap-1 bg-header">LAST CALLERS</h2>
	</div>
	<div class="container col-12 m-0 p-0 apt-1 apl-1 apr-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT user_id, nick, timestamp FROM lastusers ORDER BY timestamp DESC LIMIT {$limit}") as $row) 
		{ 
			?>
			<div class="col-lg-12 d-flex justify-content-between m-0 p-0">
				<a class="yellow text-truncate" href="/member/<?=urlsafe($row->nick)?>"><?=$row->nick?></a>
				<?=Date("H:i", $row->timestamp)?>
			</div>
			<?php
		}
		?>
	</div>
</div>
