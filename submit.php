<?php
require_once "session.php";
$h1 = "SUBMIT";
include "header.php";
?>
<script type="text/javascript">
	$(document).ready(function() {
		var hash = window.location.hash;
		hash && $('ul.nav a[href="' + hash + '"]').tab('show');
		  setTimeout(function() { window.scrollTo(0, 0); }, 1)
	});
</script>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
		<?php
		if (is_logged_in())
		{
			include ("submit_check_colly.php");
			include ("submit_check_crew.php");
			include ("submit_check_artist.php");
			include ("submit_check_bbs.php");
			include ("submit_check_app.php");
			include ("submit_check_mag.php");
			?>
			<div class="row">
				<div class="col-lg-12">
					<div class="bs-component">
						<ul class="nav nav-tabs apt-1 bg-secondary">
							<li class="nav-item">
								<a class="nav-link active" data-toggle="tab" href="#colly">Colly</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#crew">Crew</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#artist">Artist</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#bbs">BBS</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#app">APP</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#ascii_mag">MAG</a>
							</li>
						</ul>
						<div id="myTabContent" class="tab-content">
							<?php
							include ("submit_colly.php");
							include ("submit_crew.php");
							include ("submit_artist.php");
							include ("submit_bbs.php");
							include ("submit_app.php");
							include ("submit_mag.php");
							?>
						</div>
					</div>
				</div>
				<?php
			}
			else
			{
				?>
				<div class="col-lg-12">
					<div class="bs-component">
						<div class="animate__animated animate__shakeX alert alert-dismissible alert-primary">
							<button type="button" class="close" data-dismiss="alert">x</button>
							You need to be <a class="ascii" data-toggle="modal" style="padding-right: 8px;" href="#login">logged in</a>to use this feature.
						</div>
					</div>
				</div>
				<?php
			}
			?>
		</div>
	</div>
	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>
</div>
<?php include "footer.php"; ?>
