<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid">
	<div class="header col-lg-12 m-0 p-0">
		<h2 class="ap-1 bg-header">TOP COMMENTERS</h2>
	</div>
	<div class="container bg-green m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT COUNT(user_id) AS topcommentators, nick, user_id FROM comments GROUP BY user_id ORDER BY topcommentators DESC LIMIT 5") as $row) {
			?>
			<div class="col-lg-12 d-flex justify-content-between">
				<a class="yellow" href="/member/<?=urlsafe($row->nick)?>"><?=$row->nick?></a>
				<?=$row->topcommentators?>
			</div>
			<?php
		}
		?>
	</div>
</div>
<?php