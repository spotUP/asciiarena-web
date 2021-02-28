<?php
include_once "session.php";
$h1 = "mAiL";
include_once "header.php";
?>

<?php
if (is_logged_in()) {
//echo "<pre>";print_r($_POST);echo "</pre>";
	?>
	<div class="modal-body row m-0 p-0">
		<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
			<?php
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

			if (!isset($_POST[ 'open_postnewmessage' ])) {
				?>

				<?php

				foreach (fetchAll("SELECT * FROM messages WHERE postedto = :nick GROUP BY thread", [":nick" => $_user[ "nick" ]]) as $row) {
					$messid = $row->id;
					$thread = $row->thread;
					$messpostedto = $row->postedto;
					$messpostername = $row->postername;
					$messtimestamp = $row->timestamp;
					$messtime = date("D M j o", $messtimestamp);
					$postsubject = $row->subject;
					$postmessage = $row->message;
					$postsubject = fixOutputPost($postsubject);
					$postsubject = myTruncate($postsubject, 17, " ", "...");
					$postmessage = fixOutputPost($postmessage);

					?>
					<form enctype="multipart/form-data" action="message.php" method="post">

						<div style="width: 100vw; float: left; display: inline-block;">

							<div style="min-width: 15vw; display: inline-block;">


							<?php

							foreach (fetchAll("SELECT new FROM messages WHERE thread = :thread ORDER BY new DESC LIMIT 1", [":thread" => $thread]) as $row_new) {
								$messnew = $row_new->new;
								if ($messnew == 1) {
									?>
								<a class="yellow" href="messages.php?messid=<?=$messid?>&thread=<?=$thread?>&postreply"><?=$postsubject?></a>
									<?php
								} else {
									?>
								<a class="grey" href="messages.php?messid=<?=$messid?>&thread=<?=$thread?>&postreply"><?=$postsubject?></a>
									<?php
								}

								?>
							</div>

							<div style="min-width: 20vw; display: inline-block;">
								<span class="cyan">From</span><span class="blue">:</span>
								<span class="white"><?=$messpostername?></span>
							</div>

								<div style="display: inline-block; width: 50px;">
									<input type="hidden" name="thread" value="<?=$thread?>">
									<input type="hidden" name="messid" value="<?=$messid?>">
									<input type="submit" name="postreply" value="Read">
								</div>

								<div style="display: inline-block; width: 64px;">
									<input type="hidden" name="thread" value="<?=$thread?>">
									<input type="hidden" name="messid" value="<?=$messid?>">
									<input type="submit" name="deletemessage" value="Delete">
								</div>

							</div>
							<?php
							?>
						</form>
						<?php
					}
				}

				if (!isset($_POST[ 'open_postnewmessage' ])) {
					?>
					<form enctype="multipart/form-data" action="messages.php" method="post">
						<div class="content_right">
							<input type="submit" colspan="4" name="open_postnewmessage" value="New Message!">
						</div>
					</form>
					<?php
				}
			}
		} else {
			?>
			<div class="headline">
				Please Login!
			</div>
			<div class="content">
				You need to be logged in to use this feature.
				<a href=login.php>LOGiN.</a>
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

	<?php include "footer.php";






