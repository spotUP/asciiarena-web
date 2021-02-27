<?php
	include_once "session.php";
	$h1 = "wELCOME tO aSCIIaRENA";
	include_once "header.php";
?>

<?php
	if (is_logged_in()) {
//echo "<pre>";print_r($_POST);echo "</pre>";

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
			$postername = $_user['nick'];
			$postsubject = cleanInsert($postsubject);
			$postmessage = cleanInsertPost($postmessage);
			$now = time();
			$ask = "INSERT INTO messages (thread, postedto, postername, timestamp, subject, message, new, unread) VALUES (:thread,:posttomember,:nick,:now,:postsubject,:postmessage,1,1)";
			doQuery($ask, [
			  'thread'       => $thread,
			  'posttomember' => $posttomember,
			  'nick'         => $postername,
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
			<form action="messages.php?post" method="post">
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
						$postsubject = fixOutputPost($postsubject);
						$postmessage = fixOutputPost($postmessage);

						?>
						<div class="headline">
							<?=$postsubject?>
						</div>

						<div class="collys_filename">
							<cyan>Date</cyan>
							<blue>:</blue>
							<white><?=$messtime?></white>
						</div>

						<div class="collys_file_id">
							<cyan>Subject</cyan>
							<blue>:</blue> <white><?=$postsubject?></white>
						</div>

						<div class="collys_filename">
							<cyan>From</cyan>
							<blue>:</blue>
							<white><?=$messpostername?></white>
						</div>

						<div class="collys_file_id">
							<cyan>Status</cyan>  <blue>:</blue>
							<white>Private</white>
						</div>

						<div class="collys_filename">
							<cyan>To  </cyan>
							<blue>:</blue>
							<white><?=$messpostedto?></white>
						</div>

						<div class="content">
							<blue>-------------------------------------------------------------------------------------</blue>
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

						$postsubject = fixOutputPost($postsubject);
						$postmessage = fixOutputPost($postmessage);

						$signature = "- - - [ $messpostername ] - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -";
						$signature = myTruncate($signature, 86);

						?>
						<div class="content">
							<pre><white><?=$postmessage?></white></pre>
						</div>
						<div class="content">
							<blue><?=$signature?></blue>
						</div>
						<?php
					}

				?>
				<div class="headline">
					Reply
				</div>

				<div class="content_with_blenk">
					<br>
					<textarea rows="16" cols="82" name="postmessage" id="postreply"></textarea>

					<input type="hidden" name=posttomember value="<?=$messpostername?>">
					<input type="hidden" name="thread" value="<?=$thread?>">
					<input type="hidden" name="postsubject" value="<?=$postsubject?>">
					<input type="submit" name="do_postreply" value="Send">
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


			<div class="headline">
				Inbox
			</div>
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
				<form enctype="multipart/form-data" action="messages.php" method="post">

				<div style="width: 100vw; float: left; display: inline-block;">

				<div style="display: inline-block;">
					<span class="cyan">Subject</span><span class="blue">: </span>
				</div>

				<div style="min-width: 15vw; display: inline-block;">
					<span><a href="messages.php?messid=<?=$messid?>&thread=<?=$thread?>&postreply"><?=$postsubject?></a></span>
				</div>

				<div style="min-width: 20vw; display: inline-block;">
					<span class="cyan">From</span><span class="blue">:</span>
					<span class="white"><?=$messpostername?></span>
				</div>
				<?php

				foreach (fetchAll("SELECT new FROM messages WHERE thread = :thread ORDER BY new DESC LIMIT 1", [":thread" => $thread]) as $row_new) {
					$messnew = $row_new->new;
					if ($messnew == 1) {
						?>
						<div style="display: inline-block; width: 135px; display: inline-block;">
							<span class="cyan">Status</span><span class="blue">:</span> <span class="white">NEW!</span>
						</div>
						<?php
					} else {
						?>
						<div style="display: inline-block; width: 135px; display: inline-block;">
							<span class="cyan">Status</span><span class="blue">:</span> <span class="white">Private</span>
						</div>
						<?php
					}

					?>

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
			<br>You need to be logged in to use this feature.<br>
			<a href=login.php>LOGiN.</a><br><br>
		</div>
		<?php
	}
?>
	</div>


<?php include "footer.php";






