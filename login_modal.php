<div class="modal" id="login" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
	<div class="modal-dialog animate__animated animate__backInLeft" role="document">
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
											<input type="text" class="form-control" name="nick" id="nick" autocomplete="username" placeholder="Enter your handle" aria-describedby="nickHelp">
										</div>
										<div class="form-group"><input type="password" name="password" class="form-control" autocomplete="current-password" placeholder="Proove it"></div>
									</div>
									<div class="col-6">
										<div class="form-group">
											<div class="custom-control custom-switch">
												<input type="checkbox" class="custom-control-input" id="customSwitch1" name="rememberme" value="1" checked>
												<label class="custom-control-label" for="customSwitch1"><span style="margin-left: -8px !important;">Remember me<span></label>
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
