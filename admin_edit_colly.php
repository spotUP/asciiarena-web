<?php
//--------------------------------------------------------------------------------
// EDIT COLLY FIELD
//--------------------------------------------------------------------------------
?>

<script>
  function collyclear() {
    $("#colly_id, #colly_name, #colly_year, #colly_month, #colly_day, #colly_type, #colly_diz").val('');
    let crewslist = $("#colly_crews_fetch_id");
    crewslist.empty();
    let artistslist = $("#colly_artists_fetch_id");
    artistslist.empty();
  }
  
	function getColly() {
		const id = $("#colly_fetch_id").val();
		if (id > 0) {
			$.get(`/admin_cmds.php?cmd=get_colly&id=${id}`, function (data) {      
				$('#colly_id').val(data[0].id);
        $('#colly_name').val(data[0].name);
				$('#colly_year').val(data[0].year);
				$('#colly_month').val(data[0].month);
				$('#colly_day').val(data[0].day);
				$('#colly_type').val(data[0].type);
				$('#colly_diz').val(data[0].diz);
        getCollyArtists(id)
        getCollyCrews(id)
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
						showAlert("Colly deleted!", "#colly");
            collyclear();
						getCollyList();
					}
				});
			}
		}
	}

  function getCollyArtists(id) {
		let artistslist = $("#colly_artists_fetch_id");
		artistslist.empty();
		$.get(`/admin_cmds.php?cmd=get_colly_artist&id=${id}`, function (data) {
			$.each(data, function (i, artist) {
        artistslist.append('<div class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between"><span id="artist_fetch_name_'+artist.id.toString()+'">'+artist.nick+'</span><input type="button" value="Delete" onclick="deleteCollyArtist('+artist.id+')"/></div></div>')
			});
		});
  }
  
  function addCollyArtist() {
    const form = $("#add_colly_artist_form");
    const activeName = $("#colly_name").val();
		if (activeName !== "") {
      $("#add_colly_artist_colly_id").val($("#colly_id").val());
      $("#add_colly_artist_artist_id").val($("#colly_artist_add_fetch_id").val());
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("Author Added!", "#colly");
          $("#colly_artist_add_fetch_id").val('0');
          getCollyArtists($("#colly_id").val());
        }
      });    
    }
  }
  
  function deleteCollyArtist(id) {
		const activeName = $("#artist_fetch_name_"+id.toString()).text();
    if (confirm(`Are you sure you want to delete ${activeName} Artist?`)) {
      const form = $("#del_colly_artist_form");
      $("#del_colly_artist_id").val(id.toString());
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("Artist deleted!", "#colly");
          getCollyArtists($("#colly_id").val());
        }
      });
    }
  }

  function getCollyCrews(id) {
		let crewslist = $("#colly_crews_fetch_id");
		crewslist.empty();
		$.get(`/admin_cmds.php?cmd=get_colly_crew&id=${id}`, function (data) {
			$.each(data, function (i, crew) {
        crewslist.append('<div class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between"><span id="crew_fetch_name_'+crew.id.toString()+'">'+crew.name+'</span><input type="button" value="Delete" onclick="deleteCollyCrew('+crew.id+')"/></div></div>')
			});
		});
  }
  
  function addCollyCrew() {
    const form = $("#add_colly_crew_form");
    const activeName = $("#colly_name").val();
		if (activeName !== "") {
      $("#add_colly_crew_colly_id").val($("#colly_id").val());
      $("#add_colly_crew_crew_id").val($("#colly_crew_add_fetch_id").val());
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("Crew Added!", "#colly");
          $("#colly_crew_add_fetch_id").val('0');
          getCollyCrews($("#colly_id").val());
        }
      });    
    }
  }
  
  function deleteCollyCrew(id) {
		const activeName = $("#crew_fetch_name_"+id.toString()).text();
    if (confirm(`Are you sure you want to delete ${activeName} Crew?`)) {
      const form = $("#del_colly_crew_form");
      $("#del_colly_crew_id").val(id.toString());
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("Crew deleted!", "#colly");
          getCollyCrews($("#colly_id").val());
        }
      });
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
  <form id="add_colly_artist_form" action="/admin_cmds.php?cmd=add_colly_artist" method="post">
		<input type="hidden" name="colly_id" id="add_colly_artist_colly_id">
		<input type="hidden" name="artist_id" id="add_colly_artist_artist_id">
  </form>
  <form id="del_colly_artist_form" action="/admin_cmds.php?cmd=del_colly_artist" method="post">
		<input type="hidden" name="id" id="del_colly_artist_id">
	</form>
  <form id="add_colly_crew_form" action="/admin_cmds.php?cmd=add_colly_crew" method="post">
		<input type="hidden" name="colly_id" id="add_colly_crew_colly_id">
		<input type="hidden" name="crew_id" id="add_colly_crew_crew_id">
  </form>
  <form id="del_colly_crew_form" action="/admin_cmds.php?cmd=del_colly_crew" method="post">
		<input type="hidden" name="id" id="del_colly_crew_id">
	</form>
  <div class="row apb-1">
		<div class="col-12">
			<form>
				<select name="colly_id" id="colly_fetch_id" class="w-100" onchange="getColly();">
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
				<label for="colly_type" class="lightgrey">Type</label>
        <select name="type" id="colly_type">
          <option value="ASCII">ASCII</option>
					<option value="ANSI">ANSI</option>
				</select>
			</div>
		</div>
    
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="colly_year" class="lightgrey">Release Date</label>
        <select name="year" id="colly_year">
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
        <select name="month" id="colly_month">
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
        <select name="day" id="colly_day">
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
    <div id="colly_artists_fetch_id"></div>
    <div class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between">


    <select name="colly_artist_add_id" id="colly_artist_add_fetch_id" class="w-100">
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
    <div id="colly_crews_fetch_id"></div>
    <div class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between">


    <select name="colly_crew_add_id" id="colly_crew_add_fetch_id" class="w-100">
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
				<input type="submit" name="do_edit_colly" value="Save">
				<input type="button" id="delete_colly" name="delete_colly" value="Delete" onclick="delColly();">
      </div>
    </div>
  </form>  
</div>
<script>
	$(function () {
    getCollyList();
		$("#colly_form").submit(function (e) {
			e.preventDefault();
      const form = $(this);
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("Colly saved!", "#colly");
          collyclear();
          getCollyList();
        }
      });
		});
	});
</script>
