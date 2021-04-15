<?php defined('VALID') or die('Nuh-uh!');
header('Content-Type: text/html; charset=UTF-8');
$logos = [];
foreach(fetchAll("SELECT ascii FROM logos ORDER BY RAND() limit 10") as $logo) {
	$logos[] = '<a href="/" class="logo ascii"><pre style="overflow: hidden;"><span class="magenta">' . $logo->ascii . '</span></pre></a>';
}
$stars1 = <<<EOD
__/\__
\    / __/\__
/_  _\ \    /
  \/   /_  _\
  __/\__ \/
  \    /
  /_  _\
    \/
EOD;
$stars2 = <<<EOD
        __/\__
__/\__  \    /
\    /  /_  _\
/_  _\    \/
  \/ __/\__
     \    /
     /_  _\
       \/
EOD;
$mobilelogo = <<<EOD
                                 .
      ______________    _______  ____________
o   ._\___    /  __/___/   ___/_/_____/_____/  o
  . |   L/   /___     /   /    /     /     / .
  __|_______/________/________/_____/_____/_____
._\____   /\___  /_.   _   /____ |   |_\___    /
|   L/   /    |    |   ___/_    \|   |   L/   / 
|_______/ ____|    |_______/___\_____|_______/ .
              |____|spot               .
        o
EOD;
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<title>aSCIIaRENA</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
 	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<link rel="icon" href="/favicon.ico" type="image/x-icon">
	<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
	<link rel="stylesheet" href="/assets/css/bootstrap.css" media="screen">
	<link rel="stylesheet" href="/assets/css/site.css" media="screen">
	<script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
	<script src="https://unpkg.com/@popperjs/core@2"></script>
	<script src="/assets/js/bootstrap.bundle.js"></script>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>


	<script type="text/javascript">
		$("#setRemoveClassBtn").click(function(){
			$("#div1").toggleClass("bigSizeDivs");
		});
	</script>
	<script type="text/javascript">
		function myFunction() {
			var element = document.getElementById("colly");
			element.classList.toggle("fullscreen");
			var element = document.getElementById("blacker");
			element.classList.toggle("show");
			var element = document.getElementById("spotclose");
			element.classList.toggle("show");
		}
	</script>

	<script type="text/javascript">
		function add_colly_crew_field() {
			var newselect = " <select name=\"colly_crew[]\"" + document.getElementById('total_colly_crews').value + "><option>Independent</option><?php
			foreach (fetchAll("SELECT name FROM crews") as $row) {
				echo "<option>{$row->name}</option>";
			}
			echo "</select>\"\n";
			?>
			document.getElementById('new_colly_crew_field').innerHTML = document.getElementById('new_colly_crew_field').innerHTML + newselect; document.getElementById('total_colly_crews').value = parseInt(document.getElementById('total_colly_crews').value) + 1;
		}
	</script>
	<script type="text/javascript">
		function add_artist_field()
		{
			var newselect = " <select name=\"artist[]\"" + document.getElementById('total_artists').value + "><option value=\"Unknown\">Unknown</option><?php

			$ask="select nick from artists";
			$result=fetchAll($ask);
			foreach($result as $row)
			{
				$artists=$row->nick;
				echo "<option>$artists</option>";
			}
			echo "</select>\"\n";
			?>
			document.getElementById('new_artist_field').innerHTML =  document.getElementById('new_artist_field').innerHTML + newselect; document.getElementById('total_artist').value =  parseInt( document.getElementById('total_artists').value) + 1;
		}

	</script>
	<script type="text/javascript">
		function add_crew_field()
		{
			var newselect = " <select name=\"crew[]\"" + document.getElementById('total_crews').value + "><option value=\"Unknown\">Unknown</option><?php

			$ask="select name from crews";
			$result=fetchAll($ask);
			foreach($result as $row)
			{
				$crews=$row->name;
				echo "<option value='$crews'>$crews</option>";
			}
			echo "</select>\"\n";
			?>
			document.getElementById('new_crew_field').innerHTML =  document.getElementById('new_crew_field').innerHTML + newselect; document.getElementById('total_crews').value =  parseInt( document.getElementById('total_crews').value) + 1;
		}

	</script>
	<script type="text/javascript">
		function add_artist_crew_field()
		{
			var newselect = " <select name=\"artist_crew[]\"" + document.getElementById('total_artist_crews').value + "><option value=\"Unknown\">Unknown</option><?php

			$ask="select name from crews";
			$result=fetchAll($ask);
			foreach($result as $row)
			{
				$crews=$row->name;
				echo "<option value='$crews'>$crews</option>";
			}
			echo "</select>\"\n";
			?>
			document.getElementById('new_artist_crew_field').innerHTML =  document.getElementById('new_artist_crew_field').innerHTML + newselect; document.getElementById('total_artist_crews').value =  parseInt( document.getElementById('total_artist_crews').value) + 1;
		}

	</script>
	<script type="text/javascript">
		function add_colly_author_field()
		{
			var newselect = " <select name=\"colly_author[]\"" + document.getElementById('total_colly_authors').value + "><option value=\"Unknown\">Unknown</option><?php

			$ask="select nick from artists";
			$result=fetchAll($ask);
			foreach($result as $row)
			{
				$artists=$row->nick;
				echo "<option>$artists</option>";
			}
			echo "</select>\"\n";
			?>
			document.getElementById('new_colly_author_field').innerHTML =  document.getElementById('new_colly_author_field').innerHTML + newselect; document.getElementById('total_colly_authors').value =  parseInt( document.getElementById('total_colly_authors').value) + 1;
		}

	</script>
	<script type="text/javascript">
		function add_colly_crew_field()
		{
			var newselect = " <select name=\"colly_crew[]\"" + document.getElementById('total_colly_crews').value + "><option>Independent</option><?php

			$ask="select name from crews";
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$crews=$row->name;
				echo "<option value='$crews'>$crews</option>";
			}
			echo "</select>\"\n";
			?>
			document.getElementById('new_colly_crew_field').innerHTML =  document.getElementById('new_colly_crew_field').innerHTML + newselect; document.getElementById('total_colly_crews').value =  parseInt( document.getElementById('total_colly_crews').value) + 1;
		}
	</script>
	<script type="text/javascript">

		function add_bbs_field()
		{
			var newselect = " <select name=\"add_bbs[]\"" + document.getElementById('total_bbses').value + "><option value=\"Unknown\">Unknown</option><?php

			$ask="select name from bbses";
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$add_bbses=$row->name;
				echo "<option>$add_bbses</option>";
			}
			echo "</select>\"\n";
			?>
			document.getElementById('new_bbs_field').innerHTML =  document.getElementById('new_bbs_field').innerHTML + newselect; document.getElementById('total_bbses').value =  parseInt( document.getElementById('total_bbses').value) + 1;
		}
	</script>
	<script type="text/javascript">

		function add_crew_bbs_field()
		{
			var newselect = " <select name=\"add_crew_bbs[]\"" + document.getElementById('total_crew_bbses').value + "><option value=\"Unknown\">Unknown</option><?php

			$ask="select name from bbses";
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$add_bbses=$row->name;
				echo "<option>$add_bbses</option>";
			}
			echo "</select>\"\n";
			?>
			document.getElementById('new_crew_bbs_field').innerHTML =  document.getElementById('new_crew_bbs_field').innerHTML + newselect; document.getElementById('total_crew_bbses').value =  parseInt( document.getElementById('total_crew_bbses').value) + 1;
		}
	</script>
	<script>
		window.switchers = [];

		function switcharoo(selector, delay = 3000, idx, start) {
			if (typeof idx === "undefined") {
				idx = window.switchers.length;
			}
			if (typeof start === "undefined") {
				start = 1;
			}
			window.switchers[idx] = [start, selector, delay];
			window.switchers[idx][3] = setInterval(() => {
				$(`${selector}:nth-child(${window.switchers[idx][0]})`).fadeOut(300, () => {
					$(selector).css("display", "none");
					if (window.switchers[idx][0] === $(`${selector}`).length) {
						window.switchers[idx][0] = 1;
					} else {
						window.switchers[idx][0]++;
					}
					$(`${selector}:nth-child(${window.switchers[idx][0]})`).fadeIn(300);
				});
			}, delay);
		}
	</script>
</head>

<body style="overflow-x: hidden;">
	<div id="spotclose" class="spotclose" onclick='myFunction()'><div class="noevents">x</div></div>
	<div class="scanlines"></div>
	<div class="vignette"></div>
	<div class="navbar navbar-expand-lg fixed-top navbar-dark bg-white d-flex justify-content-between"
	style="height: 22px; margin-bottom: 2px; padding-right: 2px;">
	<span style="margin-left: 16px;" class="ncommm">NComm 2.0 Copyright 1988-1992 Daniel Bloch & co.</span>
	<div>
		<a href="/accounting.php"><img src="/assets/data/multitask.png" alt=""></a>
	</div>
</div>
<div class="navbar navbar-expand-lg fixed-top bg-blue" style="top: 22px; height: 21px">
	<div class="container-fluid m-0 p-0">
		<a href="/" style="color: #fff" class="navbar-brand ascii">aSCIIaRENA</a>
		<a class="navbar-toggler ascii" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">mENU</a>
		<div class="collapse navbar-collapse" id="navbarResponsive">
			<ul class="navbar-nav">
				<li class="nav-item dropdown">
					<a class="nav-link dropdown-toggle ascii" style="padding-right: 8px;" data-toggle="dropdown" href="/collys.php?sort_by=releasedate" id="themes">COLLYS<span class="caret" style="padding-right: 8px;"></span></a>
					<div class="dropdown-menu ascii" aria-labelledby="themes">
						<a class="dropdown-item ascii" href="/collys.php?sort_by=name">By Name<span style="padding-left: 7px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>
						<a class="dropdown-item ascii" href="/collys.php?sort_by=filename">By Filename<span style="padding-left: 4px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;&nbsp;</span></a>
						<a class="dropdown-item ascii" href="/collys.php?sort_by=nick">By Artist<span style="padding-left: 10px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>
						<a class="dropdown-item ascii" href="/collys.php?sort_by=crew">By Crew<span style="padding-left: 10px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>
						<a class="dropdown-item ascii" href="/collys.php?sort_by=releasedate">By Release Date<span style="font-size: 16px; font-family:Monaco, monospace;">&nbsp;</span></a>
						<a class="dropdown-item ascii" href="/collys.php?sort_by=timestamp">By Upload Date<span style="padding-left: 8px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;</span></a>
						<a class="dropdown-item ascii" href="/collys.php?sort_by=uploader">By Uploader<span style="padding-left: 13px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;</span></a>
					</div>
				</li>
				<li class="nav-item">
					<a class="nav-link ascii" style="padding-right: 8px;" href="/artists.php?sort_by=nick">ARTiSTS</a>
				</li>
				<li class="nav-item">
					<a class="nav-link ascii" style="padding-right: 8px;" href="/crews.php">CREWS</a>
				</li>
				<?php
				if(!is_logged_in()) 
				{
					?><a class="nav-link ascii" data-toggle="modal" style="padding-right: 8px;" href="#login">LOGiN</a><?php
				} 
				else 
				{
					?>
					<li class="nav-item dropdown">
						<a class="nav-link dropdown-toggle ascii" style="padding-right: 8px;" data-toggle="dropdown" href="/admin.php" id="themes">SUBMiT<span class="caret" style="padding-right: 8px;"></span></a>
						<div class="dropdown-menu ascii" aria-labelledby="themes">
							<a class="dropdown-item ascii" href="/submit.php">Colly<span style="padding-left: 7px;">       </span></a>
							<a class="dropdown-item ascii" href="/submit.php#crew">Crew<span style="padding-left: 4px;">    </span></a>
							<a class="dropdown-item ascii" href="/submit.php#artist">Artist<span style="padding-left: 10px;">     </span></a>
							<a class="dropdown-item ascii" href="/submit.php#bbs">BBS<span style="font-size: 16px;"> </span></a>
							<a class="dropdown-item ascii" href="/submit.php#app">ASCII App<span style="font-size: 16px;"> </span></a>
							<a class="dropdown-item ascii" href="/submit.php#ascii_mag">ASCII Mag<span style="font-size: 16px;"> </span></a>
						</div>
					</li>
					<li class="nav-item dropdown">
						<a class="nav-link dropdown-toggle ascii" style="padding-right: 8px;" data-toggle="dropdown" href="#">ACCOUNT<span class="caret" style="padding-right: 8px;"></span></a>
						<div class="dropdown-menu ascii" aria-labelledby="account"><a class="dropdown-item ascii" href="/messages.php">Messages<span style="padding-left: 4px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;</span></a>
							<a class="dropdown-item ascii" href="/crib.php">Settings<span style="padding-left: 4px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;</span></a>
							<a class="dropdown-item ascii" href="/cmds.php?cmd=logout">Logout<span
								style="padding-left: 7px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;</span></a>
							</div>
						</li>
						<!--<li class="nav-item"><a class="nav-link ascii" style="padding-right: 8px;" target="popup" onclick="window.open('/up-rough-amp/index.html','name','width=275,height=450')">MUSIC PLAYER </a> </li> -->
						<?php
						if(is_admin()) 
						{
							?>
							<li class="nav-item dropdown">
								<a class="nav-link dropdown-toggle ascii" style="padding-right: 8px;" data-toggle="dropdown" href="/admin.php" id="themes">ADMiN<span class="caret" style="padding-right: 8px;"></span></a>
								<div class="dropdown-menu ascii" aria-labelledby="themes">
									<a class="dropdown-item ascii" href="/admin.php#colly">Edit Colly<span style="padding-left: 7px;">       </span></a>
									<a class="dropdown-item ascii" href="/admin.php#crew">Edit Crew<span style="padding-left: 4px;">    </span></a>
									<a class="dropdown-item ascii" href="/admin.php#artist">Edit Artist<span style="padding-left: 10px;">     </span></a>
									<a class="dropdown-item ascii" href="/admin.php#edituser">Edit User<span style="font-size: 16px;"> </span></a>
									<a class="dropdown-item ascii" href="/admin.php#sitelogo">Edit Logo<span style="padding-left: 8px;"> </span></a>
									<a class="dropdown-item ascii" href="/admin.php#bbs">Edit BBS<span style="padding-left: 13px;">   </span></a>
									<a class="dropdown-item ascii" href="/admin.php#broken">Broken Collys<span style="padding-left: 13px;">   </span></a>
								</div>
							</li>
							<?php
						}
					}
					?>
					<li class="nav-item">
						<a class="nav-link ascii" style="padding-right: 8px;" href="/about.php">ABOUT</a>
					</li>
					<li class="nav-item">
						<a class="nav-link ascii" href="/fonteditor.php">ASCII STYLE DESIGNER </a>
					</li>
				</ul>
			</div>
		</div>
	</div>

	<div class="container-fluid m-0 p-0">
		<div class="row" style="padding-top: 58px; padding-bottom: 16px;">
			<div class="col-12 d-flex justify-content-center">
				<pre class="overflow-hidden d-none d-lg-block" style="position: relative; left: 32px;"><span class="magenta"><?=$stars1?></span></pre>
				<div class="overflow-hidden d-none d-lg-block mx-auto">
					<div id="logoswitcher">
						<div class="logo nolink overflow-hidden"><?=implode('</div><div class="logo nolink" style="display: none;">', $logos)?></div>
					</div>
				</div>
				<pre class="overflow-hidden d-lg-none"><span class="magenta nolink"><?=$mobilelogo?></span></pre>
				<pre class="overflow-hidden d-none d-lg-block aml-1" style="position: relative; left: -32px;"><span class="magenta"><?=$stars2?></span></pre>
			</div>
		</div>
		<script>
			switcharoo("#logoswitcher > div", 60000);
		</script>
		<?php if(!empty($h1)) {
			$switcher = (is_array($h1)) ? "switcher" : ""; ?>
			<div class="page-header">
				<div class="row apl-1 apr-1">
					<div class="col-12">
						<h1 class="bg-header ap-1 <?=$switcher?>" style="min-height: 16px;">
							<span><?php if(!empty($switcher)) {
								echo implode("</span><span style='display: none;'>", $h1);
							} else {
								echo $h1;
							} ?></span>
						</h1>
					</div>
				</div>
			</div>
			<?php if(!empty($switcher)) { ?>
				<script>
					switcharoo(".switcher > span", 2890);
				</script>
			<?php }
		}
		?>
		<div class="col-12 p-0 m-0 apb-1">
			<div class="bs-component">
				<div class="animate__animated animate__tada alert alert-dismissible alert-danger hide-on-landscape">
					<button type="button" class="close" data-dismiss="alert">x</button>
					Rotate your phone for a better viewing experience.
				</div>
			</div>
		</div>
