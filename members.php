<?php
	require_once "session.php";

	$user_id = $_current[ 0 ] ?? 0;
	$member = fetchOne("SELECT * FROM users WHERE id = :id", [":id" => $user_id], ["password", "pwhash", "temp_pw_hash"]);

	if(empty($member->id)) {
		header("Location: /");
		exit();
	}

	$h1 = "MEMBER INFO";
	include "header.php";
?>

	<div class="modal-body row m-0 p-0">
		<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2">


			<div class="position-relative">
				<div class="row">
					<div class="col-2">
						<span>Nick: </span>
						<span class="yellow"><?=$member->nick?></span>
					</div>
					<div class="col-10">
						<span>Status: </span>
						<span class="yellow"><?=$member->rank?></span>
					</div>
				</div>
				<?php if(!empty($member->crew) && !empty($member->country)) { ?>
					<div class="row">
						<?php if(!empty($member->crew)) { ?>
							<div class="col-2">
								<span>Crew: </span>
								<span class="yellow"><?=$member->crew?></span>
							</div>
						<?php }
							if(!empty($member->country)) { ?>
								<div class="col-10">
									<span>Country: </span>
									<span class="yellow"><?=$country_list[ $member->country ]?></span>
								</div>
							<?php } ?>
					</div>
				<?php }
					if($member->rank === "Admin") {
						?>
						<div class="jump" style="position: absolute; right: 15px; top: -12px; z-index: 11;">
							<img class="position-absolute" style="right: 0; top: -40px; z-index: 11;"
							     src="/assets/data/sticker_king.png" alt="Admin">
						</div>
						<?php
					}
					if(!empty($member->messenger) && ($member->display_messenger === "Yes")) {
						?>
						<div style="background: #ff0000; padding-left: 4px; width: 70px; float: left;">
							MSN/ICQ:
						</div>

						<div style="padding-left: 4px; width: 620px; float: left;">
							<?=spamFix($member->messenger)?>
						</div>
						<?php
					}
				?>
				<div class="content_small_divider"></div>
				<?php
					if(!empty($member->mail) && ($member->display_mail === "Yes")) {
						?>
						Mail:
						<?=spamFix($member->mail)?>
						<?php
					}
					$kb = round($member->uploaded / 1000);
					if($kb >= 20000) {
						?>
						<div class="waggle" style="position: absolute; right: 15px; top: -12px; z-index: 11;">
							<img src="/assets/data/sticker_pumper.png" alt="Pumper">
						</div>
						<?php
					}
					$comment_amount = fetchOne("SELECT COUNT(*) total FROM comments WHERE user_id = :uid", [":uid" => $member->id])->total;
					if($comment_amount >= 300) {
						?>
						<img class="position-absolute" style="right: 100px; top: -30px; z-index: 11;"
						     src="/assets/data/sticker_supporter.png" alt="Commenter">
						<?php
					}
					$colly_amount = fetchOne("SELECT COUNT(*) total from collys where uploader_id = :uid", [":uid" => $member->id])->total;
					if(!empty($comment_amount) && !empty($colly_amount)) {
						if(empty($comment_amount)) {
							?>
							<div class="row">
								<div class="col-12">
									<br><?=$member->nick?> has pumped up <?=$colly_amount?> collys (<?=$kb?> kB)
								</div>
							</div>
							<?php
						}
						if(!empty($comment_amount)) {
							?>
							<div class="row">
								<div class="col-12">
									<?php
										echo "<br>{$member->nick} has pumped up {$colly_amount} collys ({$kb} kB) and commented {$comment_amount} collys.";
									?>
								</div>
							</div>
							<?php
						}
					} ?>
			</div>
			<?php if(!empty($comment_amount)) {
				?>
				<div class="row" style="margin-top: 16px; margin-bottom: 16px;">
					<div class="col-12"><h1>Last 10 comments by <?=$member->nick?></h1></div>
				</div>
				<?php
				foreach(fetchAll("SELECT * FROM comments WHERE user_id = :uid ORDER BY timestamp DESC LIMIT 10", [":uid" => $member->id]) as $row) {
					?>
					<div class="row">
						<div class="col-2">
							<a class="lightgreen"
							   href="/info_release.php?filename=<?=base64_encode($row->filename)?>"><?=myTruncate($row->filename, 12)?></a>
						</div>
						<div class="col-10"><?=myTruncate(fixOutputPost($row->comment, ($row->base64)), 80, " ", "...")?></div>
					</div>
					<?php
				}
			}
				$upped = fetchOne("SELECT COUNT(*) total FROM collys WHERE uploader_id = :uid", [":uid" => $member->id])->total;
				if($upped > 0) {
					?>
					<div class="row" style="margin-top: 16px;">
						<div class="col-12"><h1>Last 10 collys added by <?=$member->nick?></h1></div>
					</div>

					<div class="row" style="margin-top: 16px;">
						<div class="col-4"><span>NAME</span></div>
						<div class="col-4"><span>ARTiST</span></div>
						<div class="col-4"><span>CREW</span></div>
					</div>
					<?php
					foreach(fetchAll("SELECT * FROM collys WHERE uploader_id = :uid GROUP BY filename ORDER BY MAX(timestamp) DESC LIMIT 10", [":uid" => $member->id]) as $row) {
						?>
						<div class="row">
							<div class="col-4">
								<a href="/info_release.php?filename=<?=base64_encode($row->filename)?>"><?=myTruncate($row->name, 24, " ", "...")?></a>
							</div>
							<div class="col-4">
								<a href="/info_artist.php?artist=<?=base64_encode($row->artists)?>&sort_by=filename"><?=$row->artists?></a>
							</div>
							<div class="col-4"><a href="/info_crew.php?crew=<?=base64_encode($row->crews)?>&sort_by=filename"><?=$row->crews?></a>
							</div>
						</div>
						<?php
					}
				}
				$faves = fetchAll("SELECT * FROM favourites WHERE user_id = :uid", [":uid" => $member->id]);
				if(count($faves) > 0) { ?>
					<div class="row" style="margin-top: 16px;">
						<div class="col-12"><h1><?=$member->nick?>'s Favourites</h1></div>
					</div>
					<div class="row" style="margin-top: 16px;">
						<div class="col-4"><span>NAME</span></div>
						<div class="col-4"><span>ARTiST</span></div>
						<div class="col-4"><span>CREW</span></div>
					</div>
				<?php
					foreach($faves

					as $fave) {
					foreach(fetchAll("SELECT * FROM collys WHERE filename = :filename GROUP BY filename ORDER BY filename", [":filename" => $fave->filename]) as $row) {
					$encoded_filename = base64_encode($row->filename);
				?>
					<div class="row" id="colly-row-<?=$row->colly_id?>">
						<div class="col-4">
							<a
								href="/info_release.php?filename=<?=$encoded_filename?>"><?=myTruncate($row->name, 24, " ", "...")?></a>
						</div>
						<div class="col-4">
							<a href="/info_artist.php?artist=<?=base64_encode($row->artists)?>&sort_by=filename"><?=$row->artists?></a>
						</div>
						<div class="col-4">
							<a href="/info_crew.php?crew=<?=base64_encode($row->crews)?>&sort_by=filename"><?=$row->crews?></a>
							<?php if($member->id === $_user[ "id" ]) { ?>
								<input type="submit" class="float-right remove-button" data-id="<?=$row->colly_id?>" value="Remove">
							<?php } ?>
						</div>
					</div>
				<?php
					}
					} ?>
					<script>
						$(".remove-button").on("click", function () {
							const url = `/cmds/unfave/${$(this).data("id")}`;
							$.ajax(
								url
							).done(data => {
								if (data.status === true) {
									$(`#colly-row-${data.id}`).fadeOut(300, function () {
										$(this).remove();
									});
								}
							});
						});
					</script>
				<?php }
			?>
		</div>
		<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
			<?php include "sidebar.php"; ?>
		</div>
		<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
			<?php include "sidebar_right.php"; ?>
		</div>
	</div>
<?php
	require_once "footer.php";
