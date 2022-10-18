<?php
require_once "session.php";
$h1 = "rEQUESTS";
require_once "header.php";
$sort_by = $_GET['sort_by'] ?? "id";
?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 bg-secondary">
		<div class="row">

			<div class="col-12 d-flex justify-content-between">


      <div class="row m-0 apt-1">
        <input type="hidden" id="sort1"><input type="hidden" id="viewmode" value="1"><input type="hidden" id="pageno"><input type="hidden" id="sort1"><input type="hidden" id="sort2"><input type="hidden" id="maxpage"><ul class="pagination"><li class="page-item"> <a onclick="firstPage(event)" href="#" class="page-link" >FIRST</a></li><li class="page-item"> <a onclick="prevPage(event)" href="#" class="page-link" >PREV</a></li><span id="currpage"></span><li class="page-item"> <a onclick="nextPage(event)" href="#" class="page-link" >NEXT</a></li><li class="page-item"> <a onclick="lastPage(event)" href="#" class="page-link" >LAST</a></li></ul></div>

			
      <div class="col-3 apt-1 bg-secondary apb-1">
        <div class="btn-group" role="group" aria-label="Button group with nested dropdown">
          <div class="btn-group" role="group">
            <button id="btnGroupDrop1" type="button" class="btn btn-primary dropdown-toggle w-100" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Show:</button>
            <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
              <a class="dropdown-item" onclick="setView(1)">Open</a>
              <a class="dropdown-item" onclick="setView(2)">Closed (Unfulfilled)</a>
              <a class="dropdown-item" onclick="setView(2)">Closed (Fulfilled)</a>
              <a class="dropdown-item" onclick="setView(2)">All</a>
            </div>
          </div>
        </div>
      </div>

				
        <div class="col-5 apt-1 bg-secondary apb-1">
						<span class="amr-1 "><input id="filter" oninput="search(this.value)" placeholder="Search..." type="text" autocomplete="off" class="w-100"></span>
				</div>


			</div>
		</div>
		<?php

	//-----------------------------------------------------------------------------
	// SHOW REQUESTS
	//-----------------------------------------------------------------------------


		?>
        <div class="container-fluid bg-secondary apb-1">
          <div class="d-none d-sm-block text-truncate text-center">
           <span class="green">- --/\-\/- -</span> <span class="cyan">aSCIIaRENA</span> <span class="red">--=*=-- </span><span class="pink">[<?=date("D")?>, the <?=date("d-m-y")?>]</span><span class="red"> --=*=-- </span> <span class="cyan">aSCIIaRENA</span> <span class="green"> - -/\-\/- -- -</span><br><br>
         </div>
       </div>

		<div id = "hdrcols" class="row amb-1">
      <div class="col-8 col-sm-6"><span class="white"><a onclick="updateSort('title')">Title</a></span></div>
      <div class="col-8 col-sm-2"><span class="white"><a onclick="updateSort('title')">Status</a></span></div>
      <div class="col-4 col-sm-4"><span class="white"><a onclick="updateSort('user')">Requested By</a></span></div>
		</div>
      
    <div id="requestsList">
		</div>
	</div>
  
<script>

   function setView(v) {
     $("#viewmode").val(v);
     page = ~~ $("#pageno").val();
     sort = $("#sort1").val()
     order = $("#sort2").val()
     filter = $("#filter").val()
     getRequests(page,sort,order,filter);
   }
   
   function search(v) {
    page = 1;
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = v
    getRequests(page,sort,order,filter)
   }

  function nextPage(e) {
    e.preventDefault(); 
    page = ~~ $("#pageno").val();
    maxpage = ~~ $("#maxpage").val();
    if (page<maxpage) {
      sort = $("#sort1").val()
      order = $("#sort2").val()
      filter = $("#filter").val()
      getRequests(page+1,sort,order,filter)
    }
  }
  
  function prevPage(e) {
    e.preventDefault(); 
    let page = ~~ $("#pageno").val();
    if (page>1) {
      sort = $("#sort1").val()
      order = $("#sort2").val()
      filter = $("#filter").val()
      getRequests(page-1,sort,order,filter)
    }
  }

  function firstPage(e) {
    e.preventDefault(); 
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = $("#filter").val()
    getRequests(1,sort,order,filter)
  }

  function lastPage(e) {
    e.preventDefault(); 
    page = $("#maxpage").val();
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = $("#filter").val()
    getRequests(page,sort,order,filter)
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
    getRequests(1,sort,order,filter)
  }

  function getRequests(page,sort,order,filter) {

    $("#pageno").val(page);
    $("#sort1").val(sort);
    $("#sort2").val(order);

    filter = filter.trim();


    let pagesize = 120;   
   
    $.get("/cmds.php/get_reqs/"+page+"/"+sort+"/"+order+"/"+"/"+pagesize+"/"+filter, function (data) {
      let requestsList = $("#requestsList");
      requestsList.empty();
      let cnt = 0
      let maxpage = 1;
      if (data.length>0) {
        cnt = parseInt(data[0].total_count)
        maxpage = Math.trunc((cnt + pagesize - 1)/pagesize);
      }
      $("#maxpage").val(maxpage);
      $("#currpage").text(page+" of "+maxpage);
			$.each(data, function (i, req) {
         
         var status;
         switch(req.status) {
           case 0:
            status ="Open"
            break
           case 1:
            status ="Closed (Unfulfilled)"
            break
           case 2:
            status ="Closed (Fulfilled)"
            break
         }
          reqtxt = `<div class="row">
      <div class="col-8 col-sm-6 text-truncate">
        <a class="magenta" href="${req.url}">${req.title}</a>
      </div>
      <div class="col-8 col-sm-2 text-truncate">
        <a class="magenta" href="${req.url}">${status}</a>
      </div>
      <div class="col-4 col-sm-4 text-truncate">
        <a class="magenta" href="${req.url}">${req.user}</a>
      </div>`
   
       
        requestsList.append(reqtxt);
      });
          
      });
    }
        

	$(function() {
    $("#pageno").val("1");
    $("#sort1").val("<?=$sort_by?>");
    $("#sort2").val('A')
   
    setView(1);
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

