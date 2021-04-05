<?php
// -------------------------------------------------------------------------------- 
// BROKEN COLLYS                                                                    
// -------------------------------------------------------------------------------- 
?>
<div class="tab-pane fade apt-1" id="broken">

		<?php
		$ask="SELECT * FROM collys WHERE broken='1' ORDER BY filename ASC";
		$result=fetchAll($ask);
		foreach ($result as $row)
		{
			$filename=$row->filename;
			$encoded_filename=base64_encode($filename);
			$broken_comment=$row->broken_comment;

			?>
	<form enctype="multipart/form-data" action="#broken" method="post">
				<div class="row apb-1">
					<div class="col-12">
						<h1 class="ap-1 bg-header"><a href="info_release.php?filename=<?=$encoded_filename?>"><?=$filename?></a></h1>
					</div>
				</div>

				<div class="row apl-1 apr-1 apb-1">
					<div class="col-10">
						Comment: <?=$broken_comment?>
					</div>
				</div>

				<div class="row apl-1 apr-1 apb-1">
					<div class="col-2">
						<input type="hidden" name="filename" value="<?=$filename?>">
						<input type="submit" name="colly_fixed" value="Fixed">
					</div>
				</div>
				<div class="row" style="background-color: #111111;">
					<br>
				</div>
	</form>
			<?php
		}
		?>
</div>
