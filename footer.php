<?php defined('VALID') or die('Nuh-uh!'); ?>
</div>

<div class="mx-auto navbar navbar-expand-lg fixed-bottom navbar-dark bg-primary d-flex justify-content-lg-around" style="height: 22px;">
	<span cass="red ml-xl-2">NComm 2.0</span>
	<span class="green">aSCIIaRENA</span>
	<span class="green mr-xl-2"><?php echo Date("H:i", time()), " 00:00"; ?></span>
</div>

<script>
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === 'visible') {
			window.switchers.forEach((s, idx) => {
				const elements = $(s[1]).length;
				let start = 1;
				if (elements === 2 && s[0] !== 1) {
					start = 2;
				} else if (elements !== s[0]) {
					start = s[0] + 1;
				}
				switcharoo(s[1], s[2], idx, start);
			});
		} else {
			window.switchers.forEach(s => {
				clearInterval(s[3]);
			});
		}
	});
</script>

<script type="text/javascript">
	$(document).ready(function () {
		$(document).keydown(function(e){
			
			if(e.keyCode == 27) {
				if ($('#colly').hasClass('fullscreen')) 
				{
					$('#colly').removeClass('fullscreen');
				} 
				else 
				{
					$('#colly').addClass('fullscreen');
				}
				if ($('#blacker').hasClass('show')) 
				{
					$('#blacker').removeClass('show');
				} 
				else 
				{
					$('#blacker').addClass('show');
				}
				if ($('#spotclose').hasClass('show')) 
				{
					$('#spotclose').removeClass('show');
				} 
				else 
				{
					$('#spotclose').addClass('show');
				}
			}
		});
	})
</script>

<script>
	$('.select2').select2();
</script>

<?php
if (DEBUG) {
	echo "<pre>";
	print_r($_user);
	$stats = fetchAll("SHOW profiles");
	print_r($stats);
	print_r($_queries);
	print_r($_SERVER);
	echo "</pre>";
}
?>

<div class="modal" id="login" tabindex="-1" role="dialog" aria-hidden="true" aria-labelledby="">
	<div class="modal-dialog animate__animated animate__backInLeft" role="document">
		<div class="modal-content">
			<div class="modal-header ap-1" style="background-color: #444444;">
				<span class="modal-title" id="">LOGiN</span>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
			</div>
			<div class="modal-body bg-primary">
			<?php if (!is_logged_in()) { ?>
				<form action="/cmds.php?cmd=login" method="post" id="login-form">
					<div class="container-fluid">
						<div class="row">
							<div class="col-12 col-sm-6">
								<div class="form-group">
									<input type="text" class="form-control" name="nick" id="nick" autocomplete="username" placeholder="Enter your handle" aria-describedby="nickHelp">
								</div>
								<div class="form-group">
									<input type="password" name="password" id="password" class="form-control" autocomplete="current-password" placeholder="Proove it">
								</div>
							</div>
							<div class="col-12 col-sm-6">
								<div class="form-group">
									<div class="custom-control custom-switch">
										<input type="checkbox" class="custom-control-input" id="customSwitch1" name="rememberme" value="1" checked>
										<label class="custom-control-label" for="customSwitch1"><span style="margin-left: -8px !important;">Remember me<span></label>
									</div>
								</div>
								<a href=register.php>Register</a> <span style="color: #999999;">new account!</span><br><br>
								<a href="reminder.php">Help!</a> <span style="color: #999999;">forgot your password?</span><br><br>
							</div>
						</div>
					</div>
					<script type="text/javascript">
						$('#login').on('shown.bs.modal', function () {
							$('#nick').focus();
						})
						$("input#nick").keyup(function(e) {
							if (e.which == 13) loginUser();
						});
						$("input#password").keyup(function(e) {
							if (e.which == 13) loginUser();
						});
						function loginUser() {
							const form = $("#login-form");
							const url = form.attr("action");
							$.ajax({
								"type": "POST",
								"url": url,
								"data": form.serialize(),
								"success": (data) => {
									if (data != null) $("#login-results").html(data);
								}

							});
						}
					</script>
				</form>
				<div id="login-results"></div>
			<?php } else { ?>
			<span>You're already logged in</span>
			<?php } ?>
			</div> <!-- modal-body -->
			<div class="modal-footer bg-primary">
				<button type="button" class="btn-secondary bg-grey" data-dismiss="modal">CLOSE</button>
				<button type="button" class="btn-primary white bg-lightgrey" onclick="loginUser()">LOG IN</button>
			</div>
		</div>
	</div>
</div> <!-- login modal -->

</body>
</html>
