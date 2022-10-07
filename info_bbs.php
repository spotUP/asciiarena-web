<?php
require_once "session.php";
require_once "tools/text.php";
$h1 = "BBS iNFO";

$bbs_available = true;
$bbsid = $_GET['bbs'];
$result = fetchOne("select * from bbses where id=:bbsid", [ 'bbsid' => $bbsid ]);
if (isset($result->name)) {
	$showbbs = $result->name;
} else {
	header("HTTP/1.0 404 Not Found");
	$bbs_available = false;
}


include "header.php";
//-----------------------------------------------------------------------------
// bbs INFO
//-----------------------------------------------------------------------------
?>
<div class="modal-body row m-0 p-0">
  <div class="col-lg-8 order-md-1 order-lg-2 order-xl-2">
    <?php
if ($bbs_available) {
         
					$sysop=$result->sysop;
					$address=$result->address;
					$number=$result->number;
          $country=$result->country;
          $software=$result->software;
          if ($result->online) {
            $online="Yes";
          } else {
            $online="No";
          }
           
 					if (empty($software))
					{
						$software="Unknown";
					}

					if (empty($sysop))
					{
						$sysop="Unknown";
					}

					if (empty($address))
					{
						$address="Unknown";
					}

					if (empty($number))
					{
						$number="Unknown";
					}

          if (empty($country))
					{
						$country="Unknown";
					}          
          
	                        ?>

      <div class="row apb-1">
        <div class="header col-lg-12">
          <h2 class="ap-1 bg-header"><?=$showbbs?></h2>
        </div>
      </div>

      <div class="row apt-1">
        <div class="col-4">
          <span class="white">Name: </span><?=$showbbs?>
        </div>
        <div class="col-4">
          <span class="white">Sysop: </span><?=$sysop?>
        </div>
        <div class="col-4">
          <span class="white">Online: </span><?=$online?>
        </div>
      </div>
      <div class="row">
        <div class="col-4">
          <span class="white">Address: </span><?=$address?> 
        </div>

        <div class="col-4">
          <span class="white">Number: </span><?=$number?>
        </div>
        <div class="col-4">
          <span class="white">Country: </span><?=$country?>
        </div>
        <div class="col-4">
          <span class="white">Software: </span><?=$software?>
        </div>
      </div>
    <?php

  ?>
        <?php if (is_admin()) { ?>
        <div class="amt-1" >
        <form action="/admin.php#bbs" method="post" id="edit-bbs">
          <input type="hidden" name="getbbsid" value="<?=$bbsid?>">
          <input type="hidden" name="open_edit_bbs_field" value="1">
          <input type="submit" class="btn-big amb-1" name="edit_bbs" value="Edit">
        </form>
        </div>
        <?php } ?>

  <?php

} else {
	                        ?>
                                <div class="row">
                                        <div class="col-lg-12">
                                                <div class="bs-component aml-1 amb-1">
                                                        <div class="alert alert-danger">
                                                                 bbs not found
                                                        </div>
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
<?php include "footer.php"; ?>
