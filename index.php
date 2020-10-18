<?php
require_once "session.php";
$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
include "header.php";
?>
<div class="col-12 m0 p-0 m-0 apb-1">
	<div class="bs-component">
		<div class="alert alert-dismissible alert-danger hide-on-landscape">
			<button type="button" class="close" data-dismiss="alert">x</button>
			Rotate your phone for a better viewing experience.
		</div>
	</div>
</div>
<div class="row">
	<div class="col-lg-2">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-8">
		<?php widgets([
			["file" => "latest/releases", "header" => "LATEST RELEASES", "columns" => 2],
			["file" => "wall", "header" => "WALL OF FAME"]
		]); ?>
	</div>
	<div class="col-lg-2">
		<?php include "sidebar_right.php"; ?>
	</div>
</div>
<?php include "footer.php"; ?>
