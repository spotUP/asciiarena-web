<?php
require_once "session.php";
$h1 = "COLLYS";
require_once "header.php";
$sort_by = $_GET['sort_by'] ?? "Name";
$sort_order = $_GET['sort_order'] ?? "A";
$userprefs = fetchOne("select list_view_mode from users where id = :userid", [":userid" => $_user['id']]);
?>
<div class="modal-body row m-0 p-0">
  <div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 bg-secondary">
    <div class="row">
      <div class="col-12 d-flex">
        <div class="row m-0 apt-1">
          <input type="hidden" id="sort1"><input type="hidden" id="viewmode" value="1"><input type="hidden" id="pageno"><input type="hidden" id="sort1"><input type="hidden" id="sort2"><input type="hidden" id="maxpage"><ul class="pagination"><li class="page-item"> <a onclick="firstPage(event)" href="#" class="page-link" ><<</a></li><li class="page-item"> <a onclick="prevPage(event)" href="#" class="page-link" ><</a></li><span id="currpage"></span><li class="page-item"> <a onclick="nextPage(event)" href="#" class="page-link" >></a></li><li class="page-item"> <a onclick="lastPage(event)" href="#" class="page-link" >>></a></li></ul></div>
          <div class="apt-1 bg-secondary apb-1">
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
          <div class="apt-1 apl-1 bg-secondary apb-1">
            <span><input id="filter" oninput="search(this.value)" class="apl-1 w-100" placeholder="Search..." type="text" autocomplete="off"></span>
          </div>
        </div>
      </div>
		<?php

	//-----------------------------------------------------------------------------
	// SHOW BBS
	//-----------------------------------------------------------------------------


		?>
        <div class="container-fluid bg-secondary apb-1">
          <div class="d-none d-sm-block text-truncate text-center">
           <span class="green">- --/\-\/- -</span> <span class="cyan">aSCIIaRENA</span> <span class="red">--=*=-- </span><span class="pink">[<?=date("D")?>, the <?=date("d-m-y")?>]</span><span class="red"> --=*=-- </span> <span class="cyan">aSCIIaRENA</span> <span class="green"> - -/\-\/- -- -</span><br><br>
         </div>
       </div>

    <div id = "hdrcols"class="row mb-4">
      <div class="col-md-7 text-truncate d-none d-md-block">
        <a onclick="updateSort('Name')">NAME</a>
      </div>
      <div class="col text-truncate">
        <a onclick="updateSort('filename')">FILENAME</a>
      </div>
      <div class="col green text-truncate">
        <a onclick="updateSort('artists')">ARTiST</a>
      </div>
      <div class="col green text-truncate">
        <a onclick="updateSort('crews')">CREW</a>
      </div>
      <div class="col text-truncate d-none d-md-block">
        <a onclick="updateSort('cdate')">DATE</a>
      </div>
    </div>

    <div id = "hdrcols2" class="row amb-1">
      <span class="col-2 col-sm-2 white"><a onclick="updateSort('filename')">FILENAME</a></span>
         <span class="col-1 col-sm-1 white" >FLAGS</span>
         <span class="col-1 col-sm-1 white" ><a onclick="updateSort('filesize')">FILESIZE</a></span>
         <span class="col-2 col-sm-2 white"><a onclick="updateSort('cdate')">DATE</a></span>
         <span class="white">DESCRIPTION</span>
		</div>
    
    <div id="collyList">
		</div>
	</div>
  
<script>
   function setView(v) {
     $("#viewmode").val(v);
     page = ~~ $("#pageno").val();
     filter = $("#filter").val()
     sort = $("#sort1").val()
     order = $("#sort2").val()
    
     getColly(page,sort,order,filter);
   }
   
   function search(v) {
    page = 1;
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = v
    getColly(page,sort,order,filter)
   }

  function nextPage(e) {
    e.preventDefault(); 
    page = ~~ $("#pageno").val();
    maxpage = ~~ $("#maxpage").val();
    if (page<maxpage) {
      sort = $("#sort1").val()
      order = $("#sort2").val()
      filter = $("#filter").val()
      getColly(page+1,sort,order,filter)
    }
  }
  
  function prevPage(e) {
    e.preventDefault(); 
    let page = ~~ $("#pageno").val();
    if (page>1) {
      sort = $("#sort1").val()
      order = $("#sort2").val()
      filter = $("#filter").val()
      getColly(page-1,sort,order,filter)
    }
  }

  function firstPage(e) {
    e.preventDefault(); 
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = $("#filter").val()
    getColly(1,sort,order,filter)
  }

  function lastPage(e) {
    e.preventDefault(); 
    page = $("#maxpage").val();
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = $("#filter").val()
    getColly(page,sort,order,filter)
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
    getColly(1,sort,order,filter)
  }

  function getColly(page,sort,order,filter) {

    $("#pageno").val(page);
    $("#sort1").val(sort);
    $("#sort2").val(order);

    filter = filter.trim();

    let pagesize = 120

  
    v = $("#viewmode").val();
    if (v==1) {
      $("#hdrcols").show()
      $("#hdrcols2").hide()
    } else if (v==2) {
      $("#hdrcols").hide()
      $("#hdrcols2").show()
      pagesize = 6;     
    }
    
    $.get("/cmds.php/get_collys/"+page+"/"+sort+"/"+order+"/"+pagesize+"/"+filter, function (data) {
      let collyList = $("#collyList");
      collyList.empty();
      let cnt = 0
      let maxpage = 1;
      if (data.length>0) {
        cnt = parseInt(data[0].total_count)
        maxpage = Math.trunc((cnt + pagesize - 1)/pagesize);
      }
      $("#maxpage").val(maxpage);
      $("#currpage").text(page+" of "+maxpage);
			$.each(data, function (i, colly) {
        
     var collytxt;
     v = $("#viewmode").val();

     if (v==1) {
        collytxt = `<div class="row mb-4 mb-sm-0">
        <div class="col-md-7 text-truncate">
          <a class="magenta" href="${colly.url}">${colly.name}</a>
        </div>
        <div class="col text-truncate">
          <a class="magenta" href="${colly.url}">${colly.filename}</a>
        </div>
        <div class="col green text-truncate">
          <span class="yellow">${colly.artists}</span>
        </div>
        <div class="col green text-truncate">
          <span class="yellow">${colly.crews}</span>
        </div>
        <div class="col text-truncate d-none d-md-block">
          ${colly.cdate}
        </div>
      </div>`;
     }
     
     if (v==2) {
       collytxt = `<div class="row apt-1 text-center text-md-left">
       <span class="col-2 col-sm-2"><a class="cyan" href="${colly.url}">${colly.filename}</a></span> <span class="col-1 col-sm-1 green" >PF--</span> <span class="col-1 col-sm-21 yellow" >${colly.filesize}</span> <span class="col-2 col-sm-2 yellow">${colly.cdate}</span>
       <div class="col-6 col-sm-6 apb-1 text-center text-md-left">
           <pre class="ascii magenta overflow-hidden"><a class="ascii magenta" href="${colly.url}">${colly.fileid}</a></pre>
       </div>
     </div>    
        
     <div class="row apb-1">
       <div class="col-12 col-sm-6"></div>
       <div class="col-12 col-sm-6 text-center text-md-left">
         <span class="pink text-right">${colly.usersig}</span>
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
      
      
        collyList.append(collytxt);        
      });
          
      });
    }
        

	$(function() {
    $("#pageno").val("1");
    $("#sort1").val("<?=addslashes($sort_by)?>");
    $("#sort2").val("<?=addslashes($sort_order)?>")
   
    <?php if ($userprefs->list_view_mode == 'BBS') {
      ?> setView(2) <?php
    } else {
      ?> setView(1) <?php
    } ?>
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
