<?php
	// --------------------------------------------------------------------------------
	// EDIT BBS FIELD
	// --------------------------------------------------------------------------------
?>
<script>
  function bbsclear() {
    $("#bbs_id, #bbs_name, #bbs_sysop, #bbs_number, #bbs_address").val('');
  }
  
	function getBBS() {
		const id = $("#bbs_fetch_id").val();
		if (id > 0) {
			$.get(`/admin_cmds.php?cmd=get_bbs&id=${id}`, function (data) {
        bbsclear();
				$('#bbs_id').val(data[0].id);
				$('#bbs_name').val(data[0].name);
				$('#bbs_sysop').val(data[0].sysop);
				$('#bbs_address').val(data[0].address);
				$('#bbs_number').val(data[0].number);
			});
		} else {
			bbsclear();
		}
	}

	function getBBSList() {
		let bbslist = $("#bbs_fetch_id");
		bbslist.empty();
		bbslist.append($("<option/>").val("").text("Select BBS"));
		$.get("/admin_cmds.php?cmd=get_bbs", function (data) {
			$.each(data, function (i, bbs) {
				bbslist.append($("<option/>").val(bbs.id).text(bbs.name));
			});
		});
	}

  function saveBBS() {
    const form = $("#bbs_form");
    const url = form.attr("action");
    $.ajax({
      "type": "POST",
      "url": url,
      "data": form.serialize(),
      "success": () => {
        showAlert("BBS Saved!", "#bbs");
        bbsclear();
        getBBSList();
      }
    });
  }

	function delBBS() {
		const activeName = $("#bbs_name").val();
		if (activeName !== "") {
			if (confirm(`Are you sure you want to delete ${activeName}?`)) {
				const form = $("#del_bbs_form");
				$("#del_bbs_id").val($("#bbs_id").val());
				const url = form.attr("action");
				$.ajax({
					"type": "POST",
					"url": url,
					"data": form.serialize(),
					"success": () => {
						showAlert("BBS Deleted!", "#bbs");
						bbsclear();
						getBBSList();
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
<div class="tab-pane fade ap-1" id="bbs">
	<form id="del_bbs_form" action="/admin_cmds.php?cmd=del_bbs" method="post">
		<input type="hidden" name="id" id="del_bbs_id">
	</form>
	<div class="row apb-1">
		<div class="col-12">
			<form>
				<select class="select2" name="bbs_id" id="bbs_fetch_id" class="w-100" onchange="getBBS();">
				</select>
			</form>
		</div>
	</div>
	<form id="bbs_form" action="/admin_cmds.php?cmd=save_bbs" method="post">
		<input type="hidden" name="id" id="bbs_id">
		<div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="bbs_name" class="lightgrey">Name</label>
				<input type="text" size="24" id="bbs_name" name="name">
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="bbs_sysop" class="lightgrey">Sysop</label>
				<input type="text" size="24" id="bbs_sysop" name="sysop">
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="bbs_address" class="lightgrey">Address</label>
				<input type="text" size="24" id="bbs_address" name="address"/>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="bbs_number" class="lightgrey">Phone Number</label>
				<input type="text" size="24" id="bbs_number" name="number"/>
			</div>
		</div>
		<div class="row apt-1">
			<div class="col-12">
				<input type="button" value="Save" onclick="saveBBS()">
				<input type="button" value="Delete" onclick="delBBS()">
			</div>
		</div>
	</form>
</div>
<script>
	$(function () {
    getBBSList();
	});
</script>
