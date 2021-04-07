<?php
include_once "session.php";
$h1 = "mAiL";
include_once "header.php";
?>

<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
		<?php		
		if (is_logged_in()) 
		{

//-----------------------------------------------------------------------------
// POST NEW MESSAGE
//-----------------------------------------------------------------------------

			?>
			<form action="messages.php?post" method="post">
				<?php

				if (isset($_POST[ 'open_postnewmessage' ])) {
					?>

					<div class="row">
						<span class="white">Receiver:</span>
						<select name="posttomember">
							<?php
							$ask = $_db->prepare("SELECT nick FROM users ORDER BY nick ASC");
							$ask->execute();
							$rows = $ask->fetchAll(PDO::FETCH_OBJ);
							foreach($rows as $row) {
								$nick = htmlspecialchars($row->nick);
								echo "<option>$nick</option>";
							}
							?>
						</select>
					</div>
					<div style="float: left; width: 370px;">
						Subject: <input type="text" size="35" name="postsubject">
					</div>
					<div class="content">
						<textarea rows="16" cols="82" name="postmessage" id="postmessage"></textarea>
						<input type="submit" name="postnewmessage" value="Send Message!">
					</div>
				</div>
				<?php
			}
			?>
		</form>
		<script type="text/javascript">
			document.getElementById('postmessage').focus();
		</script>
		<?php
	} 
	else
	{
		?>
		<div class="col-lg-12">
			<div class="bs-component">
				<div class="animate__animated animate__shakeX alert alert-dismissible alert-primary">
					<button type="button" class="close" data-dismiss="alert">x</button>
					You need to be <a class="ascii" data-toggle="modal" style="padding-right: 8px;" href="#login">logged in</a>to use this feature.
				</div>
			</div>
		</div>
		<?php
	}
	?>
</div>
<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
	<?php include "sidebar.php"; ?>
</div>
<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
	<?php include "sidebar_right.php"; ?>
</div>
</div>
<?php include "footer.php"; ?>






