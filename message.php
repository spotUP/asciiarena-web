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
			?>
			<div class="modal-body row m-0 p-0">
				<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
					<?php
//-----------------------------------------------------------------------------
// WRITE NEW MESSAGE TO DB
//-----------------------------------------------------------------------------

					if (isset($_POST[ 'postnewmessage' ]) && (isset($_GET[ 'post' ]))) {

						$postername = $_user['nick'];
						$posttomember = $_POST[ 'posttomember' ];
						$postsubject = $_POST[ 'postsubject' ];
						$postmessage = $_POST[ 'postmessage' ];

						if (empty($posttomember)) {
							?>
							<div class="headline">
								Error
							</div>

							<div class="content">
								You must select a receiver!
							</div>
							<?php
							exit;
						}
						if (empty($postsubject)) {
							?>
							<div class="headline">
								Error
							</div>

							<div class="content">
								You must fill the subject field!
							</div>
							<?php
							exit;
						}
						if (empty($postmessage)) {
							?>
							<div class="headline">
								Error
							</div>

							<div class="content">
								You must fill the message field!
							</div>
							<?php
							exit;
						}

						$ask = $_db->prepare("SELECT thread FROM messages ORDER BY thread DESC LIMIT 1");
						$ask->execute();
						$row = $ask->fetch(PDO::FETCH_OBJ);
						$thread = $row->thread;
						if (empty($thread)) {
							$thread = 0;
						}
						$thread++;

						$now = time();
						$ask = $_db->prepare("INSERT INTO messages (thread, postedto, postername, timestamp, subject, message, new, unread)
							VALUES (:thread,:posttomember,:postername,:now,:postsubject,:postmessage,1,1)
							");
						$ask->execute([
							'thread' => $thread,
							'posttomember' => $posttomember,
							'postername' => $postername,
							'now' => $now,
							'postsubject' => $postsubject,
							'postmessage' => $postmessage
						]);
						?>
						<meta http-equiv="Refresh" content="0; url=messages.php">
						<?php
					}

//-----------------------------------------------------------------------------
// WRITE REPLY TO DB
//-----------------------------------------------------------------------------	

					if (isset($_POST[ 'do_postreply' ]) && (isset($_GET[ 'post' ]))) {
						if (isset($_POST[ 'thread' ])) {
							$thread = $_POST[ 'thread' ];
						}

						$posttomember = $_POST[ 'posttomember' ];
						$postsubject = $_POST[ 'postsubject' ];
						$postmessage = $_POST[ 'postmessage' ];

						if (empty($posttomember)) {
							?>
							<div class="headline">
								Error
							</div>

							<div class="content">
								You must select a receiver!
							</div>
							<?php
							exit;
						}

						if (empty($postsubject)) {
							?>
							<div class="headline">
								Error
							</div>

							<div class="content_with_blenk"> </div>

							<div class="content">
								You must fill the subject field!
							</div>
							<?php

							exit;
						}

						if (empty($postmessage)) {
							?>
							<div class="headline">
								Error
							</div>

							<div class="content">
								You must fill the message field!
							</div>
							<?php

							exit;
						}

						$postsubject = cleanInsert($postsubject);
						$postmessage = cleanInsertPost($postmessage);
						$now = time();
						$ask = "INSERT INTO messages (thread, postedto, postername, timestamp, subject, message, new, unread) VALUES (:thread,:posttomember,:nick,:now,:postsubject,:postmessage,1,1)";
						doQuery($ask, [
							'thread'       => $thread,
							'posttomember' => $posttomember,
							'nick'         => $nick,
							'now'          => $now,
							'postsubject'  => $postsubject,
							'postmessage'  => $postmessage
						]);

						?>
						<meta http-equiv="Refresh" content="0; url=messages.php">
						<?php
					}

//-----------------------------------------------------------------------------
// DELETE MESSAGE
//-----------------------------------------------------------------------------

					if (isset($_POST[ 'deletemessage' ])) {
						$deleteid = ($_POST[ 'thread' ]);
						$deletemsgid = ($_POST[ 'messid' ]);

						$ask = $_db->prepare("delete from messages where thread=:deleteid and id=:messid");
						$ask->execute(['deleteid' => $deleteid, 'messid' => $deletemsgid ]);
					}

//-----------------------------------------------------------------------------
// POST REPLY FIELD
//-----------------------------------------------------------------------------

					if (isset($_REQUEST[ 'postreply' ])) {
						if (isset($_POST[ 'thread' ])) {
							$thread = $_POST[ 'thread' ];
						}

						if (isset($_POST[ 'messid' ])) {
							$messid = $_POST[ 'messid' ];
						}

						if (isset($_GET[ 'thread' ])) {
							$thread = $_GET[ 'thread' ];
						}

						if (isset($_GET[ 'messid' ])) {
							$messid = $_GET[ 'messid' ];
						}

						$replymessage = $_GET[ 'replymessage' ] ?? 0;
						?>
						<form action="message.php?post" method="post">
							<?php

							foreach (fetchAll("SELECT * FROM messages WHERE id = :id", [
								":id" => $messid
							]) as $row) {
								$messid = $row->id;
								$thread = $row->thread;
								$messpostedto = $row->postedto;
								$messpostername = $row->postername;
								$messtimestamp = $row->timestamp;
								$messtime = date("D M j o", $messtimestamp);
								$postsubject = $row->subject;
								$postmessage = $row->message;
								$messnew = $row->new;
								$postsubject = ($postsubject);
								$postmessage = ($postmessage);
								?>
								<div class="row">
									<div class="col-6">
										<span class="cyan">Date</span>
										<span class="blue">:</span>
										<span class="white"><?=$messtime?></span>
									</div>
									<div class="col-6">
										<span class="cyan">Subject</span>
										<span class="blue">:</span> <span class="white"><?=$postsubject?></span>
									</div>
								</div>
								<div class="row">
									<div class="col-6">
										<span class="cyan">From</span>
										<span class="blue">:</span>
										<span class="white"><?=$messpostername?></span>
									</div>
									<div class="col-6">
										<span class="cyan">Status </span>  <span class="blue">:</span>
										<span class="white">Private</span>
									</div>
								</div>
								<div class="row">
									<div class="col-6">
										<span class="cyan">To  </span>
										<span class="blue">:</span>
										<span class="white"><?=$messpostedto?></span>
									</div>
								</div>
								<div class="row">
									<span class="blue">-------------------------------------------------------------------------------------</span>
								</div>
								<?php
								$update = $_db->prepare("update messages set new=0 where thread=:thread");
								$update->execute(['thread' => $thread]);
							}
							$rows = fetchAll("select * from messages where thread = :thread", [ 'thread' => $thread ]);
							foreach($rows as $row) {
								$messpostername = $row->postername;
								$messtimestamp = $row->timestamp;
								$messtime = date("Y-m-d H:i", $messtimestamp);
								$postsubject = $row->subject;
								$postmessage = htmlspecialchars($row->message);
								$signature = "- - - [ $messpostername ] - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -";
								$signature = myTruncate($signature, 86);
								?>
								<div class="row">
									<div class="col-12">
										<span class="white"><pre><?=$postmessage?></pre></span>
									</div>
								</div>
								<div class="row">
									<div class="col-12">
										<span class="blue"><?=$signature?></span>
									</div>
								</div>
								<?php
							}
							?>
							<div class="row">
								<div class="col-12">
									<textarea rows="16" cols="82" name="postmessage" id="postreply"></textarea>
									<input type="hidden" name=posttomember value="<?=$messpostername?>">
									<input type="hidden" name="thread" value="<?=$thread?>">
									<input type="hidden" name="postsubject" value="<?=$postsubject?>">
								</div>
							</div>
							<div class="row">
								<div class="col-12">
									<input type="submit" name="do_postreply" value="Send">
								</div>
							</div>
						</form>
						<script type="text/javascript">
							document.getElementById('postreply').focus();
						</script>
						<?php
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






