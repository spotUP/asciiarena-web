<?php defined('VALID') or die('Nuh-uh!');
header('Content-Type: text/html; charset=UTF-8');
$logos = [];
foreach(fetchAll("SELECT ascii FROM logos ORDER BY RAND() limit 10") as $logo) {
	$logos[] = '<a href="/" class="logo ascii"><pre style="overflow: hidden;"><span class="magenta">' . $logo->ascii . '</span></pre></a>';
}
include "header_ascii.php";
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
	<link rel="stylesheet" href="/assets/css/bootstrap.min.css" media="screen">
	<link rel="stylesheet" href="/assets/css/bootstrap-colorselector.css" media="screen">
	<link rel="stylesheet" href="/assets/css/site.css" media="screen">
	<script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
	<script src="/assets/js/bootstrap.bundle.min.js"></script>
	<script src="/assets/js/bootstrap-colorselector.js"></script>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>

	<link href="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/css/select2.min.css" rel="stylesheet" />
	<script src="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js"></script>
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
	<div id="spotclose" class="spotclose" onclick='showFullscreen()'><div class="noevents">x</div></div>
	<?php if (!isset($_user['settings']['crt_effect']) || $_user['settings']['crt_effect'] === 'Y') { ?>
	<div class="scanlines"></div>
	<?php } ?>
	<div class="vignette"></div>
	<div class="navbar navbar-expand-lg fixed-top navbar-dark bg-white d-flex justify-content-between m-0 p-0" style="height: 22px; margin-bottom: 2px; padding-right: 2px;">
		<span style="margin-left: 16px;" class="ncommm">NComm 2.0 Copyright 1988-1992 Daniel Bloch & co.</span>
		<span><a href="/accounting.php"><img src="/assets/data/multitask.png" alt="" width="23" height="22"></a></span>
	</div>
	<div class="navbar navbar-expand-lg fixed-top bg-blue m-0 p-0" style="top: 22px; height: 21px">
		<div class="container-fluid m-md-0 p-md-0">
			<a href="/" style="color: #fff" class="navbar-brand ascii">aSCIIaRENA</a>
			<a class="navbar-toggler ascii" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">mENU</a>
			<div class="collapse navbar-collapse justify-content-center" id="navbarResponsive">
				<ul class="navbar-nav">
					<li class="nav-item dropdown">
						<a class="nav-link dropdown-toggle ascii apr-1" data-toggle="dropdown" href="/collys.php?sort_by=date" id="themes">COLLYS<span class="caret" style="padding-right: 8px;"></span></a>
						<div class="dropdown-menu ascii" aria-labelledby="themes">
							<a class="dropdown-item ascii" href="/collys.php?sort_by=name">By Name<span style="padding-left: 7px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>
							<a class="dropdown-item ascii" href="/collys.php?sort_by=filename">By Filename<span style="padding-left: 4px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;&nbsp;</span></a>
							<a class="dropdown-item ascii" href="/collys.php?sort_by=nick">By Artist<span style="padding-left: 10px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>
							<a class="dropdown-item ascii" href="/collys.php?sort_by=crew">By Crew<span style="padding-left: 10px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></a>
							<a class="dropdown-item ascii" href="/collys.php?sort_by=date">By Release Date<span style="font-size: 16px; font-family:Monaco, monospace;">&nbsp;</span></a>
							<a class="dropdown-item ascii" href="/collys.php?sort_by=uploaddate">By Upload Date<span style="padding-left: 8px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;</span></a>
							<a class="dropdown-item ascii" href="/collys.php?sort_by=uploader">By Uploader<span style="padding-left: 13px; font-size: 16px; font-family:Monaco, monospace;">&nbsp;&nbsp;&nbsp;</span></a>
						</div>
					</li>
					<li class="nav-item">
						<a class="nav-link ascii apr-1" href="/mags.php">MAGS</a>
					</li>
					<li class="nav-item">
						<a class="nav-link ascii apr-1" href="/apps.php">APPS</a>
					</li>
					<li class="nav-item">
						<a class="nav-link ascii apr-1" href="/artists.php?sort_by=nick">ARTiSTS</a>
					</li>
					<li class="nav-item">
						<a class="nav-link ascii apr-1" href="/crews.php">CREWS</a>
					</li>

					<li class="nav-item">
						<a class="nav-link ascii apr-1" href="/about.php">ABOUT</a>
					</li>
					<li class="nav-item">
						<a class="nav-link ascii apr-1" href="/fonteditor.php">ASCII STYLE DESIGNER</a>
					</li>
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
					<ul class="nav navbar-nav menu-right">
						<?php
						if(!is_logged_in()) 
						{
							?>
							<li class="nav-item">
								<a class="nav-link ascii yellow apr-1" data-toggle="modal" style="padding-right: 8px;" href="#login">LOGiN</a>
							</li>
							<?php
						} 

						if(is_logged_in()) 
						{
							?>
							<li class="nav-item dropdown">
								<a class="nav-link dropdown-toggle ascii yellow" style="padding-right: 8px;" data-toggle="dropdown" href="#">ACCOUNT<span class="caret" style="padding-right: 8px;"></span></a>
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
										<a class="nav-link dropdown-toggle ascii yellow" style="padding-right: 8px;" data-toggle="dropdown" href="/admin.php" id="themes">ADMiN<span class="caret" style="padding-right: 8px;"></span></a>
										<div class="dropdown-menu dropdown-menu-fix bg-red ascii" aria-labelledby="themes">
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
						</ul>
					</div>
				</div>
			</div>
			<div class="container-fluid mobile-bg">
				<div class="row" style="padding-top: 58px; padding-bottom: 16px;">
					<div class="col-12 d-flex justify-content-center m-0 p-0 m-md-0 p-md-0 m-sm-1 p-sm-1">
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
						<div class="row ml-0 pl-0 mr-0 pr-0">
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
				<div class="row">
					<div class="col-lg-12">
						<div class="bs-component aml-1 amb-1 apl-1 apr-1 apt-1">
							<div class="animate__animated animate__tada alert alert-dismissible alert-danger hide-on-landscape">
								<button type="button" class="close" data-dismiss="alert">x</button>
								Rotate your phone for a better viewing experience.
							</div>
						</div>
					</div>
				</div>

