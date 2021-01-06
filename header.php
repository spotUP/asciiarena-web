<?php defined('VALID') or die('Nuh-uh!');
	header('Content-Type: text/html; charset=UTF-8');
	$logos = [];
	foreach(fetchAll("SELECT ascii FROM logos ORDER BY RAND() limit 10") as $logo) {
		$logos[] = '<a href="/" class="logo"><pre><span class="magenta">' . utf8_encode(base64_decode($logo->ascii)) . '</span></pre></a>';
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
             ________________    ________   ______________
          ___\__     /  ____/___/    ___/__/______/______/
         /     /    /____      /    /     /      /      /
   _____/__________/__________/__________/______/______/__________
.__\____   \     _     /__________ ________ |     |__\_____      /
|     L/    \       __/_       __/_\_      \|     |      L/     /
|___________/\____\     \___________/_____\       |____________/
     a fugly place \_____\ holder logo     \______|
EOD;
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<title>aSCIIaRENA</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<link rel="icon" href="/favicon.ico" type="image/x-icon">
	<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
	<link rel="stylesheet" href="/assets/css/bootstrap.css" media="screen">
	<link rel="stylesheet" href="/assets/css/site.css" media="screen">
	<script src="https://code.jquery.com/jquery-3.5.1.min.js"
	        integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
	<script src="https://unpkg.com/@popperjs/core@2"></script>
	<script src="/assets/js/bootstrap.bundle.js"></script>
	<style>
		.widget .header {
			margin-bottom: 16px;
		}
	</style>
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

<body>
<div class="scanlines"></div>
<!-- <div class="overlay"></div> -->
<div class="vignette"></div>
<!--<div class="noise"></div> -->
<div class="navbar navbar-expand-lg fixed-top navbar-dark bg-white d-flex justify-content-between"
     style="height: 22px; margin-bottom: 2px; padding-right: 2px;">
	<span style="margin-left: 16px;" class="ncommm">NComm 2.0 Copyright 1988-1992 Daniel Bloch & co.</span>
	<div>
		<a href="/accounting.php"><img src="/assets/data/multitask.png" alt=""></a>
	</div>
</div>
<div class="navbar navbar-expand-lg fixed-top navbar-dark bg-menu" style="top: 22px; border-top: 3px solid black;">
	<div class="container-fluid">
		<a href="/" class="navbar-brand">aSCIIaRENA</a>
		<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarResponsive"
		        aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
			<span class="navbar-toggler-icon"></span>
		</button>
		<div class="collapse navbar-collapse" id="navbarResponsive">
			<ul class="navbar-nav">
				<li class="nav-item dropdown">
					<a class="nav-link dropdown-toggle" style="padding-right: 8px;" data-toggle="dropdown"
					   href="/collys.php?sort_by=releasedate"
					   id="themes">COLLYS<span class="caret" style="padding-right: 8px;"></span></a>
					<div class="dropdown-menu" aria-labelledby="themes">
						<a class="dropdown-item" href="/collys.php?sort_by=name">By Name<span
								style="padding-left: 7px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>
						<a class="dropdown-item" href="/collys.php?sort_by=filename">By Filename<span
								style="padding-left: 4px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;&nbsp;</span></a>
						<a class="dropdown-item" href="/collys.php?sort_by=nick">By Artist<span
								style="padding-left: 10px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>
						<a class="dropdown-item" href="/collys.php?sort_by=releasedate">By Release Date<span
								style="font-size: 16px; font-family:Monaco, monospace;">&nbsp;</span></a>
						<a class="dropdown-item" href="/collys.php?sort_by=timestamp">By Upload Date<span
								style="padding-left: 8px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;</span></a>
						<a class="dropdown-item" href="/collys.php?sort_by=uploader">By Uploader<span
								style="padding-left: 13px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;</span></a>
					</div>
				</li>
				<li class="nav-item">
					<a class="nav-link" style="padding-right: 8px;" href="artists.php?sort_by=nick">ARTiSTS</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" style="padding-right: 8px;" href="crews.php">CREWS</a>
				</li>
				<?php
					if(!is_logged_in()) {
						?>
						<a class="nav-link" data-toggle="modal" style="padding-right: 8px;" href="#login">LOGiN</a>
						<?php
					} else {
						?>
						<li class="nav-item">
							<a class="nav-link" href="/submit.php">SUBMiT</a>
						</li>
						<li class="nav-item dropdown">
							<a class="nav-link dropdown-toggle" data-toggle="dropdown" href="#">ACCOUNT<span class="caret"></span></a>
							<div class="dropdown-menu" aria-labelledby="account">

								<a class="dropdown-item" href="/messages.php">MAiL<span
										style="padding-left: 4px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;</span></a>
								<a class="dropdown-item" href="/crib.php">CRiB<span
										style="padding-left: 4px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;</span></a>
								<div class="dropdown-divider">~~~~~~~~</div>
								<?php
									if(is_admin()) {
										echo "<a class='dropdown-item' href='/admin.php'>ADMiN<span style='padding-left: 5px; font-size: 16px; font-family:Monaco, monospace;'>&nbsp;&nbsp;</span></a>";
									}
								?>
								<div class="dropdown-divider">~~~~~~~~</div>
								<a class="dropdown-item" href="/cmds.php?cmd=logout">LOGOUT<span
										style="padding-left: 7px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;</span></a>
							</div>
						</li>
						<?php
					}
				?>
				<li class="nav-item">
					<a class="nav-link" style="padding-right: 8px;" target="popup"
					   onclick="window.open('/up-rough-amp/index.html','name','width=275,height=450')">MUSIC PLAYER</a>
				</li>
			</ul>
		</div>
	</div>
</div>
<div class="container-fluid" style="padding-top: 40px;">
	<div class="row" style="padding-top: 16px;">
		<div class="col-12 d-flex justify-content-between">
			<pre class="overflow-hidden"><span class="magenta"><?=$stars1?></span></pre>
			<div class="d-none d-lg-block">
				<div id="logoswitcher">
					<div class="logo"><?=implode('</div><div class="logo" style="display: none;">', $logos)?></div>
				</div>
			</div>
			<pre class="overflow-hidden d-lg-none"><span class="magenta"><?=$mobilelogo?></span></pre>
			<pre class="overflow-hidden"><span class="magenta"><?=$stars2?></span></pre>
		</div>
	</div>
	<script>
		switcharoo("#logoswitcher > div", 2500);
	</script>
	<?php if(!empty($h1)) {
		$switcher = (is_array($h1)) ? "switcher" : ""; ?>
		<div class="page-header" style="margin: 16px 0;">
			<div class="row">
				<div class="col-12">
					<h1 class="<?=$switcher?>" style="min-height: 16px;">
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
	<div class="col-12 m0 p-0 m-0 apb-1">
		<div class="bs-component">
			<div class="alert alert-dismissible alert-danger hide-on-landscape">
				<button type="button" class="close" data-dismiss="alert">x</button>
				Rotate your phone for a better viewing experience.
			</div>
		</div>
	</div>
