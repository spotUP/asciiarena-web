<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid col-12 apl-1 apr-1">
	<div class="header col-12 p-0 m-0">
		<h2 class="ap-1 bg-header">aSCIIaRENA STATS</h2>
	</div>
	<div class="container col-12 bg-green m-0 p-0 apt-1 apb-1 bg-secondary">
		<div class="col-12 d-flex justify-content-between">
			<span class="white">Collys Online:</span>
			<span><?=fetchOne("SELECT COUNT(*) total FROM collys")->total?></span>
		</div>
		<div class="col-12 d-flex justify-content-between">
			<span class="white">Pumped Bytes:</span>
			<span><?=formatBytes(fetchOne("SELECT sum(filesize) bytes FROM collys")->bytes)?></span>
		</div>
		<div class="col-12 d-flex justify-content-between">
			<span class="white">Users:</span>
			<span><?=fetchOne("SELECT COUNT(*) users FROM users")->users?></span>
		</div>
		<div class="col-12 d-flex justify-content-between">
			<span class="white">Comments:</span>
			<span><?=fetchOne("SELECT COUNT(*) comments FROM comments")->comments?></span>
		</div>
	</div>
</div>
