<?php
//--------------------------------------------------------------------------------
// EDIT ARTIST FIELD
//--------------------------------------------------------------------------------
?>
<script>
	function getArtist() {
		const id = $("#artist_fetch_id").val();
		if (id > 0) {
			$.get(`/admin_cmds.php?cmd=get_artist&id=${id}`, function (data) {
				$('#artist_id').val(data[0].id);
				$('#artist_nick').val(data[0].nick);
				$('#artist_acronym').val(data[0].acronym);
				$('#artist_www').val(data[0].www);
				$('#artist_country').val(data[0].country);
				$('#artist_status').val(data[0].status);
			});
      getArtistCrews(id)
		} else {
			$("#artist_id, #artist_nick, #artist_acronym, #artist_www, #artist_country, #artist_status").val('');
		}
	}

	function getArtistList() {
		let artistlist = $("#artist_fetch_id");
		artistlist.empty();
		artistlist.append($("<option/>").val("").text("Select Artist"));
		$.get("/admin_cmds.php?cmd=get_artist", function (data) {
			$.each(data, function (i, artist) {
				artistlist.append($("<option/>").val(artist.id).text(artist.nick));
			});
		});
	}

	function delArtist() {
		const activeName = $("#artist_nick").val();
		if (activeName !== "") {
			if (confirm(`Are you sure you want to delete ${activeName}?`)) {
				const form = $("#del_artist_form");
				$("#del_artist_id").val($("#artist_id").val());
				const url = form.attr("action");
				$.ajax({
					"type": "POST",
					"url": url,
					"data": form.serialize(),
					"success": () => {
						showAlert("Artist deleted!", "#artist");
       			$("#artist_id, #artist_nick, #artist_acronym, #artist_www, #artist_country, #artist_status").val('');
						getArtistList();
					}
				});
			}
		}
	}

  function getArtistCrews(id) {
		let crewslist = $("#artist_crew_fetch_id");
		crewslist.empty();
		$.get(`/admin_cmds.php?cmd=get_artist_crews&id=${id}`, function (data) {
			$.each(data, function (i, crew) {
        crewslist.append('<div class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between"><span id="crew_fetch_name_'+crew.id.toString()+'">'+crew.crew+'</span><input type="button" value="Delete" onclick="deleteArtistCrew('+crew.id+')"/></div></div>')
			});
		});
  }
  
  function deleteArtistCrew(id) {
		const activeName = $("#crew_fetch_name_"+id.toString()).text();
    if (confirm(`Are you sure you want to delete ${activeName} Crew?`)) {
      const form = $("#del_artist_crew_form");
      $("#del_artist_crew_id").val(id.toString());
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("Crew deleted!", "#artist");
          getArtist();
        }
      });
    }
  }
  
  function addArtistCrew() {
    const form = $("#add_artist_crew_form");
    const activeName = $("#artist_nick").val();
		if (activeName !== "") {
      $("#add_artist_crew_nick").val(activeName);
      $("#add_artist_crew_crew").val($("#artist_crew_add_fetch_id option:selected").text());
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("Crew Added!", "#artist");
          $("#artist_crew_add_fetch_id").val('0');
          getArtist();
        }
      });    
    }
  }  
  
	function showAlert(content, prependTo) {
		const alertContent = `<div class="bs-component quick-alert amb-1"><div id="#success-alert" class="animate__animated animate__shakeX alert alert-dismissible alert-success"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div></div>`;
		$(prependTo).prepend(alertContent);
	}

</script>
<div class="tab-pane fade ap-1" id="artist">
  <form id="del_artist_form" action="/admin_cmds.php?cmd=del_artist" method="post">
		<input type="hidden" name="id" id="del_artist_id">
	</form>
  <form id="add_artist_crew_form" action="/admin_cmds.php?cmd=add_artist_crew" method="post">
		<input type="hidden" name="nick" id="add_artist_crew_nick">
		<input type="hidden" name="crew" id="add_artist_crew_crew">
  </form>
  <form id="del_artist_crew_form" action="/admin_cmds.php?cmd=del_artist_crew" method="post">
		<input type="hidden" name="id" id="del_artist_crew_id">
	</form>
  
  
  <div class="row apb-1">
    <div class="col-12">
      <form>
        <select name="artist_id" id="artist_fetch_id" class="w-100" onchange="getArtist();">
        </select>
      </form>
    </div>
  </div>

  <form id="artist_form" action="/admin_cmds.php?cmd=save_artist" method="post">
		<input type="hidden" name="id" id="artist_id">

    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="artist_nick" class="lightgrey">Nick</label>
				<input type="text" size="24" id="artist_nick" name="nick">
			</div>
		</div>

    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="artist_acronym" class="lightgrey">Acronym</label>
				<input type="text" size="24" id="artist_acronym" name="acronym">
			</div>
		</div>

    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="artist_www" class="lightgrey">Webpage</label>
				<input type="text" size="24" id="artist_www" name="www">
			</div>
		</div>

    <div class="row apb-1"><div class="col-6 d-flex justify-content-between">Crews:</div></div>
    <div id="artist_crew_fetch_id"></div>
    <div class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between">
    <select name="crew_add_id" id="artist_crew_add_fetch_id" class="w-100">
					<option value="0">Select Crew</option>
					<?php
					$result = fetchAll("SELECT id, name FROM crews ORDER BY name");
					foreach($result as $row) {
						?>
						<option value="<?=$row->id?>"><?=$row->name?></option>
						<?php
					}
					?>
    
		</select><input type="button" value="Add Crew!" onclick="addArtistCrew()"/>
    </div></div>
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="artist_country" class="lightgrey">Country</label>
        <select name="country" id="artist_country">
          <?php
          foreach($country_list as $symbol => $country)
						{
							?>
								<option value="<?=$country?>"><?=$country?></option>
							<?php
						}
						?>
				</select>
			</div>
		</div>
    
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="artist_active" class="lightgrey">Status</label>
        <select name="active" id="artist_active">
          <option value="Active">Active</option>
					<option value="Inactive">Inactive</option>
				</select>
			</div>
		</div>  

    <div class="row apt-1">
			<div class="col-12">
				<input type="submit" name="do_edit_artist" value="Submit">
				<input type="button" id="delete_artist" name="delete_artist" value="Delete" onclick="delArtist();">
			</div>
		</div>

	</form>
</div>
<script>
	$(function () {
    getArtistList();
		$("#artist_form").submit(function (e) {
			e.preventDefault();
      const form = $(this);
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("Artist saved!", "#artist");
          $("#artist_id, #artist_nick, #artist_acronym, #artist_www, #artist_country, #artist_status").val('');
          getArtistList();
        }
      });
		});
	});
</script>
