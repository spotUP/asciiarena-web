<?php
require_once "session.php";
$h1 = "HIPPO pLAYLISTS";
require_once "header.php";
$sort_by = $_GET['sort_by'] ?? "id";
?>
<div class="modal-body row m-0 p-0">
<?php
  if(is_admin()) 
  {
?>
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 bg-secondary">
		<div class="row">

			<div class="col-12 d-flex justify-content-between">


      <div class="row m-0 apt-1">
        <input type="hidden" id="sort1"><input type="hidden" id="viewmode" value="1"><input type="hidden" id="pageno"><input type="hidden" id="sort1"><input type="hidden" id="sort2"><input type="hidden" id="maxpage"><ul class="pagination"><li class="page-item"> <a onclick="firstPage(event)" href="#" class="page-link" >FIRST</a></li><li class="page-item"> <a onclick="prevPage(event)" href="#" class="page-link" >PREV</a></li><span id="currpage"></span><li class="page-item"> <a onclick="nextPage(event)" href="#" class="page-link" >NEXT</a></li><li class="page-item"> <a onclick="lastPage(event)" href="#" class="page-link" >LAST</a></li></ul></div>

      	
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
      <div class="col-8 col-sm-5"><span class="white"><a onclick="updateSort('title')">Title</a></span></div>
      <div class="col-8 col-sm-3"><span class="white"><a onclick="updateSort('genre')">Genre</a></span></div>
      <div class="col-4 col-sm-2"><span class="white"><a onclick="updateSort('uploaddate')">Date</a></span></div>
		</div>
      
    <div class="apb-1" id="itemsList">
    </div>
    <a href="/submit.php#playlist" ><input type="submit" class="btn-big" value="Add Playlist"></a>
	</div>
  
<script>

   function setView(v) {
     $("#viewmode").val(v);
     page = ~~ $("#pageno").val();
     sort = $("#sort1").val()
     order = $("#sort2").val()
     filter = $("#filter").val()
     getPlayLists(page,sort,order,filter);
   }
   
   function search(v) {
    page = 1;
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = v
    getPlayLists(page,sort,order,filter)
   }

  function nextPage(e) {
    e.preventDefault(); 
    page = ~~ $("#pageno").val();
    maxpage = ~~ $("#maxpage").val();
    if (page<maxpage) {
      sort = $("#sort1").val()
      order = $("#sort2").val()
      filter = $("#filter").val()
      getPlayLists(page+1,sort,order,filter)
    }
  }
  
  function prevPage(e) {
    e.preventDefault(); 
    let page = ~~ $("#pageno").val();
    if (page>1) {
      sort = $("#sort1").val()
      order = $("#sort2").val()
      filter = $("#filter").val()
      getPlayLists(page-1,sort,order,filter)
    }
  }

  function firstPage(e) {
    e.preventDefault(); 
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = $("#filter").val()
    getPlayLists(1,sort,order,filter)
  }

  function lastPage(e) {
    e.preventDefault(); 
    page = $("#maxpage").val();
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = $("#filter").val()
    getPlayLists(page,sort,order,filter)
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
    getPlayLists(1,sort,order,filter)
  }

  function getPlayLists(page,sort,order,filter) {

    $("#pageno").val(page);
    $("#sort1").val(sort);
    $("#sort2").val(order);

    viewmode = $("#viewmode").val();

    filter = filter.trim();

    let pagesize = 120;   
   
  
    $.get("/admin_cmds.php/get_playlists/"+page+"/"+sort+"/"+order+"/"+pagesize+"/"+viewmode+"/"+filter, function (data) {
      let itemsList = $("#itemsList");
      itemsList.empty();
      let cnt = 0
      let maxpage = 1;
      if (data.length>0) {
        cnt = parseInt(data[0].total_count)
        maxpage = Math.trunc((cnt + pagesize - 1)/pagesize);
      }
      $("#maxpage").val(maxpage);
      $("#currpage").text(page+" of "+maxpage);
			$.each(data, function (i, pl) {
         
          listtxt = `<div class="row">
      <div class="col-8 col-sm-5 text-truncate">
        <a class="magenta" href="${req.url}">${req.title}</a>
      </div>
      <div class="col-8 col-sm-3 text-truncate">
        <a class="magenta" href="${req.url}">${req.genre}</a>
      </div>
      <div class="col-4 col-sm-2 text-truncate">
        <a class="magenta" href="${req.url}">${req.uploaddate}</a>
      </div>
      </div>`
      
        itemsList.append(listtxt);
      });
          
      });
    }
        

	$(function() {
    $("#pageno").val("1");
    $("#sort1").val("<?=addslashes($sort_by)?>");
    $("#sort2").val('A')
   
    setView(0);
  });
</script>
<?php
  }
?>
  
	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>
  
  
	<?php include "footer.php"; ?>
</div>


