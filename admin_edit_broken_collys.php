<?php
// -------------------------------------------------------------------------------- 
// BROKEN COLLYS                                                                    
// -------------------------------------------------------------------------------- 
?>
<div class="tab-pane fade" id="broken">

	<form enctype="multipart/form-data" action="#broken" method="post">
		<?php
		$ask="SELECT * FROM collys WHERE broken='1' ORDER BY filename ASC";
		$result=fetchAll($ask);
		foreach ($result as $row)
		{
			$filename=$row->filename;
			$encoded_filename=base64_encode($filename);
			$broken_comment=$row->broken_comment;

			?>
			<div class="row ap-0">

				<div class="col-2">
					<a href="info_release.php?filename=<?=$encoded_filename?>"><?=$filename?></a>
				</div>
				<div class="col-8">
					Comment: <?=$broken_comment?>
				</div>
				<div class="col-2">
					<input type="hidden" name="filename" value="<?=$filename?>">
					<input type="submit" name="colly_fixed" value="Fixed">
				</div>
			</div>
			<?php
		}
		?>
	</form>
</div>
