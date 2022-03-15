<?php defined('VALID') or die('Nuh-uh!');
if(empty($columns)) {
	$columns = 2;
}
if(empty($breakpoint)) {
	$breakpoint = "xl-";
}
$breakpoint = rtrim($breakpoint, "-") . "-";
$collys = [];
$res = fetchAll("(SELECT 'A' type, filename, year(from_unixtime(timestamp)) fyear,month(from_unixtime(timestamp)) fmonth,dayofmonth(from_unixtime(timestamp)) fday from apps order by id desc limit 20) union (select 'C' type, filename, year fyear, month fmonth, day fday from collys order by id desc limit 20) order by fyear desc, fmonth desc, fday desc");
foreach($res as $row) {
	$dirname = explode(".", $row->filename);

  if(strcmp($row->type,"C")==0) {
  	$file_id = BASEDIR . "/collections/{$dirname[0]}/{$row->filename}.diz";
    $filename = "/release/".$row->filename;
  } else {
    $file_id = preg_replace('/\\.[^.\\s]{3,4}$/', '', $row->filename).'.diz';
    $file_id ='apps/'.$file_id;
    $filename = "/application/".$row->filename;
  }

	if((count($collys) < $columns) && file_exists($file_id)) {
		$collys[ $filename ] = utf8_encode(file_get_contents($file_id));
	}
}
foreach($collys as $fname => $colly) 
{
	?>
	<div class="col-12 d-flex justify-content-center col-<?=$breakpoint?><?=(round(12 / $columns))?> overflow-hidden apt-1 apb-1">
		<div class="row animate__animated animate__backInUp">
			<pre><a href="<?=$fname?>" class="ascii magenta"><?=$colly?></a></pre>
		</div>
	</div>
	<?php 
}
?>
