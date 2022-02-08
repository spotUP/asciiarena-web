<?php
	require_once "session.php";
	$h1 = "wELCOME tO aSCIIaRENA";
	include "header.php";
?>
<div class="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
	<div class="header col-lg-12 p-0">
		<h2 class="ap-1 bg-header">ALLTIME TOP UPLOADERS</h2>
	</div>
	<div class="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT id, nick, uploaded FROM users WHERE uploaded > 0 ORDER BY uploaded DESC LIMIT 10") as $row) {
			$kb=formatBytes($row->uploaded);
			?>
			<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
				<a href="/member/<?=urlsafe($row->nick)?>"><?=$row->nick?></a>
				<?=$kb?>
			</div>
			<?php
		}
		?>
	</div>
</div>

<div class="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
	<div class="header col-lg-12 p-0">
		<h2 class="ap-1 bg-header">ALLTIME TOP 10 CREWS</h2>
	</div>
	<div class="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT name, rating FROM crews ORDER BY rating DESC LIMIT 10") as $row) {
			$crew_ratings = $row->rating;
			$crew_ratings = sprintf("%0.2f", $row->rating);
			$crew = $row->name;

			?>
			<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
				<a class="text-truncate" href="/crew/<?=urlsafe($crew)?>/"><?=$row->name?></a>
				<span class="text-truncate"><?=$crew_ratings?> PTS</span>
			</div>
			<?php
		}
		?>
	</div>
</div>


<div class="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
	<div class="header col-lg-12 p-0">
		<h2 class="ap-1 bg-header">ALLTIME TOP 10 COLLYS</h2>
	</div>
	<div class="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT filename,rating from collys where filename in (select filename from comments group by filename having count(commentid) > 3) order by rating desc limit 10;") as $row) {
			$filename = htmlentities($row->filename);
			$colly_rating = sprintf("%0.2f", $row->rating)
			?>
			<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
				<a class="magenta text-truncate" href="/release/<?=$filename?>"><?=$filename?></a>
				<span class="text-truncate"><?=$colly_rating?> PTS</span>
			</div>
			<?php
		}
		?>
	</div>
</div>

<div class="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
	<div class="header col-lg-12 p-0">
		<h2 class="ap-1 bg-header">ALLTIME TOP 10 ARTISTS</h2>
	</div>
	<div class="container col-12 m-0 p-0 apt-1 apb-1 bg-secondary">
		<?php
		foreach (fetchAll("SELECT nick, rating FROM artists ORDER BY rating DESC LIMIT 10") as $row) {
			$artist = $row->nick;
			$artist_rating = sprintf("%0.2f", $row->rating);
			?>
			<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
				<a class="green text-truncate" href="/artist/<?=urlsafe($artist)?>"><?=$row->nick?></a>
				<span class="text-truncate"><?=$artist_rating?> PTS</span>
			</div>
			<?php
		}
		?>
	</div>
</div>

