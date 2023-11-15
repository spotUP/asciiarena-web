<?php
require_once "session.php";
$h1 = "BBS";
require_once "header.php";

?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 bg-secondary">

    <?php require_once "paginateslim.php"; ?>

    <?php

	//-----------------------------------------------------------------------------
	// SHOW BBS
	//-----------------------------------------------------------------------------


    ?>

   <div class="row amb-1">
     <div class="col-4">
      <a class="white" onclick="updateSort('Name')">NAME</a>
    </div>
    <div class="col-3">
      <a class="white" onclick="updateSort('sysop')">SYSOP</a>
    </div>
    
  </div>
  <div id="bbsList">
  </div>
</div>

<script>
 function search(v) {
  page = 1;
  sort = $("#sort1").val()
  order = $("#sort2").val()
  filter = v
  getBBS(page,sort,order,filter)
}

function nextPage(e) {
  e.preventDefault(); 
  page = ~~ $("#pageno").val();
  maxpage = ~~ $("#maxpage").val();
  if (page<maxpage) {
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = $("#filter").val()
    getBBS(page+1,sort,order,filter)
  }
}

function prevPage(e) {
  e.preventDefault(); 
  let page = ~~ $("#pageno").val();
  if (page>1) {
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = $("#filter").val()
    getBBS(page-1,sort,order,filter)
  }
}

function firstPage(e) {
  e.preventDefault(); 
  sort = $("#sort1").val()
  order = $("#sort2").val()
  filter = $("#filter").val()
  getBBS(1,sort,order,filter)
}

function lastPage(e) {
  e.preventDefault(); 
  page = $("#maxpage").val();
  sort = $("#sort1").val()
  order = $("#sort2").val()
  filter = $("#filter").val()
  getBBS(page,sort,order,filter)
}

function updateSort(sort) {
  if ($("#sort1").val() == sort) {
    if ($("#sort2").val()=="A") {
      order = "D";
    } else {
      order = "A";
    }

  } else {
    order = "A";
  }
  filter = $("#filter").val()
  getBBS(1,sort,order,filter)
}

function getBBS(page,sort,order,filter) {

  $("#pageno").val(page);
  $("#sort1").val(sort);
  $("#sort2").val(order);

  filter = filter.trim();

  let pagesize = 120
  
  $.get("/cmds.php/get_bbs/"+page+"/"+sort+"/"+order+"/"+"/"+pagesize+"/"+filter, function (data) {
    let bbsList = $("#bbsList");
    bbsList.empty();
    let cnt = 0
    let maxpage = 1;
    console.log(data.length);
    if (data.length>0) {
      cnt = parseInt(data[0].total_count)
      maxpage = Math.trunc((cnt + pagesize - 1)/pagesize);
    }
    $("#maxpage").val(maxpage);
    $("#currpage").text(page+" of "+maxpage);
    $.each(data, function (i, bbs) {
     
      let bbstxt = `
      <div class="row">
      <div class="col-4 text-truncate">
      <a href="${bbs.url}">${bbs.name}</a>
      </div>
      <div class="col-3 green">
      <a href="${bbs.url}">${bbs.sysop}</a>
      </div>
      </div>`;
      bbsList.append(bbstxt);        
    });
    
  });
}


$(function() {
  getBBS(1,'Name','A','');
});
</script>

<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
  <?php include "sidebar.php"; ?>
</div>
<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
  <?php include "sidebar_right.php"; ?>
</div>


<?php include "footer.php"; ?>
</div>
