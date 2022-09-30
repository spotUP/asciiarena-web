<?php
	// --------------------------------------------------------------------------------
	// EDIT mag FIELD
	// --------------------------------------------------------------------------------
?>
<script>
  function magclear() {
    $("#mag_id, #mag_name, #mag_author, #mag_file, #mag_year, #mag_month, #mag_day").val('').trigger('change');;
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

	<?php if ($admin_edit && is_admin()) { ?>
		function getMag() {
			const id = $("#mag_fetch_id").val();
			if (id > 0) {
				$.get(`/admin_cmds.php?cmd=get_mag&id=${id}`, function (data) {
					magclear();
					$('#mag_id').val(data[0].id);
					$('#mag_name').val(data[0].name);
					$('#mag_author').val(data[0].author);
 					$('#mag_file').val(data[0].filename);
					$('#mag_year').val(data[0].year).trigger('change');
					$('#mag_month').val(data[0].month).trigger('change');
					$('#mag_day').val(data[0].day).trigger('change');
				});
			} else {
				magclear();
			}
		}

		function getMagList() {
			let maglist = $("#mag_fetch_id");
			maglist.empty();
			maglist.append($("<option/>").val("").text("Select Mag"));
			$.get("/admin_cmds.php?cmd=get_mag", function (data) {
				$.each(data, function (i, mag) {
					maglist.append($("<option/>").val(mag.id).text(mag.name));
				});
			});
		}

		function delMag() {
			const activeName = $("#mag_name").val();
			if (activeName !== "") {
				if (confirm(`Are you sure you want to delete ${activeName}?`)) {
					const form = $("#del_mag_form");
					$("#del_mag_id").val($("#mag_id").val());
					const url = form.attr("action");
					$.ajax({
						"type": "POST",
						"url": url,
						"data": form.serialize(),
						"success": () => {
							showMagAlert("Mag Deleted!", true);
							magclear();
							getMagList();
						}
					});
				}
			}
		}
	<?php } ?>
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
		alertContent = `<div id="#success-alert" class="bs-component quick-alert animate__animated animate__bounceIn alert alert-success">${content}</div>`;
    } else {
		alertContent = `<div id="#failure-alert" class="bs-component quick-alert animate__animated animate__shakeX alert alert-warning">${content}</div>`;
    }
		$("#ascii_mag").prepend(alertContent).children().first().delay(2000).slideUp();
	}
</script>
<div class="tab-pane fade ap-1" id="ascii_mag">

	<?php if ($admin_edit && is_admin()) { ?>
		<form id="del_mag_form" action="/admin_cmds.php?cmd=del_mag" method="post">
			<input type="hidden" name="id" id="del_mag_id">
		</form>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<select class="select2" name="mag_id" id="mag_fetch_id" class="w-100" onchange="getMag();">
				</select>
			</div>
		</div>
		<form id="mag_form" action="/admin_cmds.php?cmd=save_mag" method="post">
		<?php } else { ?>
	<form id="mag_form" action="/cmds.php?cmd=save_mag" method="post"> 
  			<?php } ?>
			<input type="hidden" name="id" id="mag_id">

  
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

    <div class="row apb-1">
      <div class="col-xs-12 col-md-6 apb-1">
        <label for="mag_year" class="lightgrey">Release Date</label>
        <div class="row apt-1">
          <div class="col-4">
            <select class="select2" name="year" id="mag_year">
              <option value="0">Unknown</option>
              <?php for ($i=date('Y'); $i>=1986; $i--) { ?>
                <option <?php if ($i==date('Y')) { ?> selected="selected" <?php } ?> value="<?=$i?>"><?=$i?></option>
              <?php } ?>
            </select>
          </div>
          <div class="col-4">
            <select class="select2" name="month" id="mag_month">
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
            <select class="select2" name="day" id="mag_day">
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
						<label for="mag_file" class="lightgrey w-100 apt-1">File</label>
					</div>
				</div>

				<div class="row apb-1 col-xs-12 col-md-6">
					<input class="w-100" type="text" id="mag_file" name="file">
				</div>
			<?php } else { ?>        
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
    			<?php } ?>  
		<div class="row apt-1">
			<div class="col-12">
				<input type="button" class="btn-big w-100 white bg-green col-xs-12 col-md-2 amb-1" value="Save" onclick="savemag()">
        <?php if ($admin_edit && is_admin()) { ?>
          <input type="button" class="btn-big w-100 bg-red white w-100 col-xs-12 col-md-2 amb-1" value="Delete" onclick="delMag()">
        <?php } ?>
			</div>
		</div>
	</form>
</div>

		<?php if ($admin_edit && is_admin()) { ?>
			<script>
				$(function () {
					getMagList();
				});
			</script>
		<?php } ?>
