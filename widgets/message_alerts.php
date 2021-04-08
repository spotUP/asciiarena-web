<?php defined('VALID') or die('Nuh-uh!');
$messages = fetchOne("SELECT COUNT(*) messages FROM messages WHERE postedto = :nick AND new = 1", [":nick" => $_user[ "nick" ]])->messages;
if (!$messages) {
	return;
}
?>

<div class="bs-component col-12">
	<div class="animate__animated animate__bounce animate__delay-2s alert alert-dismissible alert-primary bg-secondary">
		<button type="button" class="close" data-dismiss="alert">x</button>
		<a class="cyan" href="messages.php">You have <?=$messages?> new message<?=($messages > 1) ? "s" : ""?></a>
	</div>
</div>