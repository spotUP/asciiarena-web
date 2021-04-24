<?php
//--------------------------------------------------------------------------------
// EDIT ARTIST FIELD
//--------------------------------------------------------------------------------
?>
<script>
	function artistclear() {
		$("#artist_id, #artist_nick, #artist_acronym, #artist_www, #artist_country, #artist_status").val('');
		let crewslist = $("#artist_crew_fetch_id");
		crewslist.empty();
		$("#artist_crew_add_fetch_id").val("0")
	}
	
	function addArtistCrewItem(crewslist,id,name) {
		crewslist.append('<div id="artist_crew_entry'+id+'" class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between"><span id="crew_fetch_name_'+id+'">'+name+'</span><input type="hidden" name="crewname[]" value="'+name+'"><input type="button" value="Delete" onclick="deleteArtistCrew('+id+')"/></div></div>')
	}

	function getArtist() {
		const id = $("#artist_fetch_id").val();
		if (id > 0) {
			$.get(`/admin_cmds.php?cmd=get_artist&id=${id}`, function (data) {
				artistclear();
				$('#artist_id').val(data[0].id);
				$('#artist_nick').val(data[0].nick);
				$('#artist_acronym').val(data[0].acronym);
				$('#artist_www').val(data[0].www);
				$('#artist_country').val(data[0].country);
				$('#artist_status').val(data[0].active);
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

	function saveArtist() {
		const form = $("#artist_form");
		const url = form.attr("action");
		$.ajax({
			"type": "POST",
			"url": url,
			"data": form.serialize(),
			"success": () => {
				showAlert("Artist Saved!", "#artist");
				artistclear();
				getArtistList();
			}
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
						showAlert("Artist Deleted!", "#artist");
						artistclear();
						getArtistList();
					}
				});
			}
		}
	}

	function deleteArtistCrew(id) {
		const activeName = $("#crew_fetch_name_"+id.toString()).text();
		if (confirm(`Are you sure you want to delete ${activeName} Crew?`)) {
			let crewitem = $("#artist_crew_entry"+id.toString());
			crewitem.remove();
			showAlert("Crew Deleted!", "#artist");
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
			showAlert("Crew Added!", "#artist");
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
	<div class="row apb-1">
		<div class="col-6">
			<form>
				<select class="select2" name="artist_id" id="artist_fetch_id" onchange="getArtist();"></select>
			</form>
		</div>
	</div>

	<form id="artist_form" action="/admin_cmds.php?cmd=save_artist" method="post">
		<input type="hidden" name="id" id="artist_id">

		<div class="row">
			<div class="col-6 d-flex">
				<label for="artist_nick" class="lightgrey apr-1">Nick</label>
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
		<div class="row">
			<div class="col-6 d-flex justify-content-between">
				<label for="artist_country" class="lightgrey">Country</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
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

		<div class="row">
			<div class="col-6 d-flex justify-content-between">
				<label for="artist_active" class="lightgrey">Status</label>
			</div>
		</div>  

		<div class="row">
			<div class="col-6 d-flex justify-content-between">
				<select class="custom-select" name="active" id="artist_active">
					<option value="Active">Active</option>
					<option value="Inactive">Inactive</option>
				</select>
			</div>
		</div>  

		<div class="row apt-1">
			<div class="col-12">
				<input type="button" value="Save" onclick="saveArtist()">
				<input type="button" value="Delete" onclick="delArtist()">
			</div>
		</div>

	</form>
</div>
<script>
	$(function () {
		getArtistList();
	});
</script>
