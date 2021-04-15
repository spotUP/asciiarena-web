<?php

//--------------------------------------------------------------------------------
// EDIT CREW FIELD
//--------------------------------------------------------------------------------
?>
<script>
	function getCrew() {
		const id = $("#crew_fetch_id").val();
		if (id > 0) {
			$.get(`/admin_cmds.php?cmd=get_crew&id=${id}`, function (data) {
				$('#crew_id').val(data[0].id);
				$('#crew_name').val(data[0].name);
        $('#crew_acronym').val(data[0].acronym);
				$('#crew_contact').val(data[0].contact);
				$('#crew_url').val(data[0].url);
				$('#crew_rating').val(data[0].rating);
				$('#crew_www').val(data[0].www);
				$('#crew_active').val(data[0].active);
			});
      getCrewBBSes(id)
		} else {
			$("#crew_id, #crew_name, #crew_acronym, #crew_contact, #crew_url, #crew_rating, #crew_www, #crew_active").val('');
		}
	}

  function getCrewBBSes(id) {
		let bbslist = $("#crew_bbs_fetch_id");
		bbslist.empty();
		$.get(`/admin_cmds.php?cmd=get_crew_bbs&id=${id}`, function (data) {
			$.each(data, function (i, bbs) {
        bbslist.append('<div class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between"><span id="bbs_fetch_name_'+bbs.id.toString()+'">'+bbs.name+'</span><input type="button" value="Delete" onclick="deleteCrewBBS('+bbs.id+')"/></div></div>')
			});
		});
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

  function deleteCrewBBS(id) {
		const activeName = $("#bbs_fetch_name_"+id.toString()).text();
    if (confirm(`Are you sure you want to delete ${activeName} BBS?`)) {
      const form = $("#del_crew_bbs_form");
      $("#del_crew_bbs_id").val(id.toString());
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("BBS deleted!", "#crew");
          getCrew();
        }
      });
    }
  }
  
  function addBBS() {
    const form = $("#add_crew_bbs_form");
    const activeName = $("#crew_name").val();
		if (activeName !== "") {
      $("#add_crew_bbs_crew").val(activeName);
      $("#add_crew_bbs_bbs").val($("#crew_bbs_add_fetch_id option:selected").text());
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("BBS Added!", "#crew");
          $("#crew_bbs_add_fetch_id").val('0');
          getCrew();
        }
      });    
    }
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
						showAlert("Crew deleted!", "#crew");
            $("#crew_id, #crew_name, #crew_acronym, #crew_contact, #crew_url, #crew_rating, #crew_www, #crew_active").val('');
						getCrewList();
					}
				});
			}
		}
	}

	function showAlert(content, prependTo) {
		const alertContent = `<div class="bs-component quick-alert amb-1"><div id="#success-alert" class="animate__animated animate__shakeX alert alert-dismissible alert-success"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div></div>`;
		$(prependTo).prepend(alertContent);
	}

</script>

<div class="tab-pane fade ap-1" id="crew">
  <form id="del_crew_form" action="/admin_cmds.php?cmd=del_crew" method="post">
		<input type="hidden" name="id" id="del_crew_id">
	</form>
  <form id="add_crew_bbs_form" action="/admin_cmds.php?cmd=add_crew_bbs" method="post">
		<input type="hidden" name="crew" id="add_crew_bbs_crew">
		<input type="hidden" name="bbs" id="add_crew_bbs_bbs">
  </form>
  <form id="del_crew_bbs_form" action="/admin_cmds.php?cmd=del_crew_bbs" method="post">
		<input type="hidden" name="id" id="del_crew_bbs_id">
	</form>
	<div class="row apb-1">
		<div class="col-12">
			<form>
				<select name="crew_id" id="crew_fetch_id" class="w-100" onchange="getCrew();">
				</select>
			</form>
		</div>
	</div>
  
  <form id="crew_form" action="/admin_cmds.php?cmd=save_crew" method="post">
		<input type="hidden" name="id" id="crew_id">
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="crew_name" class="lightgrey">Name</label>
				<input type="text" size="24" id="crew_name" name="name">
			</div>
		</div>
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="crew_acronym" class="lightgrey">Acronym</label>
				<input type="text" size="24" id="crew_acronym" name="acronym">
			</div>
		</div>
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="crew_www" class="lightgrey">Webpage</label>
				<input type="text" size="24" id="crew_www" name="www">
			</div>
		</div>
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="crew_contact" class="lightgrey">Contact</label>
				<input type="text" size="24" id="crew_contact" name="contact">
			</div>
		</div>

    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="crew_rating" class="lightgrey">Rating</label>
				<input type="text" size="24" id="crew_rating" name="rating">
			</div>
		</div>

    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="crew_active" class="lightgrey">Status</label>
        <select name="active" id="crew_active">
          <option value="Inactive">Inactive</option>
					<option value="Active">Active</option>
				</select>
			</div>
		</div>
       
    <div class="row apb-1"><div class="col-6 d-flex justify-content-between">BBSes:</div></div>
    <div id="crew_bbs_fetch_id"></div>
    <div class="pl-2 pr-2 row apb-1"><div class="col-6 d-flex justify-content-between">

    <select name="bbs_add_id" id="crew_bbs_add_fetch_id" class="w-100">
					<option value="0">Select BBS</option>
					<?php
					$result = fetchAll("SELECT id, name FROM bbses ORDER BY name");
					foreach($result as $row) {
						?>
						<option value="<?=$row->id?>"><?=$row->name?></option>
						<?php
					}
					?>
		</select><input type="button" value="Add BBS!" onclick="addBBS()"/>
    </div></div>
		<div class="row apt-1">
			<div class="col-12">
				<input type="submit" name="do_edit_crew" value="Submit">
				<input type="button" id="delete_crew" name="delete_crew" value="Delete" onclick="delCrew();">
			</div>
		</div>

  </form>
</div>
<script>
	$(function () {
    getCrewList();
		$("#crew_form").submit(function (e) {
			e.preventDefault();
      const form = $(this);
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("Crew saved!", "#crew");
          $("#crew_id, #crew_name, #crew_acronym, #crew_contact, #crew_url, #crew_rating, #crew_www, #crew_active").val('');
          getCrewList();
        }
      });
		});
	});
</script>
