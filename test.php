<?php
require_once "session.php";
$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
include "header.php";
?>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
		<?php //phpinfo()?>
		<div class="bs-docs-example">
			<select id="colorselector_1" class="ascii">

				<option value='darkgrey' data-color="#555555">Bright Black</option>
				<option value='blue' data-color="#5555ff">Bright Blue</option>
				<option value='magenta' data-color="#ff55ff">Bright Magenta</option>
				<option value='red' data-color="#ff5555">Bright Red</option>
				<option value='yellow' data-color="#ffff55">Brigt Yellow</option>
				<option value='green' data-color="#55ff55">Bright Green</option>
				<option value='cyan' data-color="#55FFFF">Bright Cyan</option>
				<option value='white' data-color="#ffffff">White</option>


				<option value='black' data-color="#000000">Black</option>
				<option value='darkblue' data-color="#0000aa">Blue</option>
				<option value='darkmagenta' data-color="#aa00aa">Magenta</option>
				<option value='darkred' data-color="#aa0000">Red</option>
				<option value='brown' data-color="#aa5500">Yellow</option>
				<option value='darkgreen' data-color="#00aa00">Green</option>
				<option value='darkcyan' data-color="#00aaaa">Cyan</option>
				<option value='grey' data-color="#aaaaaa">Grey</option>

			</select>
		</div>









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
