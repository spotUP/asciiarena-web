<div class="tab-pane fade" id="artist">
	<form action="submit.php" method="post">	
		<div class="container-fluid bg-secondary ap-1">

			<div class="row apl-1 apt-1">
				Nick (required)
			</div>

			<div class="row apl-1 apb-1">
				<input type="text" size="20" name="artistnick" autocomplete="off">
			</div>

			<div class="row apl-1">
				Acronym
			</div>

			<div class="row apl-1 apb-1">
				<input type="text" size="20" name="artistacronym" autocomplete="off">
			</div>

			<div class="row apl-1">
				Webpage
			</div>

			<div class="row apl-1 apb-1">
				<input type="text" size="20" name="artistwww" autocomplete="off">
			</div>

			<div class="row apl-1">
				Country
			</div>

			<div class="row apl-1 apb-1">
				<span>
					<select class="select2" name="artistcountry"> 
						<option value="Unknown">Unknown</option>
						<?php
						foreach($country_list as $symbol => $country)
						{
							echo "<option value=\"$symbol\">$country</option>\n";
						}
						?>
					</select>
				</span>
			</div>

			<div class="row apl-1">
				Crew
			</div>

			<div class="row apl-1 apb-1">
				<span id="new_artist_crew_field"></span> <span onclick="add_artist_crew_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Crew!</button></span>
				<input type="hidden" name="total_artist_crews" id="total_artist_crews" value="0">
			</div>

			<div class="row apl-1">
				Status:
			</div>

			<div class="row apl-1 apb-1">
				<span>
					<select class="select2" name="artiststatus">
						<option>Active</option>
						<option>Inactive</option>
					</select>
				</span>
			</div>

			<div class="row apl-1">
				<input type="submit" value="Submit">
			</div>
		</div>
	</form>
</div>