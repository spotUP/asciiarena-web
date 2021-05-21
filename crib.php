<?php
require_once "session.php";
$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
include "header.php";
?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
		<?php if (is_logged_in()) { ?>
    <div id="alerts"></div>
			<form autocomplete="off" enctype="multipart/form-data" action="/crib.php" method="post">
				<div class="row amb-1">
					<div class="col-12">
						<span class="white">User Settings</span>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">
						Nick: 
					</div>
					<div class="col-3">
						<input type="text" class="w-100" maxlength="14" id="nick" value="">
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">
						Crew: 
					</div>
					<div class="col-3">
						<input type="text" class="w-100" id="crew" value=""> 
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">			
						Birth:
					</div>
					<div class="col-3">
						<select id="byear" class="select2">
							<?php for ($i=1920; $i<(date('Y')-5); $i++) { ?>
								<option value="<?=$i?>"><?=$i?></option>
							<?php } ?>
						</select>
						<select id="bmonth" class="select2">
							<?php for ($i=1; $i<=12; $i++) { ?>
								<option value="<?=$i?>"><?=$i?></option>
							<?php } ?>
						</select>
						<select id="bday" class="select2">
							<?php for ($i=1; $i<=31; $i++) { ?>
								<option value="<?=$i?>"><?=$i?></option>
							<?php } ?>
						</select>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">
						Country:
					</div>
					<div class="col-3">
						<select class="select2" id="country"> 
							<?php foreach($country_list as $symbol => $scountry) { ?>
								<option value="<?=$symbol?>"><?=$country_list[$symbol]?></option>
							<?php } ?>
						</select>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">		
						Mail:
					</div>
					<div class="col-3">		
						<input id="mail" type="text" class="w-100" value="">
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">		
						Show E-Mail:
					</div>
          			<div class="col-3">
						<div class="form-group">
							<div class="custom-control custom-switch">
								<input type="checkbox" class="custom-control-input" id="display_mail"value="1">
								<label class="custom-control-label" for="display_mail"></label>
							</div>
						</div>
					</div>          
				</div>
				<div class="row amb-1">
					<div class="col-12 apt-1">
						<span class="white">Password Settings</span>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">	
						Old password
					</div>
					<div class="col-3">	
						<input type="password" class="w-100" autocomplete="off" id="old_password">
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">						
						New password
					</div>
					<div class="col-3">						
						<input type="password"  class="w-100" autocomplete="off" id="password">
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">						
						New password again
					</div>
					<div class="col-3">						
						<input type="password" class="w-100" autocomplete="off" id="repeat_password">
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-12 apt-1">
						<span class="white">Site Settings</span>
					</div>
				</div>

				<div class="row amb-1">
					<div class="col-3">		
						File list mode:
					</div>
					<div class="col-3">	
						<select class="select2" id="viewmode">
							<option value="Standard">Standard</option>
							<option value="BBS" >BBS</option>
						</select>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">	
						Default Colly BG:
					</div>
					<div class="col-3">	
						<select class="custom-select" id="def_bg_col">
              <option id="sel_bg_col" value="" data-color="">Custom</option>
							<option value='#555555' data-color="#555555">Bright Black</option>
							<option value='#5555ff' data-color="#5555ff">Bright Blue</option>
							<option value='#ff55ff' data-color="#ff55ff">Bright Magenta</option>
							<option value='#ff5555' data-color="#ff5555">Bright Red</option>
							<option value='#ffff55' data-color="#ffff55">Brigt Yellow</option>
							<option value='#55ff55' data-color="#55ff55">Bright Green</option>
							<option value='#55FFFF' data-color="#55FFFF">Bright Cyan</option>
							<option value='#ffffff' data-color="#ffffff">White</option>
							<option value='#000000' data-color="#000000">Black</option>
							<option value='#0000aa' data-color="#0000aa">Blue</option>
							<option value='#aa00aa' data-color="#aa00aa">Magenta</option>
							<option value='#aa0000' data-color="#aa0000">Red</option>
							<option value='#aa5500' data-color="#aa5500">Yellow</option>
							<option value='#00aa00' data-color="#00aa00">Green</option>
							<option value='#00aaaa' data-color="#00aaaa">Cyan</option>
							<option value='#aaaaaa' data-color="#aaaaaa">Grey</option>
						</select>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">	
						Default Colly FG:
					</div>
					<div class="col-3">	
						<select class="custom-select" id="def_fg_col">
              <option id="sel_bg_col" value="" data-color="">Custom</option>
							<option value='#555555' data-color="#555555">Bright Black</option>
							<option value='#5555ff' data-color="#5555ff">Bright Blue</option>
							<option value='#ff55ff' data-color="#ff55ff">Bright Magenta</option>
							<option value='#ff5555' data-color="#ff5555">Bright Red</option>
							<option value='#ffff55' data-color="#ffff55">Brigt Yellow</option>
							<option value='#55ff55' data-color="#55ff55">Bright Green</option>
							<option value='#55FFFF' data-color="#55FFFF">Bright Cyan</option>
							<option value='#ffffff' data-color="#ffffff">White</option>
							<option value='#000000' data-color="#000000">Black</option>
							<option value='#0000aa' data-color="#0000aa">Blue</option>
							<option value='#aa00aa' data-color="#aa00aa">Magenta</option>
							<option value='#aa0000' data-color="#aa0000">Red</option>
							<option value='#aa5500' data-color="#aa5500">Yellow</option>
							<option value='#00aa00' data-color="#00aa00">Green</option>
							<option value='#00aaaa' data-color="#00aaaa">Cyan</option>
							<option value='#aaaaaa' data-color="#aaaaaa">Grey</option>
						</select>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">	
						Default Colly Font:
					</div>
					<div class="col-3">	
						<select class="select2" id='def_font'>
							<option value="mosoul">mosoul</option>
							<option value="topaz" >topaz</option>
							<option value="microknight" >microknight</option>
							<option value="pot-noodle" >pot-noodle</option>
						</select>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">
						CRT screen effect:
					</div>
					<div class="col-3">
						<div class="form-group">
							<div class="custom-control custom-switch">
								<input type="checkbox" class="custom-control-input" id="crt_effect" name="crt_effect" value="1">
								<label class="custom-control-label" for="crt_effect"></label>
							</div>
						</div>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-3">
						Modem animation effect:
					</div>
					<div class="col-3">
						<div class="form-group">
							<div class="custom-control custom-switch">
								<input type="checkbox" class="custom-control-input" id="anim_effect" name="anim_effect" value="1">
								<label class="custom-control-label" for="anim_effect"></label>
							</div>
						</div>
					</div>
				</div>
				<div class="row amb-1 apt-1">
					<div class="col-12">		
						<span class="white">Upload Signature:</span>
					</div>
				</div>
				<div class="row amb-1">
					<div class="col-6">		
						<input type="text" class="w-100" size="44" maxlength="44" id="upload_signature" value="">
					</div>							
				</div>
				<div class="row amb-1">
					<div class="col-12 apt-1">	
						<input type="button" id="btnSave" class="btn-big" onclick="saveSettings()" value="Save" name="Save">
					</div>
				</div>
			</form>	
		<?php } // is_logged_in() ?>
	</div>

	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>
</div>

  <script>
    function saveSettings() {
      let oldpass = $("#old_password").val();
      let newpass1 = $("#password").val();
      let newpass2 = $("#repeat_password").val();
      
      if ((oldpass.length>0) && (newpass1.length==0)) {
        showAlert("You have not specified a new password!", false);
        return;
      }
      
      if (((newpass1.length+newpass2.length)>0) && newpass1!=newpass2) {
        showAlert("New passwords do not match!", false);
        return;
      }

      if ((oldpass.length==0) && ((newpass1.length+newpass2.length)>0)) {
        showAlert("You must enter your old password if you wish to change it!", false);
        return;
      }

      if (newpass1.length>0) {
        if (!newpass1.match(/[A-Z]/) || !newpass1.match(/[a-z]/) || !newpass1.match(/[0-9]/) || !newpass1.match(/[^\w]/)) {
          showAlert('password should include at least one upper case letter, one lower caser letter, one number and one special character', false);
          return;
        }
      }
      
      $.ajax({
        "type": "POST",
        "url": "/cmds.php/save_settings",
        "data": {
          "nick": $("#nick").val(),
          "crew": $("#crew").val(),
          "byear": $("#byear").val(),
          "bmonth": $("#bmonth").val(),
          "bday": $("#bday").val(),
          "country": $("#country").val(),
          "mail": $("#mail").val(),
          "upload_signature": $("#upload_signature").val(),
          "viewmode": $("#viewmode").val(),
          "def_bg_col": $("#def_bg_col").val(),
          "def_fg_col": $("#def_fg_col").val(),
          "display_mail": $("#display_mail").is(':checked') ? "Yes": "No",
          "def_font": $("#def_font").val(),
          "crt_effect": $("#crt_effect").is(':checked') ? "Y": "N",
          "anim_effect": $("#anim_effect").is(':checked') ? "Y": "N",
          "oldpass": oldpass,
          "newpass": newpass1
        },
        "success": () => {
          showAlert("Settings saved sucessfully!", true);
        },
        "error": (r) => {
          if (r && r.responseJSON && r.responseJSON.error) {
            showAlert(r.responseJSON.error+', settings not saved', false);
          } else {
          showAlert("An error occured saving the settings!", false);
          }
        }
      });
            
    }
    function getSettings() {
      $.get("/cmds.php/get_settings", function (settings) {
       
        $("#nick").val(settings.nick);
        $("#crew").val(settings.crew);
        $("#byear").val(settings.byear).trigger('change');
        $("#bmonth").val(settings.bmonth).trigger('change');
        $("#bday").val(settings.bday).trigger('change');
        $("#country").val(settings.country).trigger('change');
        $("#mail").val(settings.mail);
        $("#upload_signature").val(settings.upload_signature);
        $("#viewmode").val(settings.viewmode).trigger('change');
        $("#sel_bg_col").val(settings.def_bg_col);
        $("#sel_bg_col").attr("data-color",settings.def_bg_col);
        $("#sel_fg_col").val(settings.def_fg_col);
        $("#sel_fg_col").attr("data-color",settings.def_fg_col);       
        $('#def_fg_col').colorselector();
        $('#def_bg_col').colorselector();
        $("#def_bg_col").colorselector("setColor", settings.def_bg_col);
        $("#def_fg_col").colorselector("setColor", settings.def_fg_col);
        
        $("#display_mail").prop('checked', settings.display_mail=="Yes");
        $("#def_font").val(settings.def_font).trigger('change');
        $("#crt_effect").prop('checked', settings.crt_effect=="Y");
        $("#anim_effect").prop('checked', settings.anim_effect=="Y");
        $("#btnSave").removeAttr("disabled");
      }).fail(function() {
        showAlert('An error occured loading your settings!');
        $("#btnSave").attr("disabled", true);
      });
    }
  
    function showAlert(content,success) {
      if (success) {
        alertContent = `<div id="#success-alert" class="bs-component quick-alert amb-1 animate__animated animate__shakeX alert alert-dismissible alert-success"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
      } else {
        alertContent = `<div id="#failure-alert" class="bs-component quick-alert amb-1 animate__animated animate__shakeX alert alert-dismissible alert-warning"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
      }
      $("#alerts").prepend(alertContent);
       $(window).scrollTop(0);
    }

    $(function() {
      window.prettyPrint && prettyPrint();
      $("#btnSave").attr("disabled", true);
      getSettings();
    });
  </script>

<?php include "footer.php"; ?>
