<?php

$getcollyname=$_POST['getcollyname'] ?? '';
if($getcollyname && (!isset($_POST['do_edit_colly'])))
{
	error_log($getcollyname);
	$getcollyname=cleanInsert($getcollyname);
	$ask="select * from collys where filename=:getcollyname";
	$result=fetchAll($ask, [ 'getcollyname' => $getcollyname]);
	foreach ($result as $row)
	{
		$show_colly_name  = $row->name;
		$show_colly_crew  = $row->crews;
		$show_colly_year  = $row->year;
		$show_colly_month = $row->month;
		$show_colly_day   = $row->day;
		$show_colly_type  = $row->type;
		$show_colly_diz   = $row->file_id;
	}
}
?>
<div class="tab-pane fade show active ap-1" id="colly">
	<form enctype="multipart/form-data" action="#colly" method="post">		
		<div class="row">
			<div class="col-6">
				<select name="getcollyname" onchange="this.form.submit();">
					<?php 
					if (isset($show_colly_name))
					{
						?><option><?=$show_colly_name?></option><?php
					}
					$ask="SELECT name, filename FROM collys ORDER BY filename";
					$result=fetchAll($ask);
					foreach ($result as $row)
					{
						$show_all_colly_names=$row->name;
						$show_all_colly_filenames=$row->filename;
						?><option><?=$show_all_colly_filenames?></option><?php
					}
					?>
				</select>
			</div>
			<div class="col-4">
				<input type="hidden" name="filename" value="<?=$getcollyname?>">
			</div>
		</div>
		<?php
		if(isset($_POST['getcollyname']) && (isset($_POST['open_edit_colly_field'])))
		{
			$getcollyname=$_POST['getcollyname']; ?>
			<div class="row">
				<div class="col-5">
					<div class="col-12">
						<span>file_id_here</span>
					</div>
				</div>
				<div class="col-7">
					<div class="row">
						<div class="col-3">
							<span>Name</span>
						</div>
						<div class="col-9">
							<input type="text" name="edit_colly_name" style="width: 100%;" value="<?=$show_colly_name?>">
						</div>
					</div>
					<div class="row">
						<div class="col-3">
							Type
						</div>
						<div class="col-9">
							<div class="custom-select">
								<select name="edit_colly_type">
									<option><?=$show_colly_type?></option>
									<option>ASCII</option>
									<option>ANSI</option>
								</select>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-3">
							<span>Release Date</span>
						</div>
						<div class="col-3">

							<div class="custom-select">
								<select name=edit_colly_year>
									<?php
									$countyear=1986;
									$maxyear=date("Y");
									?>
									<option><?=$show_colly_year?></option>
									<?php
									while($countyear<=$maxyear)
									{
										?>
										<option><?=$countyear?></option>
										<?php
										$countyear++;
									}

									?>
								</select>
							</div>
						</div>
						<div class="col-3">
							<div class="custom-select">
								<select name="edit_colly_month">
									<option selected="selected"><?=$show_colly_month?></option>
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
							</div>
						</div>
						<div class="col-3">
							<div class="custom-select">
								<select name="edit_colly_day">
									<option selected='selected' value='0'><?=$show_colly_day?></option>
									<option value='0'>Unknown</option>
									<?php
									$min_day=1;
									$max_day=31;
									while($min_day<=$max_day)
									{
										?>
										<option><?=$min_day?></option>
										<?php
										$min_day++;
									}
									?>
								</select>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-3">
							<span>Artist(s)</span>
						</div>
						<div class="col-3">
							<?php
							$ask="select nick from author_of where filename='$getcollyname'";
							$result=fetchAll($ask);
							foreach ($result as $row)
							{
								$colly_author=$row->nick;
								?>
								<div class="custom-select">
									<select name="old_colly_authors[]">
										<option selected="selected"><?=$colly_author?></option>
										<option value="Delete">Remove Author</option>
										<?php
										$ask_authors="select nick from artists";
										$result_authors=fetchAll($ask_authors);
										foreach ($result_authors as $row_authors)
										{
											$authors=$row_authors->nick;
											?><option><?=$authors?></option><?php
										}
										?>
									</select>
								</div>
								<?php
							}
							?>
						</div>
						<div class="col-3">
							<span id="new_colly_author_field"></span> 
							<span onclick="add_colly_author_field();" style="cursor: pointer; cursor: hand;"><button type="button">Add Author!</button></span>
							<input type="hidden" name="total_colly_authors" id="total_colly_authors" value="0">
						</div>
					</div>

					<div class="row">
						<div class="col-3">
							<span>Crew(s)</span>
						</div>
						<div class="col-3">				
							<?php
							$ask="select crew from crew_of where filename=:getcollyname";
							$result=fetchAll($ask, ['getcollyname' => $getcollyname]);
							foreach ($result as $row)
							{
								$colly_crew=$row->crew;
								?>
								<div class="custom-select">
									<select name="old_colly_crews[]">
										<option selected="selected"><?=$colly_crew?></option>
										<option value="Delete">Remove Crew></option>
										<?php
										$ask_crews="select name from crews";
										$result_crews=fetchAll($ask_crews);
										foreach ($result_crews as $row_crews)
										{
											$crews=$row_crews->name;
											?><option><?=$crews?></option><?php
										}
										?>
									</select>
								</div>
								<?php
							}
							?>
						</div>
						<div class="col-3">
							<span id="new_colly_crew_field"></span> 
							<span onclick="add_colly_crew_field();" style="cursor: pointer; cursor: hand;">
								<button type="button">Add Crew!</button>
							</span>
						</div>
						<div class="col-12">
							<input type="hidden" name="total_colly_crews" id="total_colly_crews" value="0">
							<input type="hidden" name="filename" value="<?=$getcollyname?>">
							<input type="submit" name="do_edit_colly" value="Change">
							<input type="submit" name="do_delete_colly" value="Delete">
						</div>
					</div>
				</div>
			</div>
		</form>

		<?php
	}
	?>
</div>
