<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid col-12" style="min-height: 160px;">
	<div class="header col-lg-12 m-0 p-0">
		<h2 class="ap-1 bg-header m-0 p-0">USERS ONLINE</h2>
	</div>
	<div class="container col-12 bg-green m-0 p-0 apt-1 apb-1 bg-secondary">

		<?php
		foreach (fetchAll("SELECT id, nick, lastactive FROM users WHERE lastactive > (UNIX_TIMESTAMP()-300) ORDER BY lastactive DESC") as $row) 
		{
			?>
			<div class="col-lg-12">
				<a class="yellow" href="/member/<?=urlsafe($row->nick)?>"><?=$row->nick?></a>
			</div>
			<?php
		}

		$anonymous_online = fetchOne("SELECT COUNT(DISTINCT(session)) online FROM users_online")->online;
		$registered_online = fetchOne("SELECT COUNT(*) online FROM users WHERE lastactive > (UNIX_TIMESTAMP()-300)")->online;
		?>
		<div class="col-lg-12">
			<span><br><?=$anonymous_online?> anonymous online</span>
		</div>
	</div>
</div>
