<div class="tab-pane fade show active" id="colly">

	<!-- -------------------------------------------------------------------------------- -->
	<!-- UPLOAD COLLY FIELD                                                               -->
	<!-- -------------------------------------------------------------------------------- -->

	<div class="headline">
		Upload Amiga ASCII Colly/ANSI (No PC stuff!)
	</div>

	<div class="content_with_blenk"><br></div>

	<form enctype="multipart/form-data" action="submit.php" method="post">
		<input type="hidden" name="max_file_size" value="10240000">
		<div class="content">
			File
		</div>

		<div class="content">
			<input type="file" name="uploadedfile">
			<input type="SUBMIT" name="dupecheck" value="Dupe Check">
		</div>

		<div class="content">
			Name
		</div>

		<div class="content">
			<input type="text" size="24" name="colly_name">
		</div>

		<div class="content">
			Artist
		</div>

		<div class="content">	
			<span id="new_artist_field"></span> <span onclick="add_artist_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Artist!</button></span>
			<input type="hidden" name="total_artists" id="total_artists" value="0">
		</div>

		<div class="content">
			Crew
		</div>

		<div class="content">
			<span id="new_crew_field"></span> <span onclick="add_crew_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Crew!</button></span>
			<input type="hidden" name="total_crews" id="total_crews" value="0">
		</div>

		<div class="content">		
			Date
		</div>

		<div class="content">		
			<select name="day">
				<?php
				$min_day=1;
				$max_day=31;
				echo "<option selected='selected' value=0>Unknown</option>";
				while($min_day<=$max_day)
				{
					echo "<option>$min_day</option>";
					$min_day++;
				}
				?>
			</select>
			<select name="month">
				<option value="0">Unknown</option>
				<option value="1">January</option>
				<option value="2">February</option>
				<option value="3">Mars</option>
				<option value="4">April</option>
				<option value="5">May</option>
				<option value="6">June</option>
				<option value="7">July</option>
				<option value="8">August</option>
				<option value="9">September</option>
				<option value="10">October</option>
				<option value="11">November</option>
				<option value="12">December</option>
			</select>
			<select name="year">
				<?php
				$countyear=1986;
				$maxyear=date("Y");
				echo "<option selected='selected' value=0>Unknown</option>";
				while($countyear<=$maxyear)
				{
					echo "<option value=\"$countyear\">$countyear</option>";
					$countyear++;
				}
				?>
			</select>
		</div>

		<div class="content">
			Type
		</div>

		<div class="content">
			<select name="type">
				<option value="ASCII">ASCII/Ansi</option>
				<option>Archive</option>
			</select>
		</div>

		<div class="content">
			ANSI Colors
		</div>

		<div class="content">
			<select name="colors">
				<option value="transparent">ANSI</option>
				<option>Workbench</option>
			</select>
		</div>

		<div class="content">			
			<input type="SUBMIT" value="Upload">
		</div>
	</form>
</div>