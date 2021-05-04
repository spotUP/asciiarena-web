<div class="tab-pane fade" id="app">
	<form enctype="multipart/form-data" action="submit.php" method="post">
		<div class="container-fluid bg-secondary ap-1">
			<div class="row apl-1 apt-1">
				App Name (required)
			</div>
			<div class="row apl-1 apb-1">
				<input type="text" size="24" name="name" autocomplete="off">
			</div>

			<div class="row apl-1">
				App Author
			</div>

			<div class="row apl-1 apb-1">
				<input type="text" name="app_author" autocomplete="off">
			</div>

			<div class="row apl-1">
				File (required)
			</div>

			<div class="row apl-1 apb-1">
				<input name="uploaded_app" type="file">
				<input type="hidden" name="max_file_size" value="10240000">
				<input type="hidden" name="type" value="APP">
			</div>
			<div class="row apl-1">
				<input type="SUBMIT" value="Upload">
			</div>
		</div>
	</form>
</div>