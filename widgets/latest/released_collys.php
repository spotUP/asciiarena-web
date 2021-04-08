<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="container fluid">
	<div class="header col-lg-12 m-0 p-0">
		<h2 class="ap-1 bg-header"><a href="/collys.php?sort_by=releasedate">NEW COLLYS</a> <a href='/rss.php?id=0'>[RSS]</a></h2>
	</div>
	<div class="container m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT * FROM collys ORDER BY year DESC, month DESC, day DESC, timestamp DESC limit {$limit}") as $row) 
		{
			$latestreleased = $row->filename;
			$latestreleased = myTruncate($latestreleased, 12);            // truncate
			$release_year = $row->year;
			$release_year = substr($release_year, 2);
			$release_month = $row->month;
			$release_day = $row->day;
			$filename = $row->filename;
			if (empty($release_year)) 
			{
				$release_year = "xx";
			}
			if (empty($release_month)) 
			{
				$release_month = "xx";
			}
			if (empty($release_day)) 
			{
				$release_day = "xx";
			}

			if (($release_month < 10) && ($release_month !== "xx")) 
			{
				$release_month = "0$release_month";
			}

			if (($release_day < 10) && ($release_day !== "xx")) 
			{
				$release_day = "0$release_day";
			}

			?>
			<div class="col-lg-12 d-flex justify-content-between">
				<a class="magenta" href="/release/<?=$filename?>"><?=$latestreleased?></a>
				<?=$release_year?>-<?=$release_month?>-<?=$release_day?>
			</div>
			<?php
		}
		?>
	</div>
</div>
