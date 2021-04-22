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
	<link rel="stylesheet" href="/assets/css/bootstrap.css" media="screen">
	<link rel="stylesheet" href="/assets/css/bootstrap-colorselector.css" media="screen">
	<link rel="stylesheet" href="/assets/css/site.css" media="screen">
	<script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
	<script src="https://unpkg.com/@popperjs/core@2"></script>
	<script src="/assets/js/bootstrap.bundle.js"></script>
	<script src="/assets/js/bootstrap-colorselector.js"></script>
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
			var newselect = " <select class=\"custom-select\" name=\"colly_crew[]\"" + document.getElementById('total_colly_crews').value + "><option>Independent</option><?php
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
			var newselect = " <select class=\"custom-select\" name=\"artist[]\"" + document.getElementById('total_artists').value + "><option value=\"Unknown\">Unknown</option><?php

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
			var newselect = " <select class=\"custom-select\" name=\"crew[]\"" + document.getElementById('total_crews').value + "><option value=\"Unknown\">Unknown</option><?php

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
			var newselect = " <select class=\"custom-select\" name=\"artist_crew[]\"" + document.getElementById('total_artist_crews').value + "><option value=\"Unknown\">Unknown</option><?php

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
			var newselect = " <select class=\"custom-select\" name=\"colly_author[]\"" + document.getElementById('total_colly_authors').value + "><option value=\"Unknown\">Unknown</option><?php

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
			var newselect = " <select class=\"custom-select\" name=\"colly_crew[]\"" + document.getElementById('total_colly_crews').value + "><option>Independent</option><?php

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
			var newselect = " <select class=\"custom-select\" name=\"add_bbs[]\"" + document.getElementById('total_bbses').value + "><option value=\"Unknown\">Unknown</option><?php

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
			var newselect = " <select class=\"custom-select\" name=\"add_crew_bbs[]\"" + document.getElementById('total_crew_bbses').value + "><option value=\"Unknown\">Unknown</option><?php

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

<body>
	<div id="spotclose" class="spotclose" onclick='myFunction()'><div class="noevents">x</div></div>
	<div class="scanlines"></div>
	<div class="vignette"></div>
	<div class="navbar navbar-expand-lg fixed-top navbar-dark bg-white d-flex justify-content-between m-0 p-0" style="height: 22px; margin-bottom: 2px; padding-right: 2px;">
		<span style="margin-left: 16px;" class="ncommm">NComm 2.0 Copyright 1988-1992 Daniel Bloch & co.</span>
		<span><a href="/accounting.php"><img src="/assets/data/multitask.png" alt=""></a></span>
	</div>
	<div class="navbar navbar-expand-lg fixed-top bg-blue m-0 p-0" style="top: 22px; height: 21px">
		<div class="container-fluid m-md-0 p-md-0">
			<a href="/" style="color: #fff" class="navbar-brand ascii">aSCIIaRENA</a>
			<a class="navbar-toggler ascii" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">mENU</a>
			<div class="collapse navbar-collapse justify-content-center" id="navbarResponsive">
				<ul class="navbar-nav">
					<li class="nav-item dropdown">
						<a class="nav-link dropdown-toggle ascii apr-1" data-toggle="dropdown" href="/collys.php?sort_by=releasedate" id="themes">COLLYS<span class="caret" style="padding-right: 8px;"></span></a>
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
						</ul>
					</div>

				</div>







			</div>










			<div class="container">
				<nav class="navbar navbar-inverse">
					<div class="navbar-header">
						<button class="navbar-toggle" type="button" data-toggle="collapse" data-target=".js-navbar-collapse">
							<span class="sr-only">Toggle navigation</span>
							<span class="icon-bar"></span>
							<span class="icon-bar"></span>
							<span class="icon-bar"></span>
						</button>
						<a class="navbar-brand" href="#">My Store</a>
					</div>

					<div class="collapse navbar-collapse js-navbar-collapse">
						<ul class="nav navbar-nav">
							<li class="dropdown mega-dropdown">
								<a href="#" class="dropdown-toggle" data-toggle="dropdown">Men <span class="caret"></span></a>				
								<ul class="dropdown-menu mega-dropdown-menu">
									<li class="col-sm-3">
										<ul>
											<li class="dropdown-header">Men Collection</li>                            
											<div id="menCollection" class="carousel slide" data-ride="carousel">
												<div class="carousel-inner">
													<div class="item active">
														<a href="#"><img src="http://placehold.it/254x150/ff3546/f5f5f5/&text=New+Collection" class="img-responsive" alt="product 1"></a>
														<h4><small>Summer dress floral prints</small></h4>                                        
														<button class="btn btn-primary" type="button">49,99 €</button> <button href="#" class="btn btn-default" type="button"><span class="glyphicon glyphicon-heart"></span> Add to Wishlist</button>       
													</div><!-- End Item -->
													<div class="item">
														<a href="#"><img src="http://placehold.it/254x150/3498db/f5f5f5/&text=New+Collection" class="img-responsive" alt="product 2"></a>
														<h4><small>Gold sandals with shiny touch</small></h4>                                        
														<button class="btn btn-primary" type="button">9,99 €</button> <button href="#" class="btn btn-default" type="button"><span class="glyphicon glyphicon-heart"></span> Add to Wishlist</button>        
													</div><!-- End Item -->
													<div class="item">
														<a href="#"><img src="http://placehold.it/254x150/2ecc71/f5f5f5/&text=New+Collection" class="img-responsive" alt="product 3"></a>
														<h4><small>Denin jacket stamped</small></h4>                                        
														<button class="btn btn-primary" type="button">49,99 €</button> <button href="#" class="btn btn-default" type="button"><span class="glyphicon glyphicon-heart"></span> Add to Wishlist</button>      
													</div><!-- End Item -->                                
												</div><!-- End Carousel Inner -->
												<!-- Controls -->
												<a class="left carousel-control" href="#menCollection" role="button" data-slide="prev">
													<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
													<span class="sr-only">Previous</span>
												</a>
												<a class="right carousel-control" href="#menCollection" role="button" data-slide="next">
													<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
													<span class="sr-only">Next</span>
												</a>
											</div><!-- /.carousel -->
											<li class="divider"></li>
											<li><a href="#">View all Collection <span class="glyphicon glyphicon-chevron-right pull-right"></span></a></li>
										</ul>
									</li>
									<li class="col-sm-3">
										<ul>
											<li class="dropdown-header">Features</li>
											<li><a href="#">Auto Carousel</a></li>
											<li><a href="#">Carousel Control</a></li>
											<li><a href="#">Left & Right Navigation</a></li>
											<li><a href="#">Four Columns Grid</a></li>
											<li class="divider"></li>
											<li class="dropdown-header">Fonts</li>
											<li><a href="#">Glyphicon</a></li>
											<li><a href="#">Google Fonts</a></li>
										</ul>
									</li>
									<li class="col-sm-3">
										<ul>
											<li class="dropdown-header">Plus</li>
											<li><a href="#">Navbar Inverse</a></li>
											<li><a href="#">Pull Right Elements</a></li>
											<li><a href="#">Coloured Headers</a></li>                            
											<li><a href="#">Primary Buttons & Default</a></li>							
										</ul>
									</li>
									<li class="col-sm-3">
										<ul>
											<li class="dropdown-header">Much more</li>
											<li><a href="#">Easy to Customize</a></li>
											<li><a href="#">Calls to action</a></li>
											<li><a href="#">Custom Fonts</a></li>
											<li><a href="#">Slide down on Hover</a></li>                         
										</ul>
									</li>
								</ul>				
							</li>
							<li class="dropdown mega-dropdown">
								<a href="#" class="dropdown-toggle" data-toggle="dropdown">Women <span class="caret"></span></a>				
								<ul class="dropdown-menu mega-dropdown-menu">
									<li class="col-sm-3">
										<ul>
											<li class="dropdown-header">Features</li>
											<li><a href="#">Auto Carousel</a></li>
											<li><a href="#">Carousel Control</a></li>
											<li><a href="#">Left & Right Navigation</a></li>
											<li><a href="#">Four Columns Grid</a></li>
											<li class="divider"></li>
											<li class="dropdown-header">Fonts</li>
											<li><a href="#">Glyphicon</a></li>
											<li><a href="#">Google Fonts</a></li>
										</ul>
									</li>
									<li class="col-sm-3">
										<ul>
											<li class="dropdown-header">Plus</li>
											<li><a href="#">Navbar Inverse</a></li>
											<li><a href="#">Pull Right Elements</a></li>
											<li><a href="#">Coloured Headers</a></li>                            
											<li><a href="#">Primary Buttons & Default</a></li>							
										</ul>
									</li>
									<li class="col-sm-3">
										<ul>
											<li class="dropdown-header">Much more</li>
											<li><a href="#">Easy to Customize</a></li>
											<li><a href="#">Calls to action</a></li>
											<li><a href="#">Custom Fonts</a></li>
											<li><a href="#">Slide down on Hover</a></li>                         
										</ul>
									</li>
									<li class="col-sm-3">
										<ul>
											<li class="dropdown-header">Women Collection</li>                            
											<div id="womenCollection" class="carousel slide" data-ride="carousel">
												<div class="carousel-inner">
													<div class="item active">
														<a href="#"><img src="http://placehold.it/254x150/3498db/f5f5f5/&text=New+Collection" class="img-responsive" alt="product 1"></a>
														<h4><small>Summer dress floral prints</small></h4>                                        
														<button class="btn btn-primary" type="button">49,99 €</button> <button href="#" class="btn btn-default" type="button"><span class="glyphicon glyphicon-heart"></span> Add to Wishlist</button>       
													</div><!-- End Item -->
													<div class="item">
														<a href="#"><img src="http://placehold.it/254x150/ff3546/f5f5f5/&text=New+Collection" class="img-responsive" alt="product 2"></a>
														<h4><small>Gold sandals with shiny touch</small></h4>                                        
														<button class="btn btn-primary" type="button">9,99 €</button> <button href="#" class="btn btn-default" type="button"><span class="glyphicon glyphicon-heart"></span> Add to Wishlist</button>        
													</div><!-- End Item -->
													<div class="item">
														<a href="#"><img src="http://placehold.it/254x150/2ecc71/f5f5f5/&text=New+Collection" class="img-responsive" alt="product 3"></a>
														<h4><small>Denin jacket stamped</small></h4>                                        
														<button class="btn btn-primary" type="button">49,99 €</button> <button href="#" class="btn btn-default" type="button"><span class="glyphicon glyphicon-heart"></span> Add to Wishlist</button>      
													</div><!-- End Item -->                                
												</div><!-- End Carousel Inner -->
												<!-- Controls -->
												<a class="left carousel-control" href="#womenCollection" role="button" data-slide="prev">
													<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
													<span class="sr-only">Previous</span>
												</a>
												<a class="right carousel-control" href="#womenCollection" role="button" data-slide="next">
													<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
													<span class="sr-only">Next</span>
												</a>
											</div><!-- /.carousel -->
											<li class="divider"></li>
											<li><a href="#">View all Collection <span class="glyphicon glyphicon-chevron-right pull-right"></span></a></li>
										</ul>
									</li>
								</ul>				
							</li>
							<li><a href="#">Store locator</a></li>
						</ul>
						<ul class="nav navbar-nav navbar-right">
							<li class="dropdown">
								<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">My account <span class="caret"></span></a>
								<ul class="dropdown-menu" role="menu">
									<li><a href="#">Action</a></li>
									<li><a href="#">Another action</a></li>
									<li><a href="#">Something else here</a></li>
									<li class="divider"></li>
									<li><a href="#">Separated link</a></li>
								</ul>
							</li>
							<li><a href="#">My cart (0) items</a></li>
						</ul>
					</div><!-- /.nav-collapse -->
				</nav>
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






