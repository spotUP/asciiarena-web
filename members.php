<?php
require_once "session.php";

$nickurl = $_GET['member'];
$member = fetchOne("SELECT * FROM users WHERE nickurl = :nickurl", [":nickurl" => $nickurl], ["pwhash"]);
$member_available = true;
if(!isset($_GET['member']) || empty($member->id)) {
	header("HTTP/1.0 404 Not Found");
	$member_available = false;
}

$h1 = "mEMBER iNFO";
include "header.php";
?>
<script>
       function showAlert(content, prependTo) {
                const alertContent = `<div class="bs-component quick-alert"><div id="#success-alert" class="animate__animated animate__bounceIn alert alert-success"
>${content}</div></div>`;
                $(prependTo).prepend(alertContent).children().first().delay(2000).slideUp();
       }
</script>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2" id="member">
		<?php if ($member_available) { ?>
			<div class="position-relative">
				<div class="row">
					<div class="col-sm-4">
						<span class="white">Nick: </span>
						<span class="yellow"><?=$member->nick?></span>
					</div>
					<div class="col-sm-8">
						<span class="white">Status: </span>
						<span class="yellow"><?=$member->rank?></span>
					</div>
				</div>
				<?php if(!empty($member->crew) && !empty($member->country)) { ?>
					<div class="row">
						<?php if(!empty($member->crew)) { ?>
							<div class="col-sm-4">
								<span class="white">Crew: </span>
								<span class="yellow"><?=$member->crew?></span>
							</div>
						<?php }
						if(!empty($member->country)) { ?>
							<div class="col-sm-8">
								<span class="white">Country: </span>
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
					<img class="position-absolute" style="right: 100px; top: -30px; z-index: 11;" src="/assets/data/sticker_supporter.png" alt="Commenter">
					<?php
				}
        ?>
				
        <div class="row apt-1"><a class="button apl-1" href="/messages.php?sendmsg=<?=$member->id?>" ><input type="button" id="btnMsg" class="btn-big" value="Send Message" ></a></div>
        <?php
				
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
				<div class="row apt-1">
					<div class="col-12 apb-1"><h2 class="ap-1 bg-header">Last 10 comments by <?=$member->nick?></h2></div>
				</div>
				<?php
				foreach(fetchAll("SELECT * FROM comments WHERE user_id = :uid ORDER BY timestamp DESC LIMIT 10", [":uid" => $member->id]) as $row) {
					?>
					<div class="row">
						<div class="col-sm-10 amb-1 cyan"><?=$row->comment?></div>
						<div class="col-sm-2 amb-1 mb-md-0 text-truncate"><a class="magenta" href="/release/<?=$row->filename?>"><?=$row->filename?></a></div>
					</div>
					<?php
				}
				?>
				<?php
			}
			$upped = fetchOne("SELECT COUNT(*) total FROM collys WHERE uploader_id = :uid", [":uid" => $member->id])->total;
			if($upped > 0) {
				?>
				<div class="row">
					<div class="col-12 apb-1"><h2 class="ap-1 bg-header">Last 10 collys added by <?=$member->nick?></h2></div>
				</div>

				<div class="row">
					<div class="col-sm-4 apb-1 d-none d-sm-block"><span class="white">NAME</span></div>
					<div class="col-sm-4 apb-1 d-none d-sm-block"><span class="white">ARTiST</span></div>
					<div class="col-sm-4 apb-1 d-none d-sm-block"><span class="white">CREW</span></div>
				</div>
				<?php
				foreach(fetchAll("SELECT c.name,c.filename,
					GROUP_CONCAT(DISTINCT a.nick) as artists,
					GROUP_CONCAT(DISTINCT w.name) as crews 
					FROM collys c
					LEFT JOIN artists_collys ac ON c.id=ac.colly_id
					LEFT JOIN artists a ON ac.artist_id=a.id
					LEFT JOIN collys_crews cc ON c.id=cc.colly_id
					LEFT JOIN crews w ON w.id=cc.crew_id
					WHERE uploader_id = :uid
					GROUP BY filename ORDER BY MAX(timestamp) DESC LIMIT 10", [":uid" => $member->id]) as $row) {
						?>
						<div class="row">
							<div class="col-12 col-sm-4 text-truncate">
								<a class="magenta" href="/release/<?=$row->filename?>"><?=$row->name?></a>
							</div>
							<div class="col-12 d-block d-sm-none text-truncate apb-1">
								by <?=combinize($row->artists, "", "/artist/", $row->artists)?> of <?=combinize($row->crews, "", "/crew/", $row->crews)?>
							</div>
							<div class="col-4 col-sm-4 text-truncate d-none d-sm-block">
								<?=combinize($row->artists, "", "/artist/", $row->artists)?>
							</div>
							<div class="col-sm-4 text-truncate d-none d-sm-block">
								<?=combinize($row->crews, "", "/crew/", $row->crews)?>
							</div>
						</div>
						<?php
					}
				}
				$faves = fetchAll("SELECT c.filename,c.id as colly_id,c.name,
					GROUP_CONCAT(DISTINCT a.nick) as artists,
					GROUP_CONCAT(DISTINCT w.name) as crews 
					FROM favourites f
					LEFT JOIN collys c ON f.colly_id=c.id
					LEFT JOIN collys_crews cc ON f.colly_id=cc.colly_id
					LEFT JOIN crews w ON cc.crew_id=w.id
					LEFT JOIN artists_collys ac ON f.colly_id=ac.colly_id
					LEFT JOIN artists a ON a.id=ac.artist_id
					WHERE f.user_id=:uid
					GROUP BY c.filename", [":uid" => $member->id]);
					if(count($faves) > 0) { ?>
						<div class="row apt-1 apb-1">
							<div class="col-12"><h2 class="ap-1 bg-header"><?=$member->nick?>'s Favourites</h2></div>
						</div>
						<div class="row" class="apb-1">
							<div class="col-sm-4 apb-1 d-none d-sm-block"><span class="white">NAME</span></div>
							<div class="col-sm-3 apb-1 d-none d-sm-block"><span class="white">ARTiST</span></div>
							<div class="col-sm-3 apb-1 d-none d-sm-block"><span class="white">CREW</span></div>
						</div>
						<?php
						foreach($faves as $row) {
							?>
							<div class="row" id="colly-row-<?=$row->colly_id?>">
								<div class="col-12 col-sm-4 ">
									<a class="magenta" href="/release/<?=$row->filename?>"><?=$row->name?></a>
								</div>
								<div class="col-sm-3 d-none d-sm-block">
									<?=combinize($row->artists, "", "/artist/", $row->artists)?>
								</div>
								<div class="col-sm-3 d-none d-sm-block">
									<?=combinize($row->crews, "", "/crew/", $row->crews)?>
								</div>
								<?php if($member->id === $_user[ "id" ]) 
								{ 
									?>
									<div class="col-sm-2 d-none d-sm-block">
										<input type="submit" class="remove-button float-right" data-id="<?=$row->colly_id?>" value="Remove">
									</div>
									<?php 
								} 
								?>
								<div class="col-12 apb-1 d-block d-sm-none">
									by <?=combinize($row->artists, "", "/artist/", $row->artists)?> of <?=combinize($row->crews, "", "/crew/", $row->crews)?>
									<?php if($member->id === $_user[ "id" ]) 
									{ 
										?>
										<input type="submit" class="remove-button float-right" data-id="<?=$row->colly_id?>" value="Remove">
										<?php 
									} 
									?>
								</div>
							</div>
							<?php
						} 
						?>
						<script>
							$(".remove-button").on("click", function () {
								const url = `/cmds.php/unfave/${$(this).data("id")}`;
								$.ajax(
									url
									).done(data => {
										if (data.status === true) {
											$(`#colly-row-${data.id}`).fadeOut(300, function () {
												$(this).remove();
												showAlert('You removed <?=addslashes($row->filename)?> as a favorite.', '#member');
											});
										}
									});
								});
							</script>
						<?php }
					} else {
						?>
						<div class="row">
							<div class="col-lg-12">
								<div class="bs-component aml-1 amb-1">
									<div class="alert alert-danger">
										member not found
									</div>
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
			<?php
			require_once "footer.php";
