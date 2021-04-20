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
					"success": () => {
						showAlert("Logo deleted!", "#sitelogo");
            logoclear();
						getLogoList();
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
<div class="tab-pane fade ap-1" id="sitelogo">
  <form id="del_logo_form" action="/admin_cmds.php?cmd=del_logo" method="post">
		<input type="hidden" name="id" id="del_logo_id">
	</form>
  <div class="row apb-1">
		<div class="col-12">
			<form>
				<select name="logo_id" id="logo_fetch_id" class="w-100" onchange="getLogo();">
				</select>
			</form>
		</div>
	</div>
  
  <form id="logo_form" enctype="multipart/form-data" action="/admin_cmds.php?cmd=save_logo" method="post">
		<input type="hidden" name="id" id="logo_id">
		<input type="hidden" name="author" id="logo_author">
		<input type="hidden" name="name" id="logo_name">

    <div class="row apb-1 apt-1">
      <div class="col-12">
        <textarea id="logo_ascii" wrap="physical" cols="80" name="ascii" rows="8"/></textarea>
      </div>
    </div>
    <div class="row">
      <div class="col-12">
				<input type="submit" name="do_edit_logo" value="Save">
				<input type="button" id="delete_logo" name="delete_logo" value="Delete" onclick="delLogo();">
      </div>
    </div>
  </form>  
</div>
<script>
	$(function () {
    getLogoList();
		$("#logo_form").submit(function (e) {
			e.preventDefault();
      const form = $(this);
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("Logo saved!", "#sitelogo");
          logoclear();
          getLogoList();
        }
      });
		});
	});
</script>
