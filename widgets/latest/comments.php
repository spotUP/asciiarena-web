<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="header col-lg-12">
	<h2 class="ap-1 am-0 bg-header">LATEST COMMENTS</h2>
</div>

<div class="container-fluid apt-1 p-0 p-lg-2">
	<div class="col-12 bg-secondary apt-1 apb-1">
		<div class="row apb-1">
			<div class="col-6 col-sm-7 text-truncate">
				<span class="white text-truncate">COMMENT</span>
			</div>
			<div class="col-sm-3 text-truncate d-none d-sm-block">
				<span class="white">COLLY</span>
			</div>
			<div class="col-6 col-sm-2 text-truncate">
				<span class="white float-right">NiCK</span>
			</div>
		</div>
		<?php
		foreach(fetchAll("SELECT * FROM comments ORDER BY timestamp DESC LIMIT 10") as $row) {
			?>
			<div class="row">
				<div class="col-sm-7 cyan">
					<a class="cyan" style="white-space: pre-wrap;" href="/release/<?=$row->filename?>"><?=($row->comment)?></a>
				</div>
				<div class="col-6 col-sm-3 mb-4 mb-sm-0 text-truncate">
					<a class="magenta text-truncate" href="/release/<?=$row->filename?>"><?=$row->filename?></a>
				</div>
				<div class="col-6 col-sm-2 mb-4 mb-sm-0 text-truncate">
					<a class="yellow text-truncate float-right" href="/member/<?=$row->nick?>"><?=$row->nick?></a>
				</div>
			</div>
			<?php
		}
		?>
	</div>
</div>
