<?php defined('VALID') or die('Nuh-uh!');
	if (empty($columns)) {
		$columns = 2;
	}
	if (empty($breakpoint)) {
		$breakpoint = "xl-";
	}
	$breakpoint = rtrim($breakpoint, "-") . "-";
	$collys = [];
	$res = fetchAll("(SELECT * FROM collys ORDER BY id DESC) ORDER BY year DESC, month DESC, day DESC LIMIT 20");
	foreach ($res as $row) {
		$dirname = explode(".", $row->filename);
		$filename = BASEDIR . "/collections/{$dirname[0]}/{$row->filename}.diz";
echo "filename: $filename <br>";
		if (file_exists($filename) && count($collys) < $columns) {
			$collys[] = utf8_encode(file_get_contents($filename));
		}
	}
	foreach ($collys as $colly) {
		?>
		<div class="col-<?=$breakpoint?><?=(round(12 / $columns))?>" style="min-height: 240px;">
			<div class="bs-component">
				<div class="card text-white bg-transparent mb-3">
					<div class="card-body">
						<div class="row justify-content-md-center">
							<pre><a href="#" class="ascii"><?=$colly?></a></pre>
						</div>
					</div>
				</div>
			</div>
		</div>
	<?php }
