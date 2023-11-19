<?php
require_once "session.php";
$h1 = "SUBMIT";
include "header.php";
?>
<script type="text/javascript">
	$(document).ready(function() {
		var hash = window.location.hash;
		hash && $('ul.nav a[href="' + hash + '"]').tab('show');

		window.addEventListener('hashchange', function(){
			var hash = window.location.hash;
			hash && $('ul.nav a[href="' + hash + '"]').tab('show');
    	});
	});
</script>
<script type="text/javascript">
	function add_artist_field()
	{
		var newselect = " <select class=\"select2\" name=\"artist[]\"" + document.getElementById('total_artists').value + "><option value=\"Unknown\">Unknown</option><?php

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
	function add_crew_field()
	{
		var newselect = " <select class=\"select2\" name=\"crew[]\"" + document.getElementById('total_crews').value + "><option value=\"Unknown\">Unknown</option><?php

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
	function add_artist_crew_field()
	{
		var newselect = " <select class=\"select2\" name=\"artist_crew[]\"" + document.getElementById('total_artist_crews').value + "><option value=\"Unknown\">Unknown</option><?php
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
	function add_crew_bbs_field()
	{
		var newselect = " <select class=\"select2\" name=\"add_crew_bbs[]\"" + document.getElementById('total_crew_bbses').value + "><option value=\"Unknown\">Unknown</option><?php
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
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
		<?php
		if (is_logged_in())
		{
			?>
			<div class="row">
				<div class="col-lg-12">
					<div class="bs-component">
						<ul class="apl-1 nav nav-tabs apt-1 bg-header">
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
								<a class="nav-link" data-toggle="tab" href="#app">App</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#ascii_mag">Mag</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#request">Request</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" data-toggle="tab" href="#sitelogo">Logo</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
			<div id="myTabContent" class="tab-content apt-1" style="background-color: #1a1a1a;">
				<?php
        		$admin_edit=false;
				include ("edit_colly.php");
				include ("edit_crew.php");
				include ("edit_artist.php");
				include ("edit_bbs.php");
				include ("edit_app.php");
				include ("edit_mag.php");
				include ("edit_request.php");
        include ("edit_site_logo.php");
				?>
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
	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>
</div>
<?php include "footer.php"; ?>
