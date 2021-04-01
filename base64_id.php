<?php
require_once "session.php";
$h1 = "wELCOME tO aSCIIaRENA";
include "header.php";

$ask="select * from comments where base64=1";
$result=fetchAll($ask);
foreach($result as $row)
{
 	$commentid=$row->commentid;
	doQuery("UPDATE comments SET base64 = 0 WHERE commentid = $commentid");
	
}

?>

<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
	<?php include "sidebar.php"; ?>
</div>
<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
	<?php include "sidebar_right.php"; ?>
</div>

<?php include "footer.php";


