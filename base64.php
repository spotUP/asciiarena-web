<?php
require_once "session.php";
$h1 = "wELCOME tO aSCIIaRENA";
include "header.php";

$ask="select * from comments where base64=1";
$result=fetchAll($ask);
foreach($result as $row)
{
    $base64=$row->base64;
    $comment=$row->comment;
	$decoded_comment=base64_decode($comment);

	doQuery("UPDATE comments SET comment = :new_comment WHERE commentid = :commentid", [ 'commentid' => $row->commentid, 'new_comment' => $decoded_comment ]);
	
}

?>

<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
	<?php include "sidebar.php"; ?>
</div>
<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
	<?php include "sidebar_right.php"; ?>
</div>

<?php include "footer.php";


