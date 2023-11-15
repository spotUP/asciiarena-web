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
		$("#artist_crew_add_fetch_id").val("0").trigger('change');
	}
	
	function addArtistCrewItem(crewslist,id,name) {
		crewslist.append('<div id="artist_crew_entry'+id+'" class="p-0 row apb-1"><div class="col-xs-12 col-md-5"><span class="am-0 ap-0 d-block bg-input grey-text w-100" id="crew_fetch_name_'+id+'">'+name+'</span><input type="hidden" name="crewname[]" value="'+name+'"></div><div class="col-xs-12 col-md-1"><input type="button" class="white bg-red w-100" value="Delete" onclick="deleteArtistCrew('+id+')"/></div></div>')
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
          console.log("se "+$("#edit_artist_name").val()+"!")
			artistlist.append($("<option/>").val("").text("Select Artist"));
			$.get("/admin_cmds.php?cmd=get_artist", function (data) {
				$.each(data, function (i, artist) {
					artistlist.append($("<option/>").val(artist.id).text(artist.nick));
          if (($("#edit_artist_name").val().length) && (artist.nick == $("#edit_artist_name").val())) {         
            $("#artist_fetch_id").val(artist.id).trigger("change");
            $("#edit_artist_name").val("")
          }
          
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
		addArtistCrew(true);
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
	
	function addArtistCrew(quiet=false) {
		let crewid = $("#artist_crew_add_fetch_id").val()
		let crewname = $("#artist_crew_add_fetch_id option:selected").text()
		
		if (crewid>0) {
			if (!($("#artist_crew_entry"+crewid).length)) {
				let crewlist = $("#artist_crew_fetch_id");
				addArtistCrewItem(crewlist,crewid,crewname)
			}
			$("#artist_crew_add_fetch_id").val('0').trigger('change');
			if (!quiet) showArtistAlert("Crew Added!",true);
		}
	}  
	
	function showArtistAlert(content, success) {
		if (success) {
			alertContent = `<div id="#success-alert" class="bs-component quick-alert animate__animated animate__bounceIn alert alert-success">${content}</div>`;
		} else {
			alertContent = `<div id="#failure-alert" class="bs-component quick-alert animate__animated animate__shakeX alert alert-warning">${content}</div>`;
		}
		$("#artist").prepend(alertContent).children().first().delay(2000).slideUp();
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
					<select class="select2 w-100" name="artist_id" id="artist_fetch_id" onchange="getArtist();"></select>
				</form>
			</div>
		</div>
		<form id="artist_form" action="/admin_cmds.php?cmd=save_artist" method="post">
		<?php } else { ?>
			<form id="artist_form" action="/cmds.php?cmd=save_artist" method="post">
			<?php } ?>

			<input type="hidden" name="id" id="artist_id">

			<div class="row">
				<div class="col-xs-12 col-md-6 apb-1 apt-1">
					<label for="artist_nick" class="lightgrey apr-1">Nick (required)</label>
				</div>
			</div>

			<div class="row apb-1">
				<div class="col-xs-12 col-md-6 apb-1">
					<input class="w-100" type="text" id="artist_nick" name="nick">
				</div>
			</div>

			<div class="row">
				<div class="col-xs-12 col-md-6 apb-1">
					<label for="artist_acronym" class="lightgrey">Acronym</label>
				</div>
			</div>

			<div class="row apb-1">
				<div class="col-xs-12 col-md-6 apb-1">
					<input class="w-100" type="text" id="artist_acronym" name="acronym">
				</div>
			</div>

			<div class="row">
				<div class="col-xs-12 col-md-6 apb-1">
					<label for="artist_www" class="lightgrey">Webpage</label>
				</div>
			</div>

			<div class="row apb-1">
				<div class="col-xs-12 col-md-6 apb-1">
					<input class="w-100" type="text" size="24" id="artist_www" name="www">
				</div>
			</div>

			<div class="row">
				<div class="col-xs-12 col-md-6 apb-1">Crews</div>
			</div>
			<div id="artist_crew_fetch_id"></div>
			<div class="row apb-1">
				<div class="col-xs-12 col-md-4">
					<select class="select2 w-100" id="artist_crew_add_fetch_id" class="w-100">
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
				</div>
				<div class="col-xs-12 col-md-2">
					<input class="w-100" type="button" value="Add Crew" onclick="addArtistCrew()"/>
				</div>
			</div>
			<div class="row">
				<div class="col-xs-12 col-md-5 apb-1 apt-1">
					<label for="artist_country" class="lightgrey">Country</label>
				</div>
			</div>
			<div class="row apb-1">
				<div class="col-xs-12 col-md-6 apb-1">
					<select class="select2 w-100" name="country" id="artist_country">
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
				<div class="col-xs-12 col-md-6 apb-1">
					<label for="artist_status" class="lightgrey">Status</label>
				</div>
			</div>  

			<div class="row">
				<div class="col-xs-12 col-md-6 apb-1">
					<div>
						<select class="select2 w-100" name="active" id="artist_status">
							<option value="Active">Active</option>
							<option value="Inactive">Inactive</option>
						</select>
					</div>
				</div>
			</div>  

			<div class="row apt-1">
				<div class="col-12">
					<input type="button" class="btn-big white bg-green w-100 col-xs-12 col-md-2 amb-1" value="Save" onclick="saveArtist()">
					<input type="button" class="btn-big white bg-red w-100 col-xs-12 col-md-2 amb-1" value="Delete" onclick="delArtist()">
				</div>
			</div>

		</form>
    <input type="hidden" id="edit_artist_name" value="<?php if(isset($_POST['getartist']) && (isset($_POST['open_edit_artist_field']))) echo $_POST['getartist']; ?>">
	</div>
	<?php if ($admin_edit && is_admin()) { ?>
		<script>
			$(function () {
				getArtistList();
			});
		</script>
	<?php } ?>
