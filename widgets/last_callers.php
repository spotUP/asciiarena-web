<div class="container fluid bg-secondary">
	<?php defined('VALID') or die('Nuh-uh!');
	foreach (fetchAll("SELECT user_id, nick, timestamp FROM lastusers ORDER BY timestamp DESC LIMIT {$limit}") as $row) 
	{ 
		?>
		<div class="col-lg-12 d-flex justify-content-between m-0 p-0">
			<a class="yellow" href="/member/<?=urlsafe($row->nick)?>"><?=$row->nick?></a>
			<?=Date("H:i", $row->timestamp)?>
		</div>
		<?php
	}
	?>
</div>
<?php