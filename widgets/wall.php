<?php defined('VALID') or die('Nuh-uh!');
$wall_id = random_int(0, 65536);
$wall = "wall_{$wall_id}";
$form = "form_{$wall_id}";
$tag = "tag_{$wall_id}";
?>
<div class="header col-12 col-lg-12">
	<h2 class="apt-1 apb-1 bg-header">TAG THE WALL</h2>
</div>
<div class="container-fluid p-0 p-lg-2">
	<div class="row m-0 p-0 bg-secondary apb-1" id="<?=$wall?>"></div>
	<?php if (is_logged_in()): ?>
		<div class="row">
			<style>
				.tagtext {
					color: white !important;
				}

				.tagtext:active::placeholder,
				.tagtext:focus::placeholder {
					color: transparent;
				}
			</style>
			<form id="<?=$form?>" action="/cmds.php?cmd=tag" method="post" class="w-100">
				<div class="row col-12 col-lg-12 m-0">
					<div class="col-10 col-lg-11">
						<input class="form-control tagtext w-100" type="text" name="tagtext" placeholder="Tag the wall" id="<?=$tag?>" required autocomplete="off">
					</div>
					<div class="col-2 col-lg-1">
						<button class="button w-100" type="submit">Tag</button>
					</div>
				</div>
			</form>
			<script>
				$(function () {
					$("#<?=$form?>").submit(function (e) {
						e.preventDefault();
						const form = $(this);
						const url = form.attr("action");
						$.ajax({
							"type": "POST",
							"url": url,
							"data": form.serialize(),
							"success": function (data) {
								$("#<?=$wall?>").html(data);
								$("#<?=$tag?>").val("");
							}
						});
					});
				});
			</script>
		</div>
	<?php endif; ?>
</div>
<script>
	function fetch_wall_<?=$wall?>() {
		$.ajax({
			url: "/cmds.php?cmd=tag"
		}).done(function (data) {
			$("#<?=$wall?>").html(data);
		});
	}

	$(function () {
		fetch_wall_<?=$wall?>();
		setInterval(fetch_wall_<?=$wall?>, 10000);
	});
</script>
