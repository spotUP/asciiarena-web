<?php
require_once "session.php";
$h1 = "aPPLiCATiONS";
require_once "header.php";
$sort_by = $_GET['sort_by'] ?? "Name";

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
            <button id="btnGroupDrop1" type="button" class="btn btn-primary dropdown-toggle w-100" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">View Mode:</button>
            <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
              <a class="dropdown-item" onclick="setView(1)">Standard</a>
              <a class="dropdown-item" onclick="setView(2)">BBS</a>
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
	// SHOW aPPLiCATiONS
	//-----------------------------------------------------------------------------


		?>
        <div class="container-fluid bg-secondary apb-1">
          <div class="d-none d-sm-block text-truncate text-center">
           <span class="green">- --/\-\/- -</span> <span class="cyan">aSCIIaRENA</span> <span class="red">--=*=-- </span><span class="pink">[<?=date("D")?>, the <?=date("d-m-y")?>]</span><span class="red"> --=*=-- </span> <span class="cyan">aSCIIaRENA</span> <span class="green"> - -/\-\/- -- -</span><br><br>
         </div>
       </div>

		<div id = "hdrcols" class="row amb-1">
      <div class="col-4 col-sm-4"><span class="white"><a onclick="updateSort('filename')">FILENAME</a></span></div>
      <div class="col-4 col-sm-4"><span class="white"><a onclick="updateSort('Name')">NAME</a></span></div>
      <div class="col-4 col-sm-4 text-truncate"><span class="white"><a onclick="updateSort('Author')"">AUTHOR</a></span></div>     
		</div>
    <div id="applicationList">
		</div>
	</div>
  
<script>

   function setView(v) {
     $("#viewmode").val(v);
     page = ~~ $("#pageno").val();
     sort = $("#sort1").val()
     order = $("#sort2").val()
     filter = $("#filter").val()
     getApplications(page,sort,order,filter);
   }
   
   function search(v) {
    page = 1;
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = v
    getApplications(page,sort,order,filter)
   }

  function nextPage(e) {
    e.preventDefault(); 
    page = ~~ $("#pageno").val();
    maxpage = ~~ $("#maxpage").val();
    if (page<maxpage) {
      sort = $("#sort1").val()
      order = $("#sort2").val()
      filter = $("#filter").val()
      getApplications(page+1,sort,order,filter)
    }
  }
  
  function prevPage(e) {
    e.preventDefault(); 
    let page = ~~ $("#pageno").val();
    if (page>1) {
      sort = $("#sort1").val()
      order = $("#sort2").val()
      filter = $("#filter").val()
      getApplications(page-1,sort,order,filter)
    }
  }

  function firstPage(e) {
    e.preventDefault(); 
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = $("#filter").val()
    getApplications(1,sort,order,filter)
  }

  function lastPage(e) {
    e.preventDefault(); 
    page = $("#maxpage").val();
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = $("#filter").val()
    getApplications(page,sort,order,filter)
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
    getApplications(1,sort,order,filter)
  }

  function getApplications(page,sort,order,filter) {

    $("#pageno").val(page);
    $("#sort1").val(sort);
    $("#sort2").val(order);

    filter = filter.trim();


    let pagesize = 120
    
    v = $("#viewmode").val();
    if (v==1) {
      $("#hdrcols").show()
    } else if (v==2) {
      $("#hdrcols").hide()
      pagesize = 6;
      sort = "timestamp";
      order = "D";
      
    }
    
    $.get("/cmds.php/get_apps/"+page+"/"+sort+"/"+order+"/"+"/"+pagesize+"/"+filter, function (data) {
      let applicationList = $("#applicationList");
      applicationList.empty();
      let cnt = 0
      let maxpage = 1;
      console.log(data.length);
      if (data.length>0) {
        cnt = parseInt(data[0].total_count)
        maxpage = Math.trunc((cnt + pagesize - 1)/pagesize);
      }
      $("#maxpage").val(maxpage);
      $("#currpage").text(page+" of "+maxpage);
			$.each(data, function (i, app) {
         

        apptxt = ''
        v = $("#viewmode").val();

        if (v==1) {
          apptxt = `<div class="row">
      <div class="col-4 col-sm-4 text-truncate">
        <a class="magenta" href="${app.url}">${app.filename}</a>
      </div>
      <div class="col-4 col-sm-4 text-truncate">
        <a class="magenta" href="${app.url}">${app.name}</a>
      </div>
      <div class="col-4 col-sm-4 green text-truncate">
       <span class="yellow">${app.author}</span>
     </div>`;
        }
     
     
     if (v==2) {
        apptxt = `<div class="row apt-1">
       <div class="col-6 col-am-6 text-center text-md-left">
         <a href="${app.url}"><span class="cyan" style="margin-right: 8px;">${app.filename}</span></a> <span class="green" style="margin-right: 16px;">PF--</span> <span class="yellow" style="margin-right: 8px;">${app.filesize}</span> <span class="yellow">${app.timestamp}</span>
       </div>
       <div class="col-6 col-sm-6 apb-1 text-center text-md-left">
           <pre class="ascii magenta overflow-hidden"><a class="ascii magenta" href="${app.url}">${app.fileid}</a></pre>
       </div>
     </div>
     <div class="row apb-1">
       <div class="col-12 col-sm-6"></div>
       <div class="col-12 col-sm-6 text-center text-md-left">
         <span class="pink text-right">${app.usersig}</span>
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
    `;

       
       
     }
     
        applicationList.append(apptxt);
      });
          
      });
    }
        

	$(function() {
		getApplications(1,'<?=$sort_by?>','A','');
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

