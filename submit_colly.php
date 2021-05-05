<div class="tab-pane fade show active" id="colly">
	<form enctype="multipart/form-data" action="submit.php" method="post">
		<input type="hidden" name="max_file_size" value="10240000">
		<div class="container-fluid bg-secondary ap-1">
			<div class="row apl-1 apb-1 apt-1">
				Upload Amiga ASCII Colly/ANSI (No PC stuff!)
			</div>
			<div class="row apl-1">
				File (required)
			</div>
			<div class="row apl-1 apb-1">
				<input type="file" name="uploadedfile"><span class="apl-1"><input type="SUBMIT" name="dupecheck" value="Dupe Check"></span>
			</div>

			<div class="row apl-1">
				Name (required)
			</div>
			<div class="row apl-1 apb-1">
				<input type="text" size="24" name="colly_name" autocomplete="off">
			</div>

			<div class="row apl-1">
				Artist
			</div>
			<div class="row apl-1 apb-1">
				<span id="new_artist_field"></span> <span onclick="add_artist_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Artist!</button></span>
				<input type="hidden" name="total_artists" id="total_artists" value="0">
			</div>
			<div class="row apl-1">
				Crew
			</div>
			<div class="row apl-1 apb-1">
				<span id="new_crew_field"></span> <span onclick="add_crew_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Crew!</button></span>
				<input type="hidden" name="total_crews" id="total_crews" value="0">
			</div>
			<div class="row apl-1">
				Date
			</div>
			<div class="row apl-1 apb-1">
				<span>
					<select class="select2" name="day">
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
				</span>
				<span class="apl-1">
					<select class="select2" name="month">
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
				</span>
				<span class="apl-1">
					<select class="select2" name="year">
						<option value="0">Unknown</option>
						<?php for ($i=date('Y'); $i>=1986; $i--) { ?>
						<option value="<?=$i?>"><?=$i?></option>
						<?php } ?>
					</select>
				</span>
			</div>
			<div class="row apl-1">
				Type
			</div>
			<div class="row apl-1 apb-1">
				<span>
					<select class="select2" name="type">
						<option value="ASCII">ASCII/Ansi</option>
						<option>Archive</option>
					</select>
				</span>
			</div>

			<div class="row apl-1">
				ANSI Colors
			</div>

			<div class="row apl-1 apb-1">
				<span>
					<select class="select2" name="colors">
						<option value="transparent">ANSI</option>
						<option>Workbench</option>
					</select>
				</span>
			</div>

			<div class="row apl-1 apb-1">
				<input type="SUBMIT" value="Upload">
			</div>
		</form>
	</div>
</div>
