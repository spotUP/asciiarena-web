<?php defined('VALID') or die('Nuh-uh!');
	$wall_id = random_int(0, 65536);
	$wall = "wall_{$wall_id}";
	$form = "form_{$wall_id}";
	$tag = "tag_{$wall_id}";
?>
<div class="container-fluid" style="padding-bottom: 16px;">
	<div class="row m-0 p-0" id="<?=$wall?>"></div>
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
			<div class="col-lg-12" style="padding-top: 16px;">
				<form id="<?=$form?>" action="/cmds.php?cmd=tag" method="post" class="form-inline my-2 my-lg-0">
					<input class="form-control col-11 tagtext" type="text" maxlength="68" name="tagtext"
					       placeholder="Tag the wall"
					       id="<?=$tag?>" required autocomplete="off">
					<button class="btn-primary col-1" style="margin: 0 !important; padding: 0 !important" type="submit">Tag
					</button>
				</form>
			</div>
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
