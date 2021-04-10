<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid col-12 apl-1 apr-1">
	<div class="header col-lg-12 m-0 p-0">
		<h2 class="ap-1 bg-header"><a class="lightgreen" href="/collys.php?sort_by=timestamp">LATEST ADDED COLLYS</a> <a class="lightgreen"
			href="/rss.php?id=1">[RSS]</a>
		</h2>
	</div>
	<div class="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT * FROM collys ORDER BY timestamp DESC LIMIT 5") as $row) 
		{
			$filename = $row->filename;
			$colly = myTruncate($filename, 12);            // truncate
			$upload_date = $row->timestamp;
			$upload_date = date("y-m-d", $upload_date);
			?>
			<div class="col-lg-12 d-flex justify-content-between">
				<a class="magenta" href="/release/<?=$filename?>"><?=$colly?></a>
				<?=$upload_date?>
			</div>
			<?php
		}
		?>
	</div>
</div>
