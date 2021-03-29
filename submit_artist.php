<div class="tab-pane fade" id="artist">
	<!-- -------------------------------------------------------------------------------- -->
	<!-- ADD ARTIST FIELD                                                              -->
	<!-- -------------------------------------------------------------------------------- -->

	<form enctype="multipart/form-data" action="submit.php" method="post">	

		<div class="headline">
			Add Artist	
		</div>

		<div class="content_with_blenk"><br></div>

		<div class="content">
			Nick
		</div>

		<div class="content">
			<input type="text" size="20" name="artistnick">
		</div>

		<div class="content">
			Acronym
		</div>

		<div class="content">
			<input type="text" size="20" name="artistacronym">
		</div>

		<div class="content">
			Webpage
		</div>

		<div class="content">
			<input type="text" size="20" name="artistwww">
		</div>

		<div class="content">
			Country
		</div>

		<div class="content">
			<select name="artistcountry"> 
				<option value="Unknown">Unknown</option>
				<?php
				foreach($country_list as $symbol => $country)
				{
					echo "<option value=\"$symbol\">$country</option>\n";
				}
				?>
			</select>	
		</div>

		<div class="content">
			Crew
		</div>

		<div class="content">
			<span id="new_artist_crew_field"></span> <span onclick="add_artist_crew_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Crew!</button></span>
			<input type="hidden" name="total_artist_crews" id="total_artist_crews" value="0">
		</div>

		<div class="content">
			Status:
		</div>

		<div class="content">
			<select name="artiststatus">
				<option>Active</option>
				<option>Inactive</option>
			</select>
		</div>

		<div class="content">
			<input type="submit" value="Submit">
		</div>
	</form>
</div>