<?php
	// --------------------------------------------------------------------------------
	// EDIT app FIELD
	// --------------------------------------------------------------------------------
?>
<script>
  function appclear() {
    $("#app_id, #app_name, #app_author, #app_file").val('');
  }

  function saveapp() {
    if ($("#app_name").val().trim().length==0) {
      showAppAlert("You must fill the name field!", false);
      return
    }
    
    if ($("#app_file").val().trim().length==0) {
      showAppAlert("You must select the file to upload!", false);
      return
    }

    const form = $("#app_form");
    const url = form.attr("action");
    $.ajax({
      "type": "POST",
      "url": url,
      "data": new FormData(form[0]),
      "processData": false,
      "contentType": false,
      "error": (r) => {
        if (r.status==409) {
          showAppAlert("The app already exists!",false);
        } else {
          if (r.responseJSON && r.responseJSON.result) {
            showAppAlert(r.responseJSON.result,false);
          } else {
            showAppAlert("There was an error during saving!",false);
          }
        }
      },            
      "success": () => {
        showAppAlert("App Saved!", true);
        appclear();       
      }
    });
  }

	function showAppAlert(content, success) {
    if (success) {
		alertContent = `<div id="#success-alert" class="bs-component quick-alert amb-1 animate__animated animate__shakeX alert alert-dismissible alert-success"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
    } else {
		alertContent = `<div id="#failure-alert" class="bs-component quick-alert amb-1 animate__animated animate__shakeX alert alert-dismissible alert-warning"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
    }
		$("#app").prepend(alertContent);
	}
</script>
<div class="tab-pane fade ap-1" id="app">
	<form id="app_form" action="/cmds.php?cmd=save_app" method="post"> 
		<div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="app_name" class="lightgrey">App Name (required)</label>
				<input type="text" size="24" id="app_name" name="name">
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="app_author" class="lightgrey">App Author</label>
				<input type="text" size="24" id="app_author" name="author">
			</div>
		</div>
		<div class="row">
			<div class="col-6 d-flex justify-content-between">
				<label for="app_file" class="lightgrey">File (required)</label>
				<input type="file" size="24" id="app_file" name="file"/>
			</div>
		</div>
		<div class="row apt-1">
			<div class="col-12">
				<input type="button" value="Save" onclick="saveapp()">
			</div>
		</div>
	</form>
</div>
