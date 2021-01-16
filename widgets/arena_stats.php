<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="header col-12 ap-1">
	<h2 class="ap-1">aSCIIaRENA STATS</h2>
</div>
<div class="col-12 d-flex justify-content-between">
	<span>Collys Online:</span>
	<span class="magenta"><?=fetchOne("SELECT COUNT(*) total FROM collys")->total?></span>
</div>
<div class="col-12 d-flex justify-content-between">
	<span>Pumped Bytes:</span>
	<span class="magenta"><?=fetchOne("SELECT sum(filesize) bytes FROM collys")->bytes?></span>
</div>
<div class="col-12 d-flex justify-content-between">
	<span>Users:</span>
	<span class="magenta"><?=fetchOne("SELECT COUNT(*) users FROM users")->users?></span>
</div>
<div class="col-12 d-flex justify-content-between">
	<span>Comments:</span>
	<span class="magenta"><?=fetchOne("SELECT COUNT(*) comments FROM comments")->comments?></span>
</div>
