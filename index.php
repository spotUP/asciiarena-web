<?php
require_once "session.php";
$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
include "header.php";
?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-md-0 p-md-0 m-sm-1 p-sm-1">
		<?php widgets([
			"message_alerts",
			["file" => "latest/releases", "header" => "LATEST RELEASES", "columns" => 2],
			["file" => "wall"],
//			["file" => "cedd_sessions"],
			["file" => "latest/comments"],
		]); ?>
	</div>
	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>
</div>
<?php include "footer.php"; ?>
