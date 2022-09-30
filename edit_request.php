<?php
	// --------------------------------------------------------------------------------
	// EDIT REQUEST FIELD
	// --------------------------------------------------------------------------------
?>
<script>
  function requestclear() {
    $("#request_id, #request_title, #request_description").val('').trigger('change');;
  }

	<?php if ($admin_edit && is_admin()) { ?>
		function getRequest() {
			const id = $("#request_fetch_id").val();
			if (id > 0) {
				$.get(`/admin_cmds.php?cmd=get_request&id=${id}`, function (data) {
					requestclear();
					$('#request_id').val(data[0].id);
					$('#request_owner').val(data[0].requested_by);
					$('#request_title').val(data[0].title);
					$('#request_description').val(data[0].description);
				});
			} else {
				requestclear();
			}
		}

		function getRequestList() {
			let requestlist = $("#request_fetch_id");
			requestlist.empty();
			requestlist.append($("<option/>").val("").text("Select request"));
			$.get("/admin_cmds.php?cmd=get_request", function (data) {
				$.each(data, function (i, request) {
					requestlist.append($("<option/>").val(request.id).text(request.title));
					if (($("#edit_request_id").val().length) && (request.id == $("#edit_request_id").val())) {         
						$("#request_fetch_id").val(request.id).trigger("change");
						$("#edit_request_id").val("")
          }
				});
			});
		}

		function delRequest() {
			const activeName = $("#request_title").val();
			if (activeName !== "") {
				if (confirm(`Are you sure you want to delete ${activeName}?`)) {
					const form = $("#del_request_form");
					$("#del_request_id").val($("#request_id").val());
					const url = form.attr("action");
					$.ajax({
						"type": "POST",
						"url": url,
						"data": form.serialize(),
						"success": () => {
							showRequestAlert("request Deleted!", true);
							requestclear();
							getrequestList();
						}
					});
				}
			}
		}
	<?php } ?>
  function saverequest() {
    if ($("#request_title").val().trim().length==0) {
      showrequestAlert("You must fill the title field!", false);
      return
    }
    
    if ($("#request_description").val().trim().length==0) {
      showrequestAlert("You must fill the description field!", false);
      return
    }

    const form = $("#request_form");
    const url = form.attr("action");
    $.ajax({
      "type": "POST",
      "url": url,
      "data": new FormData(form[0]),
      "processData": false,
      "contentType": false,
      "error": (r) => {
        if (r.status==409) {
          showRequestAlert("The request already exists!",false);
        } else {
          if (r.responseJSON && r.responseJSON.result) {
            showRequestAlert(r.responseJSON.result,false);
          } else {
            showRequestAlert("There was an error during saving!",false);
          }
        }
      },            
      "success": () => {
        showRequestAlert("Request Saved!", true);
        requestclear();       
      }
    });
  }

	function showRequestAlert(content, success) {
    if (success) {
		alertContent = `<div id="#success-alert" class="bs-component quick-alert animate__animated animate__bounceIn alert alert-success">${content}</div>`;
    } else {
		alertContent = `<div id="#failure-alert" class="bs-component quick-alert animate__animated animate__shakeX alert alert-warning">${content}</div>`;
    }
		$("#request").prepend(alertContent).children().first().delay(2000).slideUp();
	}
</script>
<div class="tab-pane fade ap-1" id="request">

	<?php if ($admin_edit && is_admin()) { ?>
		<form id="del_request_form" action="/admin_cmds.php?cmd=del_request" method="post">
			<input type="hidden" name="id" id="del_request_id">
		</form>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<select class="select2" name="request_id" id="request_fetch_id" class="w-100" onchange="getRequest();">
				</select>
			</div>
		</div>
		<form id="request_form" action="/admin_cmds.php?cmd=save_request" method="post">
		<?php } else { ?>
	<form id="request_form" action="/cmds.php?cmd=save_request" method="post"> 
  			<?php } ?>
			<input type="hidden" name="id" id="request_id">

  
        <?php if ($admin_edit && is_admin()) { ?>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apt-1">
				<label for="request_owner" class="lightgrey">Requested by</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<input readonly="readonly" type="text" class="w-100" id="request_owner">
			</div>
		</div>
		<?php } ?>

		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apt-1">
				<label for="request_title" class="lightgrey">Request title</label>
			</div>
		</div>

		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<input type="text" class="w-100" id="request_title" name="title">
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<label for="request_description" class="lightgrey">Request Description</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<textarea rows="8" class="w-100 h-25" id = "request_description" name="description"></textarea>
			</div>
		</div>

		<div class="row apt-1">
			<div class="col-12">
				<input type="button" class="btn-big w-100 white bg-green col-xs-12 col-md-2 amb-1" value="Save" onclick="saverequest()">
        <?php if ($admin_edit && is_admin()) { ?>
          <input type="button" class="btn-big w-100 bg-red white w-100 col-xs-12 col-md-2 amb-1" value="Delete" onclick="delRequest()">
        <?php } ?>
			</div>
		</div>
	</form>
  <input type="hidden" id="edit_request_id" value="<?php if(isset($_POST['getrequestid']) && (isset($_POST['open_edit_request_field']))) echo $_POST['getrequestid']; ?>">
</div>

		<?php if ($admin_edit && is_admin()) { ?>
			<script>
				$(function () {
					getRequestList();
				});
			</script>
		<?php } ?>
