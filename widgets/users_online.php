<?php defined('VALID') or die('Nuh-uh!'); ?>

<div class="header col-lg-12">
	<h2 class="ap-1 bg-header">USERS ONLINE</h2>
</div>

<?php
	foreach (fetchAll("SELECT id, nick, lastactive FROM users WHERE lastactive > (UNIX_TIMESTAMP()-300) ORDER BY lastactive DESC") as $row) {
		?>
		<div class="col-lg-12">
			<a class="yellow" href="members/<?=$row->id?>"><?=$row->nick?></a>
		</div>
		<?php
	}

	$anonymous_online = fetchOne("SELECT COUNT(DISTINCT(session)) online FROM users_online")->online;
	$registered_online = fetchOne("SELECT COUNT(*) online FROM users WHERE lastactive > (UNIX_TIMESTAMP()-300)")->online;
?>
<div class="col-lg-12" style="min-height: 64px;">
	<?=$anonymous_online?> anonymous online
</div>
