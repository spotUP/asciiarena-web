<?php
// Autoload all classes in classes/*
spl_autoload_register(function ($class_name) {
  include __DIR__ . "/classes/" . $class_name . '.php';
});

require_once "session.php";
$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
include "header.php";
?>
<div class="row">
	<div class="col-lg-2">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-8">
		<?php widgets([
			["file" => "latest/releases", "header" => "LATEST RELEASES", "columns" => 2],
			["file" => "wall", "header" => "WALL OF FAME"],
		]); ?>
	</div>
	<div class="col-lg-2">
		<?php include "sidebar_right.php"; ?>
	</div>
</div>
<?php include "footer.php"; ?>
