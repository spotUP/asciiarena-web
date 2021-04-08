<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid">
	<div class="header col-lg-12 p-0 m-0">
		<h2 class="ap-1 bg-header">MOST VIEWED COLLYS</h2>
	</div>
	<div class="container bg-green m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT * FROM collys ORDER BY view_counter DESC LIMIT 5") as $row) 
		{
			$filename = $row->filename;
			$filename = myTruncate($filename, 12);            // truncate
			$views = $row->view_counter;
			?>
			<div class="col-lg-12 d-flex justify-content-between">
				<a class="magenta" href="/release/<?=$filename?>"><?=$filename?></a>
				<?=$views?>
			</div>
			<?php
		}
		?>
	</div>
</div>
