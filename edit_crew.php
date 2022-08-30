<?php

//--------------------------------------------------------------------------------
// EDIT CREW FIELD
//--------------------------------------------------------------------------------
?>
<script>
	function crewclear() {
		<?php if ($admin_edit && is_admin()) { ?>
			$("#crew_id, #crew_name, #crew_acronym, #crew_contact, #crew_url, #crew_rating, #crew_www, #crew_active").val('').trigger('change');
		<?php } else { ?>
			$("#crew_id, #crew_name, #crew_acronym, #crew_contact, #crew_url, #crew_www, #crew_active").val('').trigger('change');
		<?php } ?>

		let bbslist = $("#crew_bbs_fetch_id");
		bbslist.empty();
		$("#crew_bbs_add_fetch_id").val("0").trigger('change');
	}
	
	function addCrewBBSItem(bbslist,id,name) {
		bbslist.append('<div id="crew_bbs_entry'+id+'" class="p-0 row apb-1"><div class="col-xs-12 col-md-5"><div class="w-100 bg-input grey-text" id="bbs_fetch_name_'+id+'">'+name+'</div><input type="hidden" name="bbsname[]" value="'+name+'"></div><div class="col-xs-12 col-md-1"><input type="button" class="bg-red white w-100" value="Delete" onclick="deleteCrewBBS('+id+')"/></div></div>')
	}
	
	<?php if ($admin_edit && is_admin()) { ?>
		function getCrew() {
			const id = $("#crew_fetch_id").val();
			if (id > 0) {
				$.get(`/admin_cmds.php?cmd=get_crew&id=${id}`, function (data) {
					crewclear();
					$('#crew_id').val(data[0].id);
					$('#crew_name').val(data[0].name);
					$('#crew_acronym').val(data[0].acronym);
					$('#crew_contact').val(data[0].contact);
					$('#crew_url').val(data[0].url);
					$('#crew_rating').val(data[0].rating);
					$('#crew_www').val(data[0].www);
					$('#crew_active').val(data[0].active).trigger('change');
					let bbslist = $("#crew_bbs_fetch_id");
					bbslist.empty();
					$.each(data[0].bbses, function (i, bbs) {
						addCrewBBSItem(bbslist,bbs.id,bbs.name)
					});
				});
			} else {
				crewclear();
			}
		}

		function getCrewList() {
			let crewlist = $("#crew_fetch_id");
			crewlist.empty();
			crewlist.append($("<option/>").val("").text("Select Crew"));
			$.get("/admin_cmds.php?cmd=get_crew", function (data) {
				$.each(data, function (i, crew) {
					crewlist.append($("<option/>").val(crew.id).text(crew.name));
				});
			});
		}

		function delCrew() {
			const activeName = $("#crew_name").val();
			if (activeName !== "") {
				if (confirm(`Are you sure you want to delete ${activeName}?`)) {
					const form = $("#del_crew_form");
					$("#del_crew_id").val($("#crew_id").val());
					const url = form.attr("action");
					$.ajax({
						"type": "POST",
						"url": url,
						"data": form.serialize(),
						"success": () => {
							showCrewAlert("Crew Deleted!", true);
							crewclear();
							getCrewList();
						}
					});
				}
			}
		}
	<?php } ?>

	function saveCrew() {
		if ($("#crew_name").val().trim().length==0) {
			showCrewAlert("You must fill the crew name field!", false);
			return;
		}

		addCrewBBS(true);

		const form = $("#crew_form");
		const url = form.attr("action");
		$.ajax({
			"type": "POST",
			"url": url,
			"data": form.serialize(),
			"error": (r) => {
				if (r.status==409) {
					showCrewAlert("The crew already exists!",false);
				} else {
					showCrewAlert("There was an error during saving!",false);
				}
			},      
			"success": () => {
				showCrewAlert("Crew Saved!", true);
				crewclear();
				<?php if ($admin_edit && is_admin()) { ?>
					getCrewList();
				<?php } ?>
			}
		});
	}

	function deleteCrewBBS(id) {
		const activeName = $("#bbs_fetch_name_"+id.toString()).text();
		if (confirm(`Are you sure you want to delete ${activeName} BBS?`)) {
			let bbsitem = $("#crew_bbs_entry"+id.toString());
			bbsitem.remove();
			showCrewAlert("BBS Deleted!", true);
		}
	}
	
	function addCrewBBS(quiet=false) {
		let bbsid = $("#crew_bbs_add_fetch_id").val()
		let bbsname = $("#crew_bbs_add_fetch_id option:selected").text()

		if (bbsid>0) {
			if (!($("#crew_bbs_entry"+bbsid).length)) {
				let bbslist = $("#crew_bbs_fetch_id");
				addCrewBBSItem(bbslist,bbsid,bbsname)
			}
			$("#crew_bbs_add_fetch_id").val("0").trigger('change');
			if (!quiet) showCrewAlert("BBS Added!", true);
		}
	}

	function showCrewAlert(content, success) {
		if (success) {
			alertContent = `<div id="#success-alert" class="bs-component quick-alert amb-1 animate__animated animate__bounceIn alert alert-dismissible alert-success"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
		} else {
			alertContent = `<div id="#failure-alert" class="bs-component quick-alert amb-1 animate__animated animate__shakeX alert alert-dismissible alert-warning"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
		}
		$("#crew").prepend(alertContent);
	}

</script>

<div class="tab-pane fade ap-1" id="crew">
	<?php if ($admin_edit && is_admin()) { ?>
		<form id="del_crew_form" action="/admin_cmds.php?cmd=del_crew" method="post">
			<input type="hidden" name="id" id="del_crew_id">
		</form>
		<div class="row apb-1">
			<div class="col-12">
				<select class="select2" name="crew_id" id="crew_fetch_id" class="w-100" onchange="getCrew();">
				</select>
			</div>
		</div>
		<form id="crew_form" action="/admin_cmds.php?cmd=save_crew" method="post">
		<?php } else { ?>
			<form id="crew_form" action="/cmds.php?cmd=save_crew" method="post">
			<?php } ?>

			<input type="hidden" name="id" id="crew_id">
			<div class="row apb-1">
				<div class="col-xs-12 col-md-6">
					<label for="crew_name" class="lightgrey">Name (required)</label>
				</div>
			</div>
			<div class="row apb-1">
				<div class="col-xs-12 col-md-6">
					<input type="text" class="w-100" id="crew_name" name="name">
				</div>
			</div>
			<div class="row apb-1">
				<div class="col-xs-12 col-md-6">
					<label for="crew_acronym" class="lightgrey">Acronym</label>
				</div>
			</div>
			<div class="row apb-1">
				<div class="col-xs-12 col-md-6">
					<input type="text" class="w-100" id="crew_acronym" name="acronym">
				</div>
			</div>
			<div class="row apb-1">
				<div class="col-xs-12 col-md-6">
					<label for="crew_www" class="lightgrey">Webpage</label>
				</div>
			</div>
			<div class="row apb-1">
				<div class="col-xs-12 col-md-6">
					<input type="text" class="w-100" id="crew_www" name="www">
				</div>
			</div>
			<div class="row apb-1">
				<div class="col-xs-12 col-md-6">
					<label for="crew_contact" class="lightgrey">Contact</label>
				</div>
			</div>
			<div class="row apb-1">
				<div class="col-xs-12 col-md-6">
					<input type="text" class="w-100" id="crew_contact" name="contact">
				</div>
			</div>
			<?php if ($admin_edit && is_admin()) { ?>
				<div class="row apb-1">
					<div class="col-xs-12 col-md-6">
						<label for="crew_rating" class="lightgrey">Rating</label>
					</div>
				</div>
				<div class="row apb-1">
					<div class="col-xs-12 col-md-6">
						<input type="text" class="w-100" id="crew_rating" name="rating">
					</div>
				</div>
			<?php } ?>

			<div class="row apb-1">
				<div class="col-xs-12 col-md-6">
					<label for="crew_active" class="lightgrey">Status</label>
				</div>
			</div>
			<div class="row apb-1">
				<div class="col-xs-12 col-md-6">				<select class="select2" name="active" id="crew_active">
					<option value="Active">Active</option>
					<option value="Inactive">Inactive</option>
				</select>
			</div>
		</div>

	<div class="row apb-1">
		<div class="col-xs-12 col-md-5">BBSes</div>
	</div>
	<div id="crew_bbs_fetch_id"></div>
	<div class="p-0 row apb-1">
		<div class="col-xs-12 col-md-5">
			<select class="select2" id="crew_bbs_add_fetch_id" class="w-100">
				<option value="0">Select BBS</option>
				<?php
				$result = fetchAll("SELECT id, name FROM bbses ORDER BY name");
				foreach($result as $row) {
					?>
					<option value="<?=$row->id?>"><?=$row->name?></option>
					<?php
				}
				?>
			</select>


		</div>
		<div class="col-xs-12 col-md-1">

			<input type="button" class="w-100" value="Add BBS" onclick="addCrewBBS()"/>
		</div>
	</div>
	<div class="row apt-1">
		<div class="col-12">
			<input type="button" class="btn-big" value="Save" onclick="saveCrew()">
			<?php if ($admin_edit && is_admin()) { ?>
				<input type="button" class="btn-big bg-red" value="Delete" onclick="delCrew()">
			<?php } ?>
		</div>
	</div>

</form>
</div>
<?php if ($admin_edit && is_admin()) { ?>
	<script>
		$(function () {
			getCrewList();
		});
	</script>
<?php } ?>
