<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
	<div class="header col-lg-12 p-0">
		<h2 class="ap-1 bg-header text-truncate lightgreen"><a class="lightgreen" href="/collys.php?sort_by=uploaddate">LATEST ADDED COLLYS</a> 
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
			<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
				<a class="magenta text-truncate" href="/release/<?=$filename?>"><?=$colly?></a>
				<span class="text-truncate"><?=$upload_date?></span>
			</div>
			<?php
		}
		?>
	</div>
</div>
