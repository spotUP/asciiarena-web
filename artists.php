<?php
require_once "session.php";
$h1 = "ARTISTS";
require_once "header.php";

?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 bg-secondary">
		<div class="row">
			<div class="col-12 d-flex justify-content-between">

      <div class="row m-0 apt-1">
        <input type="hidden" id="pageno">
        <input type="hidden" id="sort1">
        <input type="hidden" id="sort2">
        <input type="hidden" id="maxpage">
        <ul class="pagination">
          <li class="page-item"> <a onclick="firstPage(event)" href="#" class="page-link" ><<</a></li>
          <li class="page-item"> <a onclick="prevPage(event)" href="#" class="page-link" ><</a></li>
          <span id="currpage"></span>
          <li class="page-item"> <a onclick="nextPage(event)" href="#" class="page-link" >></a></li>
          <li class="page-item"> <a onclick="lastPage(event)" href="#" class="page-link" >>></a></li>
        </ul></div>
          <div class="apt-1 apl-1 bg-secondary apb-1">
            <span><input id="filter" oninput="search(this.value)" class="apl-1 w-100" placeholder="Search..." type="text" autocomplete="off"></span>
          </div>
			</div>

		</div>
		<?php
		//-----------------------------------------------------------------------------
		// SHOW ARTISTS
		//-----------------------------------------------------------------------------
		?>

		<div class="row amb-1">
			<div class="col-2">
 				<a class="white" onclick="updateSort('Nick')">ARTiST</a>
			</div>
			<div class="col-10">
				<a class="white" onclick="updateSort('crews')">CREW</a>
			</div>
		</div>
    <div id="artistList">
		</div>
	</div>


<script>
   function search(v) {
    page = 1;
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = v
    getArtists(page,sort,order,filter)
   }

  function nextPage(e) {
    e.preventDefault(); 
    page = ~~ $("#pageno").val();
    maxpage = ~~ $("#maxpage").val();
    if (page<maxpage) {
      sort = $("#sort1").val()
      order = $("#sort2").val()
      filter = $("#filter").val()
      getArtists(page+1,sort,order,filter)
    }
  }
  
  function prevPage(e) {
    e.preventDefault(); 
    let page = ~~ $("#pageno").val();
    if (page>1) {
      sort = $("#sort1").val()
      order = $("#sort2").val()
      filter = $("#filter").val()
      getArtists(page-1,sort,order,filter)
    }
  }

  function firstPage(e) {
    e.preventDefault(); 
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = $("#filter").val()
    getArtists(1,sort,order,filter)
  }

  function lastPage(e) {
    e.preventDefault(); 
    page = $("#maxpage").val();
    sort = $("#sort1").val()
    order = $("#sort2").val()
    filter = $("#filter").val()
    getArtists(page,sort,order,filter)
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
    getArtists(1,sort,order,filter)
  }

  function getArtists(page,sort,order,filter) {

    $("#pageno").val(page);
    $("#sort1").val(sort);
    $("#sort2").val(order);

    filter = filter.trim();

    let pagesize = 120
    
    $.get("/cmds.php/get_artists/"+page+"/"+sort+"/"+order+"/"+"/"+pagesize+"/"+filter, function (data) {
      let artistlist = $("#artistList");
      artistlist.empty();
      
      let cnt = 0
      let maxpage = 1;
      if (data.length>0) {
        cnt = parseInt(data[0].total_count)
        maxpage = Math.trunc((cnt + pagesize - 1)/pagesize);
      }
      $("#maxpage").val(maxpage);
      $("#currpage").text(page+" of "+maxpage);
			$.each(data, function (i, artist) {

        let artisttxt = `
			<div class="row">
				<div class="forum_nick col-2">
      <a href="${artist.url}">${artist.nick}</a>
				</div>
				<div class="artist_crew col-10">
					${artist.crews}
				</div>
			</div>`;
        artistlist.append(artisttxt);        
      });
          
      });
    }
        

	$(function() {
		getArtists(1,'Nick','A','');
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