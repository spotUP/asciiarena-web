<?php defined('VALID') or die('Nuh-uh!');
if(empty($columns)) {
	$columns = 2;
}
if(empty($breakpoint)) {
	$breakpoint = "xl-";
}
$breakpoint = rtrim($breakpoint, "-") . "-";
$collys = [];
$res = fetchAll("(SELECT * FROM collys ORDER BY id DESC) ORDER BY year DESC, month DESC, day DESC LIMIT 20");
foreach($res as $row) {
	$dirname = explode(".", $row->filename);
	$file_id = BASEDIR . "/collections/{$dirname[0]}/{$row->filename}.diz";
	if((count($collys) < $columns) && file_exists($file_id)) {
		$collys[ $row->filename ] = utf8_encode(file_get_contents($file_id));
	}
}
foreach($collys as $fname => $colly) 
{
	?>
	<div class="col-12 d-flex justify-content-center col-<?=$breakpoint?><?=(round(12 / $columns))?> overflow-hidden apt-1 apb-1">
		<div class="row animate__animated animate__backInUp">
			<pre style="opacity: 1.0; position: absolute; top: 0px;"><a href="/release/<?=$fname?>" class="ascii magenta"><?=$colly?></a></pre>
			<pre style="opacity: 0.15; position: absolute; top: 10px;"><a href="/release/<?=$fname?>" class="ascii magenta"><?=$colly?></a></pre>
			<pre style="opacity: 0.05; position: absolute; top: 20px;"><a href="/release/<?=$fname?>" class="ascii magenta"><?=$colly?></a></pre>
			<pre style="opacity: 0.02; position: absolute; top: 30px;"><a href="/release/<?=$fname?>" class="ascii magenta"><?=$colly?></a></pre>
			<pre><a href="/release/<?=$fname?>" class="ascii magenta"><?=$colly?></a></pre>
		</div>
	</div>
	<?php 
}
?>
