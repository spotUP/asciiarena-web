<?php defined('VALID') or die('Nuh-uh!'); ?>
	<div class="header col-lg-12">
		<h2 class="ap-1 bg-header">TOP COMMENTERS</h2>
	</div>
<?php
	foreach (fetchAll("SELECT COUNT(user_id) AS topcommentators, nick, user_id FROM comments GROUP BY user_id ORDER BY topcommentators DESC LIMIT 5") as $row) {
		?>
		<div class="col-lg-12 d-flex justify-content-between">
			<a class="yellow" href="members/<?=$row->user_id?>"><?=$row->nick?></a>
			<?=$row->topcommentators?>
		</div>
		<?php
	}
