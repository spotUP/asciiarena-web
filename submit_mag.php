<div class="tab-pane fade" id="ascii_mag">
	<form enctype="multipart/form-data" action="submit.php" method="post">
		<div class="container-fluid bg-secondary ap-1">
			<div class="row apl-1 apt-1">
				Mag Name (required)
			</div>
			<div class="row apl-1">
				<input type="text" size="24" name="name">
			</div>

			<div class="row apl-1 apt-1">
				Mag Author
			</div>

			<div class="row apl-1">
				<input type="text" name="mag_author">
			</div>

			<div class="row apl-1 apt-1">
				File (required)
			</div>

			<div class="row apl-1">
				<input name="uploaded_mag" type="file">
				<input type="hidden" name="max_file_size" value="10240000">
				<input type="hidden" name="type" value="MAG">
			</div>
			<div class="row apl-1 apt-1">
				<input type="SUBMIT" value="Upload">
			</div>
		</div>
	</form>
</div>
