<?php
//--------------------------------------------------------------------------------
// EDIT COLLY FIELD
//--------------------------------------------------------------------------------
?>

<script>
	function collyclear() {
		$("#colly_id, #colly_name, #colly_filename, #colly_year, #colly_month, #colly_day, #colly_type, #colly_diz").val('').trigger('change');
		let crewslist = $("#colly_crew_fetch_id");
		crewslist.empty();
		let artistslist = $("#colly_artist_fetch_id");
		artistslist.empty();
		$("#colly_crew_add_fetch_id").val("0").trigger('change');
		$("#colly_artist_add_fetch_id").val("0").trigger('change');
	}

	function addCollyCrewItem(crewslist,id,name) {
		crewslist.append('<div id="colly_crew_entry'+id+'" class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between"><span id="crew_fetch_name_'+id+'">'+name+'</span><input type="hidden" name="crewname[]" value="'+name+'"><input type="button" value="Delete" onclick="deleteCollyCrew('+id+')"/></div></div>')
	}

	function addCollyArtistItem(artistslist,id,name) {
		artistslist.append('<div id="colly_artist_entry'+id+'" class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between"><span id="artist_fetch_name_'+id+'">'+name+'</span><input type="hidden" name="artistname[]" value="'+name+'"><input type="button" value="Delete" onclick="deleteCollyArtist('+id+')"/></div></div>')
	}

	<?php if ($admin_edit && is_admin()) { ?>
		function getColly() {
			const id = $("#colly_fetch_id").val();
			if (id > 0) {
				$.get(`/admin_cmds.php?cmd=get_colly&id=${id}`, function (data) {      
					$('#colly_id').val(data[0].id);
					$('#colly_name').val(data[0].name);
					$('#colly_filename').val(data[0].filename);
					$('#colly_year').val(data[0].year).trigger('change');
					$('#colly_month').val(data[0].month).trigger('change');
					$('#colly_day').val(data[0].day).trigger('change');
					$('#colly_type').val(data[0].type).trigger('change');
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
					if (($("#edit_colly_id").val().length) && (colly.filename == $("#edit_colly_id").val())) {         
						$("#colly_fetch_id").val(colly.id).trigger("change");
						$("#edit_colly_id").val("")
					}			
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
							showCollyAlert("Colly Deleted!", true);
							collyclear();
							getCollyList();
						}
					});
				}
			}
		}
	<?php } ?>

	function saveColly() {
		if ($("#colly_name").val().trim().length==0) {
			showCollyAlert("You must fill the name field!", false);
			return
		}

		if ($("#colly_filename").val().trim().length==0) {
			showCollyAlert("You must select the file to upload!", false);
			return
		}

		addCollyArtist(true);
		addCollyCrew(true);

		const form = $("#colly_form");
		const url = form.attr("action");
		const data = new FormData(form[0]);
		$.ajax({
			"type": "POST",
			"url": url,
			"data": data,
			"processData": false,
			"contentType": false,     
			"error": (r) => {
				if (r.status==409) {
					showCollyAlert("The colly already exists!",false);
				} else {
					if (r.responseJSON && r.responseJSON.result) {
						showCollyAlert(r.responseJSON.result,false);
					} else {
						showCollyAlert("There was an error during saving!",false);
					}
				}         
			},           
			"success": () => {
				showCollyAlert("Colly Saved!", true);
				collyclear();
				getCollyList();
			}
		});
	}

	function fileInputchange(e) {
		var filename = e.target.files[0].name;
		$("#colly_filename2").val(filename); 
	}

	function collyDupeCheck() {
		var filename = $("#colly_filename2").val(); 
		if (filename.length==0) {
			showCollyAlert('Select the file first!', false);
			return;
		}

		$.get(`/cmds.php?cmd=dupe_check&filename=${filename}`, function (data) {  
			if (data.count==0) {
				showCollyAlert(`${$("#colly_filename2").val()} doesn't exist! Quick! Upload it!`, true);
			} else {
				showCollyAlert(`${$("#colly_filename2").val()} exists! Somebody was faster than you! :(`, false);
			}
		});
	}

	function deleteCollyArtist(id) {
		const activeName = $("#artist_fetch_name_"+id.toString()).text();
		if (confirm(`Are you sure you want to delete ${activeName} Artist?`)) {
			let artistitem = $("#colly_artist_entry"+id.toString());
			artistitem.remove();
			showCollyAlert("Author Deleted!", true);     
		}
	}

	function addCollyArtist(quiet=false) {
		let artistid = $("#colly_artist_add_fetch_id").val()
		let artistnick = $("#colly_artist_add_fetch_id option:selected").text()

		if (artistid>0) {
			if (!($("#colly_artist_entry"+artistid).length)) {
				let artistlist = $("#colly_artist_fetch_id");
				addCollyArtistItem(artistlist,artistid,artistnick)
				$("#colly_artist_add_fetch_id").val('0').trigger('change');
				if (!quiet) showCollyAlert("Author Added!", true);   
			}
		}
	}

	function deleteCollyCrew(id) {
		const activeName = $("#crew_fetch_name_"+id.toString()).text();
		if (confirm(`Are you sure you want to delete ${activeName} Crew?`)) {
			let crewitem = $("#colly_crew_entry"+id.toString());
			crewitem.remove();      
			showCollyAlert("Crew Deleted!", true);
		}
	}

	function addCollyCrew(quiet=false) {
		let crewid = $("#colly_crew_add_fetch_id").val()
		let crewname = $("#colly_crew_add_fetch_id option:selected").text()

		if (crewid>0) {
			if (!($("#colly_crew_entry"+crewid).length)) {
				let crewlist = $("#colly_crew_fetch_id");
				addCollyCrewItem(crewlist,crewid,crewname)
				$("#colly_crew_add_fetch_id").val('0').trigger('change');
				if (!quiet) showCollyAlert("Crew Added!", true);
			}
		}
	}

	function showCollyAlert(content, success) {
		if (success) {
			alertContent = `<div id="#success-alert" class="bs-component quick-alert amb-1 animate__animated animate__shakeX alert alert-dismissible alert-success"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
		} else {
			alertContent = `<div id="#failure-alert" class="bs-component quick-alert amb-1 animate__animated animate__shakeX alert alert-dismissible alert-warning"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
		}
		$("#colly").prepend(alertContent);
	}
</script>
<div class="tab-pane fade show active ap-1" id="colly">
	<?php if ($admin_edit && is_admin()) { ?>
		<form id="del_colly_form" action="/admin_cmds.php?cmd=del_colly" method="post">
			<input type="hidden" name="id" id="del_colly_id">
		</form>
		<div class="row apb-1">
			<div class="col-12">
				<form>
					<select class="select2" name="colly_id" id="colly_fetch_id" class="w-100" onchange="getColly();">
					</select>
				</form>
			</div>
		</div>

		<form id="colly_form" action="/admin_cmds.php?cmd=save_colly" method="post">
		<?php } else { ?>
			<form id="colly_form" action="/cmds.php?cmd=save_colly" method="post">
			<?php } ?>
			<input type="hidden" name="id" id="colly_id">

			<?php if ($admin_edit && is_admin()) { ?>
				<div class="row apb-1">
					<div class="col-6 d-flex justify-content-between">
						<span>file_id_here</span>
					</div>
				</div>
			<?php } else { ?>
				<div class="row apl-1 apb-1">
					Upload Amiga ASCII Colly/ANSI (No PC stuff!)
				</div>
			<?php } ?>

			<div class="row apb-0">
				<div class="col-xs-12 col-md-6">
					<label for="colly_name" class="lightgrey">Name (required)</label>
				</div>
			</div>

			<div class="row apb-1">
				<div class="col-xs-12 col-md-6">
					<input type="text" class="w-100" id="colly_name" name="name">
				</div>
			</div>

			<?php if ($admin_edit && is_admin()) { ?>
				<div class="row">
					<div class="col-xs-12 col-md-6">
						<label class="w-100" for="colly_filename" class="lightgrey w-100">File:</label>
					</div>
				</div>

				<div class="row apb-1 col-xs-12 col-md-6">
					<input class="w-100" type="text" id="colly_filename" name="filename">
					<input type="hidden"  id="colly_filename2">
				</div>

				<div class="row">
					<div class="col-xs-12 col-md-6">
						<label for="colly_type" class="lightgrey">Type</label>
						<select class="select2" name="type" id="colly_type">
							<option value="ASCII">ASCII</option>
							<option value="ANSI">ANSI</option>
						</select>
					</div>
				</div>
			<?php } else { ?>  
				<div class="row">
					<div class="col-xs-12 col-md-6">
						<label for="colly_filename" class="lightgrey w-100">File:</label>
					</div>
				</div>

				<div class="row apb-1">
					<div class="col-xs-12 col-md-6">
						<input type="hidden"  id="colly_filename2">
						<input type="file" class="w-100" id="colly_filename" onchange="fileInputchange(event)" name="filename">
					</div>
				</div>

				<div class="row apb-1">
					<div class="col-12">
						<input type="button" onclick="collyDupeCheck()" value="Dupe Check"></span>
					</div>
				</div>

			<?php } ?>


			<div class="row apb-1">
				<div class="col-xs-12 col-md-6">
					<label for="colly_year" class="lightgrey">Release Date</label>
					<div class="row">							
						<div>
							<select class="select2" name="year" id="colly_year">
								<option value="0">Unknown</option>
								<?php for ($i=date('Y'); $i>=1986; $i--) { ?>
									<option value="<?=$i?>"><?=$i?></option>
								<?php } ?>
							</select>
						</div>
						<div>
							<select class="select2" name="month" id="colly_month">
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
						</div>
						<div>
							<select class="select2" name="day" id="colly_day">
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
				</div>
			</div>    


			<div class="row apb-0">
				<div class="col-6 d-flex justify-content-between">Artists:</div>
			</div>
			<div id="colly_artist_fetch_id"></div>
			<div class="row">
				<div class="col-4 apb-1">
					<select class="select2" name="colly_artist_add_id" id="colly_artist_add_fetch_id" class="w-100">
						<option value="0">Select Artist</option>
						<?php
						$result = fetchAll("SELECT id, nick FROM artists ORDER BY nick");
						foreach($result as $row) {
							?>
							<option value="<?=$row->id?>"><?=$row->nick?></option>
							<?php
						}
						?>
					</select>
				</div>


				<div class="col-2">
					<input type="button" class="w-100" value="Add Author!" onclick="addCollyArtist()"/>
				</div>
			</div>

			<div class="row apb-0"><div class="col-12">Crews:</div></div>
			<div id="colly_crew_fetch_id"></div>
			<div class="row apb-1">
				<div class="col-4">
					<select class="select2" name="colly_crew_add_id" id="colly_crew_add_fetch_id" class="w-100">
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
				<div class="col-2">
					<input type="button" class="w-100" value="Add Crew!" onclick="addCollyCrew()"/>
				</div>
			</div>
			<div class="row">
				<div class="col-12">
					<input type="button" class="btn-big" value="Save" onclick="saveColly();">
					<?php if ($admin_edit && is_admin()) { ?>
						<input type="button" class="btn-big bg-red" value="Delete" onclick="delColly()">
					<?php } ?>
				</div>
			</div>
		</form>  
		<input type="hidden" id="edit_colly_id" value="<?php if(isset($_POST['getcollyname']) && (isset($_POST['open_edit_colly_field']))) echo $_POST['getcollyname']; ?>">
	</div>
	<?php if ($admin_edit && is_admin()) { ?>
		<script>
			$(function () {
				getCollyList();
			});
		</script>
	<?php } ?>
