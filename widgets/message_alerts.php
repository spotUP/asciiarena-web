<?php defined('VALID') or die('Nuh-uh!');
	$messages = fetchOne("SELECT COUNT(*) messages FROM messages WHERE postedto = :nick AND new = 1", [":nick" => $_user[ "nick" ]])->messages;
	if (!$messages) {
		return;
	}
?>
<div class="header col-12"><h2>ALERT!</h2></div>
<div class="col-12">
	<a class="lightgreen" href="messages.php">You have <?=$messages?> new message<?=($messages > 1) ? "s" : ""?></a>
</div>
