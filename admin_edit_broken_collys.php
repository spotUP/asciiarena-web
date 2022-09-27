<?php
// -------------------------------------------------------------------------------- 
// BROKEN COLLYS                                                                    
// -------------------------------------------------------------------------------- 
?>
<div class="tab-pane fade apt-1" id="broken">
<div id = "brokencollys">
		

		<?php if ($admin_edit && is_admin()) { ?>
			<script>
				$(function () {
					getBrokenCollyList();
				});

    function showCollyAlert(content, success) {
      if (success) {
        alertContent = `<div id="#success-alert" class="bs-component quick-alert animate__animated animate__bounceIn alert alert-success">${content}</div>`;
      } else {
        alertContent = `<div id="#failure-alert" class="bs-component quick-alert animate__animated animate__shakeX alert alert-warning">${content}</div>`;
      }
      $("#broken").prepend(alertContent).children().first().delay(2000).slideUp();
    }

    function fixColly(filename,id) {
      $.ajax({
        "type": "POST",
        "url": "/admin_cmds.php?cmd=fix_colly&id="+id,
        "success": () => {
          showCollyAlert(filename+" Fixed!", true);
          getBrokenCollyList();
        }
      });
      
    }

		function getBrokenCollyList() {
			let collylist = $("#brokencollys");
			collylist.empty();
			$.get("/admin_cmds.php?cmd=broken_collys", function (data) {
				$.each(data, function (i, colly) {
          var colly_id = colly.colly_id
          var broken_comment = colly.broken_comment
          var filename = colly.filename
          collylist.append(`<div class="row apb-1">
				<div class="col-12">
					<h1 class="ap-1 bg-header"><a href="/release/${filename}">${filename}</a></h1>
				</div>
			</div>

			<div class="row apl-1 apr-1 apb-1">
				<div class="col-10">
        <span class="cyan">Comment: ${broken_comment}</span>
				</div>
			</div>

			<div class="row apl-1 apr-1 apb-1">
				<div class="col-2 d-flex">
						<input type="button" class="btn-big white bg-green" onclick="fixColly('${filename}',${colly_id})" value="Fixed">
						<a href="/release/${filename}" class="btn-big amb-1 bg-header text apt-1 apb-1 grey-text" role="button" aria-disabled="true">View</a>
						<form action="#colly" method="post" id="edit-colly">
							<input type="hidden" name="getcollyname" value="${filename}">
							<input type="hidden" name="open_edit_colly_field" value="1">
							<input type="submit" class="btn-big amb-1" name="edit_colly" value="Edit">
						</form>
				</div>
			</div>`)
				});
			});
		}



			</script>
		<?php } ?>
  
</div>
</div>