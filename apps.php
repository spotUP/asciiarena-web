<?php
require_once "session.php";
$h1 = "aPPLiCATiONS";

$is_search = (isset($_POST['search'])) ? true : false;
$searchquery = $_POST['search'] ?? "";
if(strlen($searchquery) < 3) $is_search = false;
$viewmode = $_GET['viewmode'] ?? "Standard";

$sort_order = strtolower($_GET['sort_order']) ?? "";
switch ($sort_order) {
	case "desc": $sort_order = 'DESC'; $osort_order = 'asc'; break;
	default: $sort_order = 'ASC'; $osort_order = 'desc'; break;
}
$sort_by = $_GET['sort_by'] ?? "";
switch ($sort_by) {
  case "name": $sort_criteria = "name"; break;
  case "filename": $sort_criteria = "filename"; break;
  case "release": $sort_criteria = "filedate"; break;
  case "author": $sort_criteria = "a.author"; break;
  case "uploader": $sort_criteria = "uploader"; break;
  default:
  $sort_criteria = "name";
  $sort_by = "name";
  break;
}
$sort_criteria .= ' '.$sort_order;

require_once "header.php"; ?>

<div class="modal-body row m-0 p-0">
  <div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0">
    <div class="row apl-1 apb-1 apt-0">
      <div class="col-4 bg-secondary apb-1">
       <?php
       require_once "pagination.php";
       $limit = "LIMIT 30";
       $pageno = $_GET['pageno'] ?? 1;
       $rows_per_page = ($viewmode === "BBS") ? 6 : 30;
       $pagination = pagination("apps", $pageno, $rows_per_page, "viewmode={$viewmode}&sort_by={$sort_by}&sort_order={$sort_order}");

       if (!$is_search) {
         echo $pagination[ "pager" ];
       }
       ?>
     </div>
     <div class="col-3 apt-1 bg-secondary apb-1">
      <div class="btn-group" role="group" aria-label="Button group with nested dropdown">
        <div class="btn-group" role="group">
          <button id="btnGroupDrop1" type="button" class="btn btn-primary dropdown-toggle w-100" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">View Mode:</button>
          <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
            <a class="dropdown-item" href="apps.php?sort_by=releasemonth&viewmode=Standard">Standard</a>
            <a class="dropdown-item" href="apps.php?sort_by=releasemonth&viewmode=BBS">BBS</a>
          </div>
        </div>
      </div>
    </div>
    
    <div class="col-5 apt-1 bg-secondary apb-1">
      <form action="?sort_by=<?=$sort_criteria?>&sort_order=<?=$sort_order?>&viewmode=<?=$viewmode?>" method="post">
        <span class="amr-1 d-none d-sm-block"><input placeholder="Search..." type="text" name="search" autocomplete="off" class="w-100" style="background-color: #555 !important;" value="<?=$searchquery?>"></span>
      </form>
    </div>

    <div class="container-fluid bg-secondary apb-1">
      <div class="d-none d-sm-block text-truncate text-center">
       <span class="green">- --/\-\/- -</span> <span class="cyan">aSCIIaRENA</span> <span class="red">--=*=-- </span><span class="pink">[<?=date("D")?>, the <?=date("d-m-y")?>]</span><span class="red"> --=*=-- </span> <span class="cyan">aSCIIaRENA</span> <span class="green"> - -/\-\/- -- -</span><br><br>
     </div>
   </div>

   <?php
   if ($is_search) {
    $ask = "SELECT a.*,u.upload_signature FROM apps a
    LEFT JOIN users u ON a.uploader=u.nick
    WHERE name LIKE :searchquery
    OR filename LIKE :searchquery
    OR author LIKE :searchquery
    {$pagination['limit']}";
    $rows = fetchAll($ask, [":searchquery" => '%'.$searchquery.'%']);
  } else {
    $ask = "SELECT a.*,u.upload_signature FROM apps a 
    LEFT JOIN users u ON a.uploader=u.nick 
    ORDER BY {$sort_criteria}
    {$pagination['limit']}";
    $rows = fetchAll($ask);
  }

  if ($viewmode === "BBS") {
   ?>
   <div class="container bg-secondary apb-1">
    <?php
    foreach ($rows as $row) {
     ?>
     <div class="row apt-1">
       <div class="col-6 col-am-6 text-center text-md-left">
         <a href="/application/<?=$row->filename?>"><span class="cyan" style="margin-right: 8px;"><?=$row->filename?></span></a> <span class="green" style="margin-right: 16px;">PF--</span> <span class="yellow" style="margin-right: 8px;"><?=$row->filesize?></span> <span class="yellow"><?=date("d.m.y", $row->timestamp);?></span>
       </div>
       <div class="col-6 col-sm-6 apb-1 text-center text-md-left">
         <?php
         $file_id = $row->filename.'.diz';
         $dirname = @array_shift(explode(".", $row->filename));
         if (file_exists('apps/'.$dirname.'/'.$file_id)) { 
           $display_file_id = file_get_contents('apps/'.$dirname.'/'.$file_id); 
           $display_file_id=utf8_encode($display_file_id);
           ?>
           <pre class="ascii magenta overflow-hidden"><a class="ascii magenta" href="/magazine/<?=$row->filename?>"><?=$display_file_id?></a></pre>
         <?php } ?>
       </div>
     </div>
     <div class="row apb-1">
       <div class="col-12 col-sm-6"></div>
       <div class="col-12 col-sm-6 text-center text-md-left">
         <span class="pink text-right"><?=$row->upload_signature?></span>
       </div>
     </div>
     <div class="row apb-2">
       <div class="col-12 col-sm-6"></div>
       <div class="col-12 col-sm-6 text-center text-md-left d-none d-sm-block">
         <span class="green text-right">[ aSCIIaRENa ] [ FREE LEECH ] [ aSCIIaRENa ]</span>
       </div>
       <div class="col-12 col-sm-6 text-center text-md-left">
        <span class="green text-right block d-sm-none">[ aSCIIaRENa ] [ FREE LEECH ]</span>
      </div>
    </div>
    <?php
  }
  ?>
</div>
<?php
} else {
  ?>
  <div class="container bg-secondary apb-1">
    <div class="row amb-1">
      <div class="col-4 col-sm-4"><span class="white"><a href="?sort_by=filename&sort_order=<?=$osort_order?>">FILENAME</a></span></div>
      <div class="col-4 col-sm-4"><span class="white"><a href="?sort_by=name&sort_order=<?=$osort_order?>">NAME</a></span></div>
      <div class="col-4 col-sm-4 text-truncate"><span class="white"><a href="?sort_by=author&sort_order=<?=$osort_order?>">AUTHOR</a></span></div>
    </div>
    <?php
    foreach ($rows as $row) {
     ?>
     <div class="row">
      <div class="col-4 col-sm-4 text-truncate">
        <a class="magenta" href="/application/<?=$row->filename?>"><?=$row->filename?></a>
      </div>
      <div class="col-4 col-sm-4 text-truncate">
        <a class="magenta" href="/application/<?=$row->filename?>"><?=$row->name?></a>
      </div>
      <div class="col-4 col-sm-4 green text-truncate">
       <span class="yellow"><?=$row->author?></span>
     </div>
   </div>
   <?php
 } ?>
</div>
<?php
}
?>
</div>
</div>

<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
  <?php include('sidebar.php'); ?>
</div>

<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
  <?php include('sidebar_right.php'); ?>
</div>
</div>
</div>
<?php include('footer.php'); ?>
