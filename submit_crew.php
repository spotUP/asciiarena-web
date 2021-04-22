<div class="tab-pane fade" id="crew">
	<form enctype="multipart/form-data" action="submit.php" method="post">
		<div class="container-fluid bg-secondary ap-1">

			<div class="row apl-1 apt-1">
				Name (required)
			</div>

			<div class="row apb-1 apl-1">
				<input type="text" size="20" name="crewname">
			</div>

			<div class="row apl-1">
				Acronym
			</div>

			<div class="row apb-1 apl-1">
				<input type="text" size="20" name="crewacronym">
			</div>

			<div class="row apl-1">
				Webpage
			</div>

			<div class="row apb-1 apl-1">
				<input type="text" size="20" name="crewwww">
			</div>

			<div class="row apl-1">
				BBS
			</div>

			<div class="row apb-1 apl-1">
				<span id="new_crew_bbs_field"></span> <span onclick="add_crew_bbs_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add BBS!</button></span><input type="hidden" name="total_crew_bbses" id="total_crew_bbses" value="0">
			</div>

			<div class="row apl-1">
				Contact
			</div>

			<div class="row apb-1 apl-1">
				<input type="text" size="20" name="crewcontact">
			</div>

			<div class="row apl-1">
				Status:
			</div>

			<div class="row apb-1 apl-1">
				<select class="custom-select" name="crewstatus">
					<option>Active</option>
					<option selected="selected">Inactive</option>
				</select>
			</div>

			<div class="row apl-1">
				<input type="submit" value="Submit">
			</div>
		</div>

	</form>
</div>
