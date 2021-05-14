<?php
//--------------------------------------------------------------------------------
// EDIT ARTIST FIELD
//--------------------------------------------------------------------------------
?>
<script>
	function artistclear() {
		$("#artist_id, #artist_nick, #artist_acronym, #artist_www, #artist_country, #artist_status").val('').trigger('change');
		let crewslist = $("#artist_crew_fetch_id");
		crewslist.empty();
		$("#artist_crew_add_fetch_id").val("0")
	}
	
	function addArtistCrewItem(crewslist,id,name) {
		crewslist.append('<div id="artist_crew_entry'+id+'" class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between"><span id="crew_fetch_name_'+id+'">'+name+'</span><input type="hidden" name="crewname[]" value="'+name+'"><input type="button" value="Delete" onclick="deleteArtistCrew('+id+')"/></div></div>')
	}

  <?php if ($admin_edit && is_admin()) { ?>
	function getArtist() {
		const id = $("#artist_fetch_id").val();
		if (id > 0) {
			$.get(`/admin_cmds.php?cmd=get_artist&id=${id}`, function (data) {
				artistclear();
				$('#artist_id').val(data[0].id);
				$('#artist_nick').val(data[0].nick);
				$('#artist_acronym').val(data[0].acronym);
				$('#artist_www').val(data[0].www);
				$('#artist_country').val(data[0].country).trigger('change');
				$('#artist_status').val(data[0].active).trigger('change');
				let crewslist = $("#artist_crew_fetch_id");
				crewslist.empty();
				$.each(data[0].crews, function (i, crew) {
					addArtistCrewItem(crewslist,crew.id,crew.name)
				});
			});
		} else {
			artistclear();
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
						showArtistAlert("Artist Deleted!",true);
						artistclear();
						getArtistList();
					}
				});
			}
		}
	}
  <?php } ?>
	function saveArtist() {
    if ($("#artist_nick").val().trim().length==0) {
      showArtistAlert("You must fill the artist nick field!",false);
      return;
    }

		const form = $("#artist_form");
		const url = form.attr("action");
		$.ajax({
			"type": "POST",
			"url": url,
			"data": form.serialize(),
      "error": (r) => {
        if (r.status==409) {
          showArtistAlert("The artist already exists!",false);
        } else {
          showArtistAlert("There was an error during saving!",false);
        }
      },
			"success": () => {
				showArtistAlert("Artist Saved!",true);
				artistclear();
        <?php if ($admin_edit && is_admin()) { ?>
				getArtistList();
        <?php } ?>
			}
		});
	}

	function deleteArtistCrew(id) {
		const activeName = $("#crew_fetch_name_"+id.toString()).text();
		if (confirm(`Are you sure you want to delete ${activeName} Crew?`)) {
			let crewitem = $("#artist_crew_entry"+id.toString());
			crewitem.remove();
			showArtistAlert("Crew Deleted!",true);
		}
	}
	
	function addArtistCrew() {
		let crewid = $("#artist_crew_add_fetch_id").val()
		let crewname = $("#artist_crew_add_fetch_id option:selected").text()
		
		if (crewid>0) {
			if (!($("#artist_crew_entry"+crewid).length)) {
				let crewlist = $("#artist_crew_fetch_id");
				addArtistCrewItem(crewlist,crewid,crewname)
			}
			$("#artist_crew_add_fetch_id").val('0');
			showArtistAlert("Crew Added!",true);
		}
	}  
	
	function showArtistAlert(content, success) {
    if (success) {
		alertContent = `<div id="#success-alert" class="bs-component quick-alert amb-1 animate__animated animate__shakeX alert alert-dismissible alert-success"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
    } else {
		alertContent = `<div id="#failure-alert" class="bs-component quick-alert amb-1 animate__animated animate__shakeX alert alert-dismissible alert-warning"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
    }
		$("#artist").prepend(alertContent);
	}

</script>
<div class="tab-pane fade ap-1" id="artist">
  <?php if ($admin_edit && is_admin()) { ?>
	<form id="del_artist_form" action="/admin_cmds.php?cmd=del_artist" method="post">
		<input type="hidden" name="id" id="del_artist_id">
	</form>
	<div class="row apb-1">
		<div class="col-6">
			<form>
				<select class="select2" name="artist_id" id="artist_fetch_id" onchange="getArtist();"></select>
			</form>
		</div>
	</div>
	<form id="artist_form" action="/admin_cmds.php?cmd=save_artist" method="post">
  <?php } else { ?>
	<form id="artist_form" action="/cmds.php?cmd=save_artist" method="post">
  <?php } ?>

		<input type="hidden" name="id" id="artist_id">

		<div class="row">
			<div class="col-6 d-flex">
				<label for="artist_nick" class="lightgrey apr-1">Nick (required)</label>
			</div>
		</div>

		<div class="row apb-1">
			<div class="col-6 d-flex">
				<input class="w-100" type="text" id="artist_nick" name="nick">
			</div>
		</div>

		<div class="row">
			<div class="col-6 d-flex justify-content-between">
				<label for="artist_acronym" class="lightgrey">Acronym</label>
			</div>
		</div>

		<div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<input class="w-100" type="text" id="artist_acronym" name="acronym">
			</div>
		</div>

		<div class="row">
			<div class="col-6 d-flex justify-content-between">
				<label for="artist_www" class="lightgrey">Webpage</label>
			</div>
		</div>

		<div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<input class="w-100" type="text" size="24" id="artist_www" name="www">
			</div>
		</div>

		<div class="row">
			<div class="col-6 d-flex justify-content-between">Crews:</div>
		</div>
		<div id="artist_crew_fetch_id"></div>
		<div class="row apb-1">
			<div class="col-6 d-flex">
				<select class="select2" id="artist_crew_add_fetch_id" class="w-100">
					<option value="0">Select Crew</option>
					<?php
					$result = fetchAll("SELECT id, name FROM crews ORDER BY name");
					foreach($result as $row) {
						?>
						<option value="<?=$row->id?>"><?=$row->name?></option>
						<?php
					}
					?>
				</select>
				<span class="apl-1"><input type="button" value="Add Crew!" onclick="addArtistCrew()"/></span>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="artist_country" class="lightgrey">Country</label>
        <div style="min-width:40%">
				<select class="select2" name="country" id="artist_country">
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
		</div>

		<div class="row">
			<div class="col-6 d-flex justify-content-between">
				<label for="artist_status" class="lightgrey">Status</label>
        <div>
				<select class="select2" name="active" id="artist_status">
					<option value="Active">Active</option>
					<option value="Inactive">Inactive</option>
				</select>
        </div>
			</div>
		</div>  

		<div class="row apt-1">
			<div class="col-12">
				<input type="button" class="btn-big" value="Save" onclick="saveArtist()">
				<input type="button" class="btn-big bg-red" value="Delete" onclick="delArtist()">
			</div>
		</div>

	</form>
</div>
<?php if ($admin_edit && is_admin()) { ?>
<script>
	$(function () {
		getArtistList();
	});
</script>
<?php } ?>
