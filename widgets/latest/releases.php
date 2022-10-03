<?php defined('VALID') or die('Nuh-uh!');
require_once "tools/text.php";

if(empty($columns)) {
	$columns = 2;
}
if(empty($breakpoint)) {
	$breakpoint = "xl-";
}
$breakpoint = rtrim($breakpoint, "-") . "-";
$releases = [];
$res = fetchAll("select * from (
(SELECT 'A' as type, filename, year(from_unixtime(timestamp)) fyear,month(from_unixtime(timestamp)) fmonth,dayofmonth(from_unixtime(timestamp)) fday from apps where year=0 and month=0 and day=0 order by fyear,fmonth,fday desc limit 10)
union
(SELECT 'A' as type, filename, year fyear,month fmonth,day fday from apps where year<>0 or month<>0 or day<>0 order by fyear,fmonth,fday desc limit 10)
union
(select 'C' as type, filename, year fyear, month fmonth, day fday from collys order by year desc, month desc,day desc limit 10)
union
(SELECT 'M' as type, filename, year(from_unixtime(timestamp)) fyear,month(from_unixtime(timestamp)) fmonth,dayofmonth(from_unixtime(timestamp)) fday from mags where year=0 and month=0 and day=0 order by fyear,fmonth,fday desc limit 10)
union
(SELECT 'M' as type, filename, year fyear,month fmonth,day fday from mags where year<>0 or month<>0 or day<>0 order by fyear,fmonth,fday desc limit 10)
) a
order by a.fyear desc, a.fmonth desc, a.fday desc limit 10");
foreach($res as $row) {
	$dirname = explode(".", $row->filename);

  if(strcmp($row->type,"C")==0) {
  	$file_id = BASEDIR . "/collections/{$dirname[0]}/{$row->filename}.diz";
    $filename = "/release/".$row->filename;
  } else if(strcmp($row->type,"M")==0) {
  	$file_id = BASEDIR . "/mags/{$dirname[0]}/{$row->filename}.diz";
    $filename = "/magazine/".$row->filename;
  } else if(strcmp($row->type,"A")==0) {
    $file_id = preg_replace('/\\.[^.\\s]{3,4}$/', '', $row->filename).'.diz';
    $file_id ='apps/'.$file_id;
    $filename = "/application/".$row->filename;
  } else {
    $file_id ='';
    $filename = '';
  }

	if((count($releases) < $columns) && strlen($file_id)>0 && file_exists($file_id)) {
		$releases[ $filename ] = encodeFileText($file_id);
	}
}
foreach($releases as $fname => $release) 
{
	?>
	<div class="col-12 d-flex justify-content-center col-<?=$breakpoint?><?=(round(12 / $columns))?> overflow-hidden apt-1 apb-1">
		<div class="row animate__animated animate__backInUp">
			<pre><a href="<?=$fname?>" class="ascii magenta"><?=$release?></a></pre>
		</div>
	</div>
	<?php 
}
?>
