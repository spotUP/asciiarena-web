<?php
//--------------------------------------------------------------------------------
// EDIT USER FIELD
//--------------------------------------------------------------------------------
?>
<script>
  function userclear() {
    $("#user_id, #user_nick, #user_crew, #user_rank, #user_byear, #user_bmonth, #user_bday, #user_country, #user_mail").val('');
  }
  
	function getUser() {
		const id = $("#user_fetch_id").val();
		if (id > 0) {
			$.get(`/admin_cmds.php?cmd=get_user&id=${id}`, function (data) {
				$('#user_id').val(data[0].id);
				$('#user_nick').val(data[0].nick);
				$('#user_crew').val(data[0].crew);
				$('#user_rank').val(data[0].rank);
				$('#user_byear').val(data[0].byear);
				$('#user_bmonth').val(data[0].bmonth);
				$('#user_bday').val(data[0].bday);
				$('#user_country').val(data[0].country);
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
						showAlert("User deleted!", "#user");
            userclear();
						getUserList();
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

<div class="tab-pane fade ap-1" id="edituser">
	<form id="del_user_form" action="/admin_cmds.php?cmd=del_user" method="post">
		<input type="hidden" name="id" id="del_user_id">
	</form>
	<div class="row apb-1">
		<div class="col-12">
			<form>
				<select name="user_id" id="user_fetch_id" class="w-100" onchange="getUser();">
				</select>
			</form>
		</div>
	</div>
	<form id="user_form" action="/admin_cmds.php?cmd=save_user" method="post">
		<input type="hidden" name="id" id="user_id">
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="user_nick" class="lightgrey">Nick</label>
				<input type="text" size="24" id="user_nick" name="nick">
			</div>
		</div>
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="user_crew" class="lightgrey">Crew</label>
				<input type="text" size="24" id="user_crew" name="crew">
			</div>
		</div>
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="uesr_rank" class="lightgrey">Rank</label>
        <select name="rank" id="user_rank">
          <option value="User">User</option>
					<option value="Elite">Elite</option>
					<option value="Admin">Admin</option>
				</select>
			</div>
		</div>
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="user_birth_year" class="lightgrey">Birth</label>
        <select name="byear" id="user_byear">
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
        <select name="bmonth" id="user_bmonth">
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
        <select name="bday" id="user_bday">
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
    <div class="row apb-1">
			<div class="col-6 d-flex justify-content-between">
				<label for="user_country" class="lightgrey">Country</label>
        <select name="country" id="user_country">
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
			<div class="col-6 d-flex justify-content-between">
				<label for="user_mail" class="lightgrey">Mail</label>
				<input type="text" size="24" id="user_mail" name="mail">
			</div>
		</div>    
    <div class="row apt-1">
			<div class="col-12">
				<input type="submit" name="do_edit_user" value="Save">
				<input type="button" id="delete_user" name="delete_user" value="Delete" onclick="delUser();">
			</div>
		</div>
	</form>
</div>
<script>
	$(function () {
    getUserList();
		$("#user_form").submit(function (e) {
			e.preventDefault();
      const form = $(this);
      const url = form.attr("action");
      $.ajax({
        "type": "POST",
        "url": url,
        "data": form.serialize(),
        "success": () => {
          showAlert("User saved!", "#edituser");
          userclear();
          getUserList();
        }
      });
		});
	});
</script>
