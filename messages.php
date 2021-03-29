<?php
include_once "session.php";
$h1 = "MAiL";
include_once "header.php";
?>

<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
		<?php
		if (is_logged_in()) 
		{
//-----------------------------------------------------------------------------
// DELETE MESSAGE
//-----------------------------------------------------------------------------

			if (isset($_POST[ 'deletemessage' ])) {
				$deleteid = ($_POST[ 'thread' ]);

				$ask = $_db->prepare("delete from messages where thread=:deleteid and postedto=:nick");
				$ask->execute(['deleteid' => $deleteid, 'nick' => $nick]);
			}

//-----------------------------------------------------------------------------
// POST NEW MESSAGE
//-----------------------------------------------------------------------------

			?>
			<form action="messages.php?post" method="post">
				<?php

				if (isset($_POST[ 'open_postnewmessage' ])) {
					?>
					<div class="headline">
						New Message
					</div>

					<div class="collys_filename">
						Receiver:
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
					<?php
				}
				?>
			</form>
			<script type="text/javascript">
				document.getElementById('postmessage').focus();
			</script>
			<?php

//-----------------------------------------------------------------------------
// MESSAGE LIST 
//-----------------------------------------------------------------------------

			if (!isset($_POST[ 'open_postnewmessage' ])) 
			{

				?>
				<form enctype="multipart/form-data" action="messages.php" method="post">
					<div class="row apb-1 apl-1">
						<input type="submit" colspan="4" name="open_postnewmessage" value="New Message!">
					</div>
				</form>
				<?php
				foreach (fetchAll("SELECT * FROM messages WHERE postedto = :nick GROUP BY thread ORDER BY timestamp DESC", [":nick" => $_user[ "nick" ]]) as $row) {
					$messid = $row->id;
					$thread = $row->thread;
					$messpostedto = $row->postedto;
					$messpostername = $row->postername;
					$messtimestamp = $row->timestamp;
					$messtime = date("D M j o", $messtimestamp);
					$postsubject = $row->subject;
					$postmessage = $row->message;
					$postsubject = fixOutputPost($postsubject);
					$postmessage = fixOutputPost($postmessage);

					?>
					<form action="message.php" method="post">
						<div class="row">
							<?php
							foreach (fetchAll("SELECT new FROM messages WHERE thread = :thread ORDER BY new DESC LIMIT 1", [":thread" => $thread]) as $row_new) {
								$messnew = $row_new->new;
								if ($messnew == 1) {
									?>
									<div class="col-7">
										<a class="yellow text-truncate !important;" href="message.php?messid=<?=$messid?>&thread=<?=$thread?>&postreply"><?=$postsubject?></a>
									</div>
									<?php
								} else {
									?>
									<div class="col-7">
										<a class="green text-truncate !important;" href="message.php?messid=<?=$messid?>&thread=<?=$thread?>&postreply"><?=$postsubject?></a>
									</div>
									<?php
								}
								?>
								<div class="col-3">
									<span class="cyan">From:</span> <span class="white"><?=$messpostername?></span>
								</div>
								<div class="col-2">
									<input type="hidden" name="thread" value="<?=$thread?>">
									<input type="hidden" name="messid" value="<?=$messid?>">
									<div class="float-right apr-1"><input type="submit" name="deletemessage" value="Delete"></div>
								</div>
							</div>
						</form>
						<?php
					}
				}


			}
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






