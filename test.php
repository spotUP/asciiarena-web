<?php
require_once "session.php";
$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
include "header.php";
?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
		<?php //phpinfo()?>
		<select id="colorselector_1" name="set_def_bg_col">
			<option selected="selected" value="<?=$def_fg_col?>" /><?=$fg_color_list["$def_fg_col"]?></option>
			<option value='#555555' data-color="#555555">Bright Black</option>
			<option value='#5555ff' data-color="#5555ff">Bright Blue</option>
			<option value='#ff55ff' data-color="#ff55ff">Bright Magenta</option>
			<option value='#ff5555' data-color="#ff5555">Bright Red</option>
			<option value='#ffff55' data-color="#ffff55">Brigt Yellow</option>
			<option value='#55ff55' data-color="#55ff55">Bright Green</option>
			<option value='#55FFFF' data-color="#55FFFF">Bright Cyan</option>
			<option value='#ffffff' data-color="#ffffff">White</option>
			<option value='#000000' data-color="#000000">Black</option>
			<option value='#0000aa' data-color="#0000aa">Blue</option>
			<option value='#aa00aa' data-color="#aa00aa">Magenta</option>
			<option value='#aa0000' data-color="#aa0000">Red</option>
			<option value='#aa5500' data-color="#aa5500">Yellow</option>
			<option value='#00aa00' data-color="#00aa00">Green</option>
			<option value='#00aaaa' data-color="#00aaaa">Cyan</option>
			<option value='#aaaaaa' data-color="#aaaaaa">Grey</option>
		</select>
		<script>
			$(function() {

				window.prettyPrint && prettyPrint();

				$('#colorselector_1').colorselector();
				$('#colorselector_2').colorselector({
					callback : function(value, color, title) {
						$("#colorValue").val(value);
						$("#colorColor").val(color);
						$("#colorTitle").val(title);
					}
				});

				$("#setColor").click(function(e) {
					$("#colorselector_2").colorselector("setColor", "#008B8B");
				})

				$("#setValue").click(function(e) {
					$("#colorselector_2").colorselector("setValue", 18);
				})

			});
		</script>
	</div>
	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>
</div>
<?php include "footer.php"; ?>
