<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
	<div class="header col-lg-12 p-0">
		<h2 class="ap-1 bg-header text-truncate lightgreen"><a class="lightgreen" href="/application/">LATEST ADDED APPS</a> <a class="lightgreen" href="/rss.php?class=0">[RSS]</a></h2>
	</div>
	<div class="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		if (in_array($_user[ "rank" ], ["Elite", "Admin"])) 
		{
			$ask = "SELECT * FROM apps ORDER BY timestamp DESC LIMIT 5";
		} 
		else 
		{
			$ask = "SELECT * FROM apps WHERE status!='Illegal' ORDER BY timestamp DESC LIMIT 5";
		}
		foreach (fetchAll($ask) as $row) 
		{
			$filename = $row->filename;
			$filename = str_replace("&#39;", "'", $filename);        // replace ' with &#39
			$filename = myTruncate($filename, 12);            // truncate
			$filename = str_replace("'", "&#39;", $filename);        // replace ' with &#39
			$upload_date = $row->timestamp;
			$upload_date = date("y-m-d", $upload_date);
			?>
			<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
				<a class="magenta text-truncate" href="/application/<?=$row->filename?>"><?=$filename?></a>
				<span class="text-truncate"><?=$upload_date?></span>
			</div>
			<?php
		}
		?>
	</div>
</div>
