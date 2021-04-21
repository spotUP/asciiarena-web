<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid col-12 p-0 pl-lg-2 pr-lg-2" style="min-height: 160px;">
	<div class="header col-lg-12 p-0">
		<h2 class="ap-1 bg-header">aSCIIaRENA STATS</h2>
	</div>
	<div class="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
			<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
			<span class="white text-truncate">Collys Online:</span>
			<span class="text-truncate"><?=fetchOne("SELECT COUNT(*) total FROM collys")->total?></span>
		</div>
			<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
			<span class="white text-truncate">Pumped Bytes:</span>
			<span class="text-truncate"><?=formatBytes(fetchOne("SELECT sum(filesize) bytes FROM collys")->bytes)?></span>
		</div>
			<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
			<span class="white text-truncate">Users:</span>
			<span class="text-truncate"><?=fetchOne("SELECT COUNT(*) users FROM users")->users?></span>
		</div>
			<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
			<span class="white text-truncate">Comments:</span>
			<span class="text-truncate"><?=fetchOne("SELECT COUNT(*) comments FROM comments")->comments?></span>
		</div>
	</div>
</div>
