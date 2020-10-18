<?php defined('VALID') or die('Nuh-uh!'); ?>
</div>
<!-- Modal -->
<div class="modal" id="login" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
	<div class="modal-dialog" role="document">
		<div class="modal-content">
			<div class="modal-header ap-1" style="background-color: #444444;">
				<span class="modal-title" id="exampleModalLabel">LOGiN</span>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
			<div class="modal-body bg-primary">
				<?php
					if (!is_logged_in())
					{
				?>
				<form action="/cmds.php?cmd=login" method="post">
					<?php
						if (isset($_GET[ 'inactive' ])) {
							?>
							yOUR aCCOUNT iS nOT aCTiVE!
							rEAD tHE aCTiVATiON mAiL fOR iNSTRUCTiONS.
							<?php
						}
						if (isset($_GET[ 'activated' ])) {
							?>
							yOUR aCCOUNT iS aCTiVATED, pLEASE lOGiN!
							aCCOUNT nAME:
							yOUR pASSWORD:
							<input type="text" name="nick" id="nick" size="30">
							<input type="password" name="password" size="30">
							<a href=register.php>Register</a> new account!
							<a href="reminder.php">Help!</a> I forgot my password!
							<input type="submit" class="buttonSubmit" value="Log in!">
							<?php
						}
						if (!isset($_GET[ 'activated' ]) && (!isset($_GET[ 'inactive' ]))) {
							if (isset($bad_password)) {
								echo $bad_password;
							}
							if (isset($bad_user)) {
								echo $bad_user;
							}
							?>
							<div class="container-fluid">
								<div class="row">

									<div class="col-6">
										<div class="form-group">
											<input type="text" class="form-control" name="nick" id="nick" autocomplete="username" placeholder="Enter your handle"
											       aria-describedby="nickHelp">
										</div>
										<div class="form-group"><input type="password" name="password" class="form-control"
										                               autocomplete="current-password"
										                               placeholder="Proove it"></div>
									</div>

									<div class="col-6">
										<div class="form-group">
											<div class="custom-control custom-switch">
												<input type="checkbox" class="custom-control-input" id="customSwitch1" name="rememberme"
												       value="1" checked>
												<label class="custom-control-label" for="customSwitch1"><span
															style="margin-left: -8px !important;">Remember me<span></label>
											</div>
										</div>
										<a href=register.php>Register</a> <span style="color: #999999;">new account!</span><br><br>
										<a href="reminder.php">Help!</a> <span style="color: #999999;">I forgot my password!</span><br><br>
									</div>
								</div>
							</div>
							<?php
						}
					?>
					<script type="text/javascript">
						$('#login').on('shown.bs.modal', function () {
							$('#nick').focus();
						})
					</script>
					<?php
						}
					?>
			</div>
			<div class="modal-footer bg-primary">
				<button type="button" class="btn-secondary bg-grey" data-dismiss="modal">CLOSE</button>
				<button type="submit" class="btn-primary bg-lightgrey">LOG IN</button>
			</div>
			</form>
		</div>
	</div>
</div>

<div class="navbar navbar-expand-lg fixed-bottom navbar-dark bg-primary d-flex justify-content-between"
     style="height: 22px;">
	<span style="margin-left: 200px;" class="red">NComm 2.0</span> <span class="green">aSCIIaRENA</span> <span
			style="margin-right: 200px" class="green"><?php echo Date("H:i", time()), " 00:00"; ?></span>
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
<script src="/assets/js/ansiup/ansi_up.js" type="text/javascript"></script>
<script type="text/javascript">
	/*
		var ansi_up = new AnsiUp;

		var txt = "\n\n\033[1;33;40m 33;40  \033[1;33;41m 33;41  \033[1;33;42m 33;42  \033[1;33;43m 33;43  \033[1;33;44m 33;44  \033[1;33;45m 33;45  \033[1;33;46m 33;46  \033[1m\033[0\n\n\033[1;33;42m >> Tests OK\n\n"

		var html = ansi_up.ansi_to_html(txt);

		var cdiv = document.getElementById("console");

		cdiv.innerHTML = html;
	*/
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
</body>
</html>
