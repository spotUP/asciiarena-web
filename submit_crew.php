<div class="tab-pane fade" id="crew">

	<!-- -------------------------------------------------------------------------------- -->
	<!-- ADD CREW FIELD                                                                -->
	<!-- -------------------------------------------------------------------------------- -->

	<form enctype="multipart/form-data" action="submit.php" method="post">
		<div class="headline">
			Add Crew	
		</div>

		<div class="content_with_blenk"><br></div>

		<div class="content">
			Name
		</div>

		<div class="content">
			<input type="text" size="20" name="crewname">
		</div>

		<div class="content">
			Acronym
		</div>

		<div class="content">
			<input type="text" size="20" name="crewacronym">
		</div>

		<div class="content">
			Webpage
		</div>

		<div class="content">
			<input type="text" size="20" name="crewwww">
		</div>

		<div class="content">
			BBS
		</div>

		<div class="content">
			<span id="new_crew_bbs_field"></span> <span onclick="add_crew_bbs_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add BBS!</button></span><input type="hidden" name="total_crew_bbses" id="total_crew_bbses" value="0">
		</div>

		<div class="content">
			Contact
		</div>

		<div class="content">
			<input type="text" size="20" name="crewcontact">
		</div>

		<div class="content">
			Status:
		</div>

		<div class="content">
			<select name="crewstatus">
				<option>Active</option>
				<option selected="selected">Inactive</option>
			</select>
		</div>

		<div class="content">
			<input type="submit" value="Submit">
		</div>
	</form>
</div>