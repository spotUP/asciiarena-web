<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="header col-12">
	<h2>aSCIIaRENA STATS</h2>
</div>
<div class="col-12 d-flex justify-content-between">
	<span>Collys Online:</span>
	<span><?=fetchOne("SELECT COUNT(*) total FROM collys")->total?></span>
</div>
<div class="col-12 d-flex justify-content-between">
	<span>Pumped Bytes:</span>
	<span><?=fetchOne("SELECT sum(filesize) bytes FROM collys")->bytes?></span>
</div>
<div class="col-12 d-flex justify-content-between">
	<span>Users:</span>
	<span><?=fetchOne("SELECT COUNT(*) users FROM users")->users?></span>
</div>
<div class="col-12 d-flex justify-content-between">
	<span>Comments:</span>
	<span><?=fetchOne("SELECT COUNT(*) comments FROM comments")->comments?></span>
</div>
