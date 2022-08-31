<?php
//--------------------------------------------------------------------------------
// EDIT SITELOGO FIELD
//--------------------------------------------------------------------------------
?>

<script>
	function logoclear() {
		$("#logo_id, #logo_author, #logo_ascii").val('');
	}
	
	function getLogo() {
		const id = $("#logo_fetch_id").val();
		if (id > 0) {
			$.get(`/admin_cmds.php?cmd=get_logo&id=${id}`, function (data) {
        logoclear();
				$('#logo_id').val(data[0].id);
				$('#logo_name').val(data[0].id);
				$('#logo_author').val(data[0].author);
				$('#logo_ascii').val(data[0].ascii);
			});
		} else {
			logoclear();
		}
	}

	function getLogoList() {
		let logolist = $("#logo_fetch_id");
		logolist.empty();
		logolist.append($("<option/>").val("").text("Select logo"));
		$.get("/admin_cmds.php?cmd=get_logo", function (data) {
			$.each(data, function (i, logo) {
				logolist.append($("<option/>").val(logo.id).text(logo.id));
			});
		});
	}
	
	function saveLogo() {
		const form = $("#logo_form");
		const url = form.attr("action");
		$.ajax({
			"type": "POST",
			"url": url,
			"data": form.serialize(),
			"success": () => {
				showSiteLogoAlert("Logo Saved!", true);
				logoclear();
				getLogoList();
			}
		});
	}
	
	function delLogo() {
		const activeName = $("#logo_name").val();
		if (activeName !== "") {
			if (confirm(`Are you sure you want to delete ${activeName}?`)) {
				const form = $("#del_logo_form");
				$("#del_logo_id").val($("#logo_id").val());
				const url = form.attr("action");
				$.ajax({
					"type": "POST",
					"url": url,
					"data": form.serialize(),
          "error": (r) => {
            showSiteLogoAlert("There was an error during saving!",false);
          },      
          
					"success": () => {
						showSiteLogoAlert("Logo Deleted!", true);
						logoclear();
						getLogoList();
					}
				});
			}
		}
	}

	function showSiteLogoAlert(content, success) {
    if (success) {
		alertContent = `<div id="#success-alert" class="bs-component quick-alert animate__animated animate__bounceIn alert alert-success">${content}</div>`;
    } else {
		alertContent = `<div id="#failure-alert" class="bs-component quick-alert animate__animated animate__shakeX alert alert-warning">${content}</div>`;
    }
		$("#sitelogo").prepend(alertContent).children().first().delay(2000).slideUp();
	}
	
</script>
<div class="tab-pane fade ap-1" id="sitelogo">
	<form id="del_logo_form" action="/admin_cmds.php?cmd=del_logo" method="post">
		<input type="hidden" name="id" id="del_logo_id">
	</form>
	<div class="row apb-1">
		<div class="col-xs-12 col-md-10">
			<form>
				<select class="select2" name="logo_id" id="logo_fetch_id" class="w-100" onchange="getLogo();">
				</select>
			</form>
		</div>
	</div>
	
	<form id="logo_form" enctype="multipart/form-data" action="/admin_cmds.php?cmd=save_logo" method="post">
		<input type="hidden" name="id" id="logo_id">
		<input type="hidden" name="author" id="logo_author">
		<input type="hidden" name="name" id="logo_name">

		<div class="row apb-1">
			<div class="col-xs-12 col-10">
				<textarea id="logo_ascii" class="w-100" wrap="physical" name="ascii" rows="8"/></textarea>
			</div>
		</div>
		<div class="row">
			<div class="col-12">
				<input type="button" class="btn-big" value="Save" onclick="saveLogo()">
				<input type="button" class="btn-big bg-red" value="Delete" onclick="delLogo()">
			</div>
		</div>
	</form>  
</div>
<script>
	$(function () {
		getLogoList();
	});
</script>
