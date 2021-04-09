<div class="tab-pane fade" id="app">

	<!-- -------------------------------------------------------------------------------- -->
	<!-- UPLOAD MAG FIELD                                                           -->
	<!-- -------------------------------------------------------------------------------- -->

	<form enctype="multipart/form-data" action="submit.php" method="post">
		<div class="headline">
			Upload ASCII Mag
		</div>

		<div class="content_with_blenk"><br></div>

		<div class="content">
			Name
		</div>

		<div class="content">
			<input type="text" size="24" name="name">
		</div>

		<div class="content">
			Author
		</div>

		<div class="content">
			<input type="text" name="mag_author">
		</div>

		<div class="content">
			File		
		</div>

		<input name="uploaded_mag" type="file">
		<input type="hidden" name="max_file_size" value="10240000">
		<input type="hidden" name="type" value="MAG">
		<input type="SUBMIT" value="Upload">
	</form>
</div>
