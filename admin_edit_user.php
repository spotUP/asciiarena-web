<?php
//--------------------------------------------------------------------------------
// EDIT USER FIELD
//--------------------------------------------------------------------------------
?>
<script>
	function userclear() {
		$("#user_id, #user_nick, #user_crew, #user_rank, #user_byear, #user_bmonth, #user_bday, #user_country, #user_mail").val('').trigger('change');
	}
	
	function getUser() {
		const id = $("#user_fetch_id").val();
		if (id > 0) {
			$.get(`/admin_cmds.php?cmd=get_user&id=${id}`, function (data) {
				userclear();
				$('#user_id').val(data[0].id);
				$('#user_nick').val(data[0].nick);
				$('#user_crew').val(data[0].crew);
				$('#user_rank').val(data[0].rank).trigger('change');
				$('#user_byear').val(data[0].byear).trigger('change');
				$('#user_bmonth').val(data[0].bmonth).trigger('change');
				$('#user_bday').val(data[0].bday).trigger('change');
				$('#user_country').val(data[0].country).trigger('change');
				$('#user_mail').val(data[0].mail);
			});
		} else {
			userclear();
		}
	}

	function getUserList() {
		let userlist = $("#user_fetch_id");
		userlist.empty();
		userlist.append($("<option/>").val("").text("Select User"));
		$.get("/admin_cmds.php?cmd=get_user", function (data) {
			$.each(data, function (i, user) {
				userlist.append($("<option/>").val(user.id).text(user.nick));
			});
		});
	}

	function saveUser() {
		if ($("#user_nick").val().trim().length==0) {
			showUserAlert("You must fill the user nick field!", false);
			return;
		}

		const form = $("#user_form");
		const url = form.attr("action");
		$.ajax({
			"type": "POST",
			"url": url,
			"data": form.serialize(),
			"error": (r) => {
				if (r.status==409) {
					showUserAlert("The user already exists!",false);
				} else {
					showUserAlert("There was an error during saving!",false);
				}
			},      
			"success": () => {
				showUserAlert("User Saved!", true);
				userclear();
				getUserList();
			}
		});
	}

	function delUser() {
		const activeName = $("#user_nick").val();
		if (activeName !== "") {
			if (confirm(`Are you sure you want to delete ${activeName}?`)) {
				const form = $("#del_user_form");
				$("#del_user_id").val($("#user_id").val());
				const url = form.attr("action");
				$.ajax({
					"type": "POST",
					"url": url,
					"data": form.serialize(),
					"success": () => {
						showUserAlert("User Deleted!", true);
						userclear();
						getUserList();
					}
				});
			}
		}
	}

	function showUserAlert(content, success) {
		if (success) {
			alertContent = `<div id="#success-alert" class="bs-component quick-alert animate__animated animate__bounceIn alert alert-success">${content}</div>`;
		} else {
			alertContent = `<div id="#failure-alert" class="bs-component quick-alert animate__animated animate__shakeX alert alert-warning">${content}</div>`;
		}
		$("#edituser").prepend(alertContent).children().first().delay(2000).slideUp();
	}
</script>

<div class="tab-pane fade ap-1" id="edituser">
	<form id="del_user_form" action="/admin_cmds.php?cmd=del_user" method="post">
		<input type="hidden" name="id" id="del_user_id">
	</form>
	<div class="row apb-1">
		<div class="col-xs-12 col-md-6">
			<form>
				<select class="select2" name="user_id" id="user_fetch_id" class="w-100" onchange="getUser();">
				</select>
			</form>
		</div>
	</div>
	<form id="user_form" action="/admin_cmds.php?cmd=save_user" method="post">
		<input type="hidden" name="id" id="user_id">
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<label for="user_nick" class="lightgrey apt-1">Nick (required)</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<input type="text" class="w-100" id="user_nick" name="nick">
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<label for="user_crew" class="lightgrey apt-1">Crew</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<input type="text" class="w-100" id="user_crew" name="crew">
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<label for="user_rank" class="lightgrey apb-1 apt-1">Rank</label>
				<div>
					<select class="select2" name="rank" id="user_rank">
						<option value="User">User</option>
						<option value="Elite">Elite</option>
						<option value="Admin">Admin</option>
					</select>
				</div>
			</div>
		</div>
		<div class="row apl-0">
			<div class="col-xs-12 col-md-6 p-0">
				<label for="user_birth_year" class="lightgrey apb-1 col-12 apt-1">Birth</label>
			</div>
		</div>
		<div class="col-xs-12 col-md-6">
			<div class="row p-0">
				<div class="col-4 pl-0">
					<select class="select2 w-100" name="byear" id="user_byear">
						<?php
						$countyear=1900;
						$maxyear=date("Y")-5;
						while($countyear<$maxyear)
						{
							?>
							<option><?=$countyear?></option>
							<?php
							$countyear++;
						}
						?>
					</select>
				</div>
				<div class="col-4">
					<select class="select2 w-100" name="bmonth" id="user_bmonth">
						<?php
						$countmonth=1;
						$maxmonth=12;
						while($countmonth<=$maxmonth)
						{
							?>
							<option><?=$countmonth?></option>
							<?php
							$countmonth++;
						}
						?>
					</select>
				</div>
				<div class="col-4">
					<select class="select2 w-100" name="bday" id="user_bday">
						<?php
						$countday=1;
						$maxday=31;
						while($countday<=$maxday)
						{
							?>
							<option><?=$countday?></option>
							<?php
							$countday++;
						}
						?>
					</select>
				</div>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apt-1">
				<label for="user_country" class="lightgrey apb-1">Country</label>
				<select class="select2" name="country" id="user_country">
					<?php
					foreach($country_list as $symbol => $country)
					{
						?>
						<option value="<?=$symbol?>"><?=$country?></option>
						<?php
					}
					?>
				</select>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<label for="user_mail" class="lightgrey apt-1">Mail</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<input type="text" class="w-100" id="user_mail" name="mail">
			</div>
		</div>    
		<div class="row apt-1">
			<div class="col-12">
				<input type="button" class="btn-big bg-green white w-100 col-2" value="Save" onclick="saveUser()">
				<input type="button" class="btn-big bg-red white w-100 col-2" value="Delete" onclick="delUser()">
			</div>
		</div>
	</form>
</div>
<script>
	$(function () {
		getUserList();
	});
</script>
