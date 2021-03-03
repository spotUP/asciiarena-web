<?php
// -------------------------------------------------------------------------------- 
// BROKEN COLLYS                                                                    
// -------------------------------------------------------------------------------- 
?>
	<div class="tab-pane fade" id="broken">

		Broken Collys

		<form enctype="multipart/form-data" action="admin.php" method="post">
			<?php
			$ask="SELECT * FROM collys WHERE broken='1' ORDER BY filename ASC";
			$result=fetchAll($ask);
			foreach ($result as $row)
			{
				$filename=$row->filename;
				$encoded_filename=base64_encode($filename);
				$broken_comment=$row->broken_comment;

				?>
				<a href="info_release.php?filename=<?=$encoded_filename?>"><?php=$filename?></a>
				<input type="hidden" name="filename" value="<?=$filename?>">
				<input type="submit" name="colly_fixed" value="Fixed">
				Comment: <?php=$broken_comment?>
				<?php
			}
			?>
		</form>
	</div>
