<?php
	// --------------------------------------------------------------------------------
	// EDIT BBS FIELD
	// --------------------------------------------------------------------------------
?>
<script>
  function bbsclear() {
    $("#bbs_id, #bbs_name, #bbs_sysop, #bbs_number, #bbs_address, #bbs_country").val('').trigger('change');
    $("#bbs_online").prop( "checked", false );
  }

  <?php if ($admin_edit && is_admin()) { ?> 
	function getBBS() {
		const id = $("#bbs_fetch_id").val();
		if (id > 0) {
			$.get(`/admin_cmds.php?cmd=get_bbs&id=${id}`, function (data) {
        bbsclear();
				$('#bbs_id').val(data[0].id);
				$('#bbs_name').val(data[0].name);
				$('#bbs_sysop').val(data[0].sysop);
				$('#bbs_address').val(data[0].address);
        $('#bbs_country').val(data[0].country).trigger('change');;
        if (data[0].online) {
          $('#bbs_online').prop( "checked", true );
        } else {
          $('#bbs_online').prop( "checked", false );
        }
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
          "error": (r) => {
            showBBSAlert("There was an error during saving!",false);
          },      
					"success": () => {
						showBBSAlert("BBS Deleted!", true);
						bbsclear();
						getBBSList();
					}
				});
			}
		}
	}
  <?php } ?>

  function saveBBS() {
    if ($("#bbs_name").val().trim().length==0) {
      showBBSAlert("You must fill the name field!", false);
      return
    }
    
    const form = $("#bbs_form");
    const url = form.attr("action");
    $.ajax({
      "type": "POST",
      "url": url,
      "data": form.serialize(),
      "error": (r) => {
        if (r.status==409) {
          showBBSAlert("The bbs already exists!",false);
        } else {
          showBBSAlert("There was an error during saving!",false);
        }
      },            
      "success": () => {
        showBBSAlert("BBS Saved!", true);
        bbsclear();
        <?php if ($admin_edit && is_admin()) { ?>
        getBBSList();
        <?php } ?>
        
      }
    });
  }

	function showBBSAlert(content, success) {
    if (success) {
		alertContent = `<div id="#success-alert" class="bs-component quick-alert animate__animated animate__bounceIn alert alert-success">${content}</div>`;
    } else {
		alertContent = `<div id="#failure-alert" class="bs-component quick-alert animate__animated animate__shakeX alert alert-warning">${content}</div>`;
    }
		$("#bbs").prepend(alertContent).children().first().delay(2000).slideUp();
	}
</script>
<div class="tab-pane fade ap-1" id="bbs">
  <?php if ($admin_edit && is_admin()) { ?>
	<form id="del_bbs_form" action="/admin_cmds.php?cmd=del_bbs" method="post">
		<input type="hidden" name="id" id="del_bbs_id">
	</form>
	<div class="row  apb-1">
		<div class="col-xs-12 col-md-6">
			<form>
				<select class="select2" name="bbs_id" id="bbs_fetch_id" class="w-100" onchange="getBBS();">
				</select>
			</form>
		</div>
	</div>
	<form id="bbs_form" action="/admin_cmds.php?cmd=save_bbs" method="post">
  <?php } else { ?>
	<form id="bbs_form" action="/cmds.php?cmd=save_bbs" method="post">
  <?php } ?>
  
		<input type="hidden" name="id" id="bbs_id">
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apt-1">
				<label for="bbs_name" class="lightgrey">Name (required)</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<input type="text" class="w-100" id="bbs_name" name="name">
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<label for="bbs_sysop" class="lightgrey">Sysop</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<input type="text" class="w-100" id="bbs_sysop" name="sysop">
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<label for="bbs_address" class="lightgrey">Address</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<input type="text" class="w-100" id="bbs_address" name="address"/>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<label for="bbs_number" class="lightgrey">Phone Number</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<input type="text" class="w-100" id="bbs_number" name="number"/>
			</div>
		</div>

		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<label for="bbs_country" class="lightgrey">Country</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
					<select class="select2 w-100" name="country" id="bbs_country">
						<?php
						foreach($country_list as $symbol => $country)
						{
							?>
							<option value="<?=$country?>"><?=$country?></option>
							<?php
						}
						?>
					</select>
			</div>
    </div>

		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<div class="custom-control custom-switch">Online
								<input type="checkbox" class="custom-control-input" name="online" id="bbs_online">
								<label class="custom-control-label" for="bbs_online"></label>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col-12">
				<input type="button" class="btn-big bg-green white w-100 col-xs-12 col-md-2 amb-1" value="Save" onclick="saveBBS()">
        <?php if ($admin_edit && is_admin()) { ?>
				<input type="button" class="btn-big bg-red white w-100 col-xs-12 col-md-2 amb-1" value="Delete" onclick="delBBS()">
        <?php } ?>
			</div>
		</div>
	</form>
</div>
<?php if ($admin_edit && is_admin()) { ?>
<script>
	$(function () {
    getBBSList();
	});
</script>
<?php } ?>
