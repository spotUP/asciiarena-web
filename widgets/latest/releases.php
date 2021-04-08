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
		$collys[ base64_encode($row->filename) ] = utf8_encode(file_get_contents($file_id));
	}
}
foreach($collys as $fname => $colly) 
{
	?>
	<div class="col-<?=$breakpoint?><?=(round(12 / $columns))?> overflow-hidden">
		<div class="row justify-content-md-center animate__animated animate__backInUp">
			<pre><a href="/info_release.php?filename=<?=$fname?>" class="ascii"><?=$colly?></a></pre>
		</div>
	</div>
	<?php 
}
?>