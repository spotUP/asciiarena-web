<?php
	// --------------------------------------------------------------------------------
	// EDIT mag FIELD
	// --------------------------------------------------------------------------------
?>
<script>
  function magclear() {
    $("#mag_id, #mag_name, #mag_author, #mag_file").val('');
  }

  function savemag() {
    if ($("#mag_name").val().trim().length==0) {
      showMagAlert("You must fill the name field!", false);
      return
    }
    
    if ($("#mag_file").val().trim().length==0) {
      showMagAlert("You must select the file to upload!", false);
      return
    }

    const form = $("#mag_form");
    const url = form.attr("action");
    $.ajax({
      "type": "POST",
      "url": url,
      "data": new FormData(form[0]),     
      "processData": false,
      "contentType": false,     
      "error": (r) => {
        if (r.status==409) {
          showMagAlert("The mag already exists!",false);
        } else {
          if (r.responseJSON && r.responseJSON.result) {
            showMagAlert(r.responseJSON.result,false);
          } else {
            showMagAlert("There was an error during saving!",false);
          }
        }
      },            
      "success": () => {
        showMagAlert("Mag Saved!", true);
        magclear();       
      }
    });
  }

	function showMagAlert(content, success) {
    if (success) {
		alertContent = `<div id="#success-alert" class="bs-component quick-alert amb-1 animate__animated animate__bounceIn alert alert-dismissible alert-success"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
    } else {
		alertContent = `<div id="#failure-alert" class="bs-component quick-alert amb-1 animate__animated animate__shakeX alert alert-dismissible alert-warning"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
    }
		$("#ascii_mag").prepend(alertContent).children().first().delay(2000).slideUp();
	}
</script>
<div class="tab-pane fade ap-1" id="ascii_mag">
	<form id="mag_form" action="/cmds.php?cmd=save_mag" method="post"> 
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apt-1">
				<label for="mag_name" class="lightgrey">Mag Name (required)</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<input type="text" class="w-100" id="mag_name" name="name">
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<label for="mag_author" class="lightgrey">Mag Author</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<input type="text" class="w-100" id="mag_author" name="author">
			</div>
		</div>
		<div class="row">
			<div class="col-xs-12 col-md-6 apb-1">
				<label for="mag_file" class="lightgrey">File (required)</label>
			</div>
		</div>
		<div class="row">
			<div class="col-xs-12 col-md-6 apb-1">
				<input type="file" class="w-100" id="mag_file" name="file"/>
			</div>
		</div>
		<div class="row apt-1">
			<div class="col-12">
				<input type="button" class="btn-big white bg-green" value="Save" onclick="savemag()">
			</div>
		</div>
	</form>
</div>
