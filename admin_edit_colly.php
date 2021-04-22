<?php
//--------------------------------------------------------------------------------
// EDIT COLLY FIELD
//--------------------------------------------------------------------------------
?>

<script>
  function collyclear() {
    $("#colly_id, #colly_name, #colly_filename, #colly_year, #colly_month, #colly_day, #colly_type, #colly_diz").val('');
    let crewslist = $("#colly_crew_fetch_id");
    crewslist.empty();
    let artistslist = $("#colly_artist_fetch_id");
    artistslist.empty();
    $("#colly_crew_add_fetch_id").val("0")
    $("#colly_artist_add_fetch_id").val("0")
  }
  
  function addCollyCrewItem(crewslist,id,name) {
		crewslist.append('<div id="colly_crew_entry'+id+'" class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between"><span id="crew_fetch_name_'+id+'">'+name+'</span><input type="hidden" name="crewname[]" value="'+name+'"><input type="button" value="Delete" onclick="deleteCollyCrew('+id+')"/></div></div>')
	}
  
 	function addCollyArtistItem(artistslist,id,name) {
		artistslist.append('<div id="colly_artist_entry'+id+'" class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between"><span id="artist_fetch_name_'+id+'">'+name+'</span><input type="hidden" name="artistname[]" value="'+name+'"><input type="button" value="Delete" onclick="deleteCollyArtist('+id+')"/></div></div>')
	}

	function getColly() {
		const id = $("#colly_fetch_id").val();
		if (id > 0) {
			$.get(`/admin_cmds.php?cmd=get_colly&id=${id}`, function (data) {      
				$('#colly_id').val(data[0].id);
        $('#colly_name').val(data[0].name);
        $('#colly_filename').val(data[0].filename);
				$('#colly_year').val(data[0].year);
				$('#colly_month').val(data[0].month);
				$('#colly_day').val(data[0].day);
				$('#colly_type').val(data[0].type);
				$('#colly_diz').val(data[0].diz);
        let crewslist = $("#colly_crew_fetch_id");
					crewslist.empty();
					$.each(data[0].crews, function (i, crew) {
						addCollyCrewItem(crewslist,crew.id,crew.name)
				});
        let artistslist = $("#colly_artist_fetch_id");
					artistslist.empty();
					$.each(data[0].artists, function (i, artist) {
						addCollyArtistItem(artistslist,artist.id,artist.nick)
				});
			});
		} else {
			collyclear();
		}
	}

	function getCollyList() {
		let collylist = $("#colly_fetch_id");
		collylist.empty();
		collylist.append($("<option/>").val("").text("Select colly"));
		$.get("/admin_cmds.php?cmd=get_colly", function (data) {
			$.each(data, function (i, colly) {
				collylist.append($("<option/>").val(colly.id).text(colly.name));
			});
		});
	}
  
  function saveColly() {
    const form = $("#colly_form");
    const url = form.attr("action");
    $.ajax({
      "type": "POST",
      "url": url,
      "data": form.serialize(),
      "success": () => {
        showAlert("Colly Saved!", "#colly");
        collyclear();
        getCollyList();
      }
    });
  }
  
	function delColly() {
		const activeName = $("#colly_name").val();
		if (activeName !== "") {
			if (confirm(`Are you sure you want to delete ${activeName}?`)) {
				const form = $("#del_colly_form");
				$("#del_colly_id").val($("#colly_id").val());
				const url = form.attr("action");
				$.ajax({
					"type": "POST",
					"url": url,
					"data": form.serialize(),
					"success": () => {
						showAlert("Colly Deleted!", "#colly");
            collyclear();
						getCollyList();
					}
				});
			}
		}
	}
 
  function deleteCollyArtist(id) {
		const activeName = $("#artist_fetch_name_"+id.toString()).text();
    if (confirm(`Are you sure you want to delete ${activeName} Artist?`)) {
			let artistitem = $("#colly_artist_entry"+id.toString());
			artistitem.remove();
			showAlert("Author Deleted!", "#colly");     
    }
  }

  function addCollyArtist() {
    let artistid = $("#colly_artist_add_fetch_id").val()
    let artistnick = $("#colly_artist_add_fetch_id option:selected").text()
    
    if (artistid>0) {
      if (!($("#colly_artist_entry"+artistid).length)) {
        let artistlist = $("#colly_artist_fetch_id");
        addCollyArtistItem(artistlist,artistid,artistnick)
        $("#colly_artist_add_fetch_id").val('0');
        showAlert("Author Added!", "#colly");   
      }
    }
  }
 
 function deleteCollyCrew(id) {
		const activeName = $("#crew_fetch_name_"+id.toString()).text();
    if (confirm(`Are you sure you want to delete ${activeName} Crew?`)) {
      let crewitem = $("#colly_crew_entry"+id.toString());
			crewitem.remove();      
      showAlert("Crew Deleted!", "#colly");
    }
  }

  function addCollyCrew() {
    let crewid = $("#colly_crew_add_fetch_id").val()
    let crewname = $("#colly_crew_add_fetch_id option:selected").text()
    
    if (crewid>0) {
      if (!($("#colly_crew_entry"+crewid).length)) {
        let crewlist = $("#colly_crew_fetch_id");
        addCollyCrewItem(crewlist,crewid,crewname)
        $("#colly_crew_add_fetch_id").val('0');
        showAlert("Crew Added!", "#colly");
      }
    }
  }
 
	function showAlert(content, prependTo) {
		const alertContent = `<div class="bs-component quick-alert amb-1"><div id="#success-alert" class="animate__animated animate__shakeX alert alert-dismissible alert-success"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div></div>`;
		$(prependTo).prepend(alertContent);
	}
  
</script>
<div class="tab-pane fade show active ap-1" id="colly">
  <form id="del_colly_form" action="/admin_cmds.php?cmd=del_colly" method="post">
		<input type="hidden" name="id" id="del_colly_id">
	</form>
  <div class="row apb-1">
		<div class="col-12">
			<form>
				<select class="custom-select" name="colly_id" id="colly_fetch_id" class="w-100" onchange="getColly();">
				</select>
			</form>
		</div>
	</div>

  <form id="colly_form" action="/admin_cmds.php?cmd=save_colly" method="post">
		<input type="hidden" name="id" id="colly_id">

    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
      <span>file_id_here</span>
			</div>
		</div>

    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="colly_name" class="lightgrey">Name</label>
				<input type="text" size="24" id="colly_name" name="name">
			</div>
		</div>

    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="colly_name" class="lightgrey">Filename</label>
				<input type="text" size="24" id="colly_filename" name="filename">
			</div>
		</div>

    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="colly_type" class="lightgrey">Type</label>
        <select class="custom-select" name="type" id="colly_type">
          <option value="ASCII">ASCII</option>
					<option value="ANSI">ANSI</option>
				</select>
			</div>
		</div>
    
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="colly_year" class="lightgrey">Release Date</label>
        <select class="custom-select" name="year" id="colly_year">
          <?php
						$countyear=1900;
						$maxyear=date("Y");
						while($countyear<=$maxyear)
						{
							?>
							<option><?=$countyear?></option>
							<?php
							$countyear++;
						}
          ?>
        </select>
        <select class="custom-select" name="month" id="colly_month">
          <?php
          $countmonth=1;
          $maxmonth=12;
          while($countmonth<=$maxmonth)
          {
            ?>
            <option><?=$countmonth?></option>
            <?php
            $countmonth++;
          }
          ?>
				</select>
        <select class="custom-select" name="day" id="colly_day">
          <?php
          $countday=1;
          $maxday=31;
          while($countday<=$maxday)
          {
            ?>
            <option><?=$countday?></option>
            <?php
            $countday++;
          }
          ?>
				</select>
			</div>
		</div>    

	     
    <div class="row apb-1"><div class="col-6 d-flex justify-content-between">Artists:</div></div>
    <div id="colly_artist_fetch_id"></div>
    <div class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between">


    <select class="custom-select" name="colly_artist_add_id" id="colly_artist_add_fetch_id" class="w-100">
					<option value="0">Select Artist</option>
					<?php
					$result = fetchAll("SELECT id, nick FROM artists ORDER BY nick");
					foreach($result as $row) {
						?>
						<option value="<?=$row->id?>"><?=$row->nick?></option>
						<?php
					}
					?>
		</select><input type="button" value="Add Author!" onclick="addCollyArtist()"/>
    </div></div>

    <div class="row apb-1"><div class="col-6 d-flex justify-content-between">Crews:</div></div>
    <div id="colly_crew_fetch_id"></div>
    <div class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between">


    <select class="custom-select" name="colly_crew_add_id" id="colly_crew_add_fetch_id" class="w-100">
					<option value="0">Select Crew</option>
					<?php
					$result = fetchAll("SELECT id, name FROM crews ORDER BY name");
					foreach($result as $row) {
						?>
						<option value="<?=$row->id?>"><?=$row->name?></option>
						<?php
					}
					?>
		</select><input type="button" value="Add Crew!" onclick="addCollyCrew()"/>
    </div></div>

    <div class="row">
      <div class="col-12">
				<input type="button" value="Save"" onclick="saveColly();">
				<input type="button" value="Delete" onclick="delColly()">
      </div>
    </div>
  </form>  
</div>
<script>
	$(function () {
    getCollyList();
	});
</script>
