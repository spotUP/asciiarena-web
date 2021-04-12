<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="header col-lg-12 m-0 p-0 apl-1 apr-1">
	<h2 class="ap-1 bg-header">LATEST COMMENTS</h2>
</div>

<div class="container-fluid">
	<div class="col-12 bg-secondary apt-1 apb-1">
		<div class="row apl-1 apr-1 apb-1">
			<div class="col-7 text-truncate">
				<span class="white text-truncate">COMMENT</span>
			</div>
			<div class="col-3">
				<span class="white text-truncate">COLLY</span>
			</div>
			<div class="col-2">
				<span class="white text-truncate float-right">NiCK</span>
			</div>
		</div>
		<?php
		foreach(fetchAll("SELECT * FROM comments ORDER BY timestamp DESC LIMIT 10") as $row) {
			?>
			<div class="row apl-1 apr-1">
				<div class="col-7 cyan text-truncate">
					<a href="/release/<?=$row->filename?>"><?=fixOutputPost($row->comment)?></a>
				</div>
				<div class="col-3">
					<a class="magenta text-truncate" href="/release/<?=$row->filename?>"><?=$row->filename?></a>
				</div>
				<div class="col-2">
					<a class="yellow text-truncate float-right" href="/member/<?=$row->nick?>"><?=$row->nick?></a>
				</div>
			</div>
			<?php
		}
		?>
	</div>
</div>
