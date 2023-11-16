<?php
	// --------------------------------------------------------------------------------
	// EDIT app FIELD
	// --------------------------------------------------------------------------------
?>
<script>
  function appclear() {
    $("#app_id, #app_name, #app_author, #app_file, #app_year, #app_month, #app_day").val('').trigger('change');
  }

	<?php if ($admin_edit && is_admin()) { ?>
		function getApp() {
			const id = $("#app_fetch_id").val();
			if (id > 0) {
				$.get(`/admin_cmds.php?cmd=get_app&id=${id}`, function (data) {
					appclear();
					$('#app_id').val(data[0].id);
					$('#app_name').val(data[0].name);
					$('#app_author').val(data[0].author);
 					$('#app_file').val(data[0].filename);
					$('#app_year').val(data[0].year).trigger('change');
					$('#app_month').val(data[0].month).trigger('change');
					$('#app_day').val(data[0].day).trigger('change');
				});
			} else {
				appclear();
			}
		}

		function getAppList() {
			let applist = $("#app_fetch_id");
			applist.empty();
			applist.append($("<option/>").val("").text("Select App"));
			$.get("/admin_cmds.php?cmd=get_app", function (data) {
				$.each(data, function (i, app) {
					applist.append($("<option/>").val(app.id).text(app.name));
					if (($("#edit_app_id").val().length) && (app.id == $("#edit_app_id").val())) {         
						$("#app_fetch_id").val(app.id).trigger("change");
						$("#edit_app_id").val("")
          }
				});
			});
		}

		function delApp() {
			const activeName = $("#app_name").val();
			if (activeName !== "") {
				if (confirm(`Are you sure you want to delete ${activeName}?`)) {
					const form = $("#del_app_form");
					$("#del_app_id").val($("#app_id").val());
					const url = form.attr("action");
					$.ajax({
						"type": "POST",
						"url": url,
						"data": form.serialize(),
						"success": () => {
							showAppAlert("App Deleted!", true);
							appclear();
							getAppList();
						}
					});
				}
			}
		}
	<?php } ?>
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
		alertContent = `<div id="#success-alert" class="bs-component quick-alert animate__animated animate__bounceIn alert alert-success">${content}</div>`;
    } else {
		alertContent = `<div id="#failure-alert" class="bs-component quick-alert animate__animated animate__shakeX alert alert-warning">${content}</div>`;
    }
		$("#app").prepend(alertContent).children().first().delay(2000).slideUp();
	}
</script>


<div class="tab-pane fade ap-1" id="app">
	<?php if ($admin_edit && is_admin()) { ?>
		<form id="del_app_form" action="/admin_cmds.php?cmd=del_app" method="post">
			<input type="hidden" name="id" id="del_app_id">
		</form>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<select class="select2" name="app_id" id="app_fetch_id" class="w-100" onchange="getApp();">
				</select>
			</div>
		</div>
		<form id="app_form" action="/admin_cmds.php?cmd=save_app" method="post">
		<?php } else { ?>
			<form id="app_form" action="/cmds.php?cmd=save_app" method="post">
			<?php } ?>
			<input type="hidden" name="id" id="app_id">

		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apt-1">
				<label for="app_name" class="lightgrey">App Name (required)</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<input type="text" class="w-100"  id="app_name" name="name">
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<label for="app_author" class="lightgrey">App Author</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<input type="text" class="w-100" id="app_author" name="author">
			</div>
		</div>
    <div class="row apb-1">
      <div class="col-xs-12 col-md-6 apb-1">
        <label for="app_year" class="lightgrey">Release Date</label>
        <div class="row apt-1">
          <div class="col-4">
            <select class="select2" name="year" id="app_year">
              <option value="0">Unknown</option>
              <?php for ($i=date('Y'); $i>=1986; $i--) { ?>
                <option <?php if ($i==date('Y')) { ?> selected="selected" <?php } ?> value="<?=$i?>"><?=$i?></option>
              <?php } ?>
            </select>
          </div>
          <div class="col-4">
            <select class="select2" name="month" id="app_month">
              <option value="0">Unknown</option>
              <?php
              $countmonth=1;
              $maxmonth=12;
              while($countmonth<=$maxmonth)
              {
                ?>
                <option <?php if ($countmonth==date('m')) { ?> selected="selected" <?php } ?>><?=$countmonth?></option>
                <?php
                $countmonth++;
              }
              ?>
            </select>
          </div>
          <div class="col-4">
            <select class="select2" name="day" id="app_day">
              <option value="0">Unknown</option>
              <?php
              $countday=1;
              $maxday=31;
              while($countday<=$maxday)
              {
                ?>
                <option <?php if ($countday==date('d')) { ?> selected="selected" <?php } ?>><?=$countday?></option>
                <?php
                $countday++;
              }
              ?>
            </select>
          </div>
          <div class="d-block d-sm-none" style="height: 16px;"></div>
        </div>
      </div>
    </div>    
			<?php if ($admin_edit && is_admin()) { ?>
				<div class="row apb-1">
					<div class="col-xs-12 col-md-6">
						<label for="app_file" class="lightgrey w-100 apt-1">File</label>
					</div>
				</div>

				<div class="row apb-1 col-xs-12 col-md-6">
					<input class="w-100" type="text" id="app_file" name="file">
				</div>
			<?php } else { ?>  
		<div class="row">
			<div class="col-xs-12 col-md-6 apb-1 apt-0">
				<label for="app_file" class="lightgrey">File (required)</label>
			</div>
		</div>
		<div class="row">
			<div class="col-xs-12 col-md-6 apb-1 m-0">
				<input type="file" class="w-100 p-0 amr-1" id="app_file" name="file"/>
			</div>
		</div>
			<?php } ?>  
		<div class="row apt-1">
			<div class="col-12">
				<input type="button" class="btn-big w-100 white bg-green col-xs-12 col-md-2 amb-1" value="Save" onclick="saveapp()">
        <?php if ($admin_edit && is_admin()) { ?>
          <input type="button" class="btn-big w-100 bg-red white w-100 col-xs-12 col-md-2 amb-1" value="Delete" onclick="delApp()">
        <?php } ?>
			</div>
		</div>
	</form>
  <input type="hidden" id="edit_app_id" value="<?php if(isset($_POST['getappid']) && (isset($_POST['open_edit_app_field']))) echo $_POST['getappid']; ?>">
  </div>

		<?php if ($admin_edit && is_admin()) { ?>
			<script>
				$(function () {
					getAppList();
				});
			</script>
		<?php } ?>
