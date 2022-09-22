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
		$broken_comment=$row->broken_comment;

		?>
		<form enctype="multipart/form-data" action="#broken" method="post">
			<div class="row apb-1">
				<div class="col-12">
					<h1 class="ap-1 bg-header"><a href="/release/<?=$filename?>"><?=$filename?></a></h1>
				</div>
			</div>

			<div class="row apl-1 apr-1 apb-1">
				<div class="col-10">
					<span class="cyan">Comment: <?=$broken_comment?></span>
				</div>
			</div>

			<div class="row apl-1 apr-1 apb-1">
				<div class="col-2 d-flex">
					<input type="hidden" name="filename" value="<?=$filename?>">
					<input type="submit" class="btn-big white bg-green" name="colly_fixed" value="Fixed">
					<a href="/release/<?=$filename?>" class="btn-big amb-1 bg-header text apt-1 apb-1 grey-text" role="button" aria-disabled="true">View</a>


      <form action="/admin.php#colly" method="post" id="edit-colly">
        <input type="hidden" name="getcollyname" value="<?=$filename?>">
        <input type="hidden" name="open_edit_colly_field" value="1">
        <input type="submit" class="btn-big amb-1" name="edit_colly" value="Edit">
      </form>

				</div>
			</div>
			
		</form>
		<?php
	}
	?>
</div>
