<?php  
header('Content-Type: text/plain; charset=ISO-8859-1');  
require_once "session.php";
$count = $_GET[ "l" ] ?? "";

echo "Filename".chr(9)."Path".chr(9)."Artist(s)".chr(9)."Crew(s)".chr(9)."Description".chr(10);

if (!empty($count)) {
   $q = "select co.name, co.filename, (SELECT GROUP_CONCAT(c.name) FROM `collys_crews` cc inner join crews c on c.id = cc.crew_id where cc.colly_id=co.id group by cc.colly_id) crews, (SELECT GROUP_CONCAT(a.nick) FROM `artists_collys` ac inner join artists a on a.id= ac.artist_id where ac.colly_id=co.id group by ac.colly_id) artists from collys co order by id desc limit $count";
} else {
   $q = "select co.name, co.filename, (SELECT GROUP_CONCAT(c.name) FROM `collys_crews` cc inner join crews c on c.id = cc.crew_id where cc.colly_id=co.id group by cc.colly_id) crews, (SELECT GROUP_CONCAT(a.nick) FROM `artists_collys` ac inner join artists a on a.id= ac.artist_id where ac.colly_id=co.id group by ac.colly_id) artists from collys co";
}

foreach(fetchAll($q) as $row) {
  if (strlen($row->filename)>0) {
  $dirname = explode(".", $row->filename);
  $dirname = $dirname[0];
  if (file_exists("collections/".$dirname."/".$row->filename)) {
    echo utf8_decode($row->filename ?? '').chr(9)."collections/".utf8_decode($dirname ?? '').chr(9).utf8_decode($row->artists ?? '').chr(9).utf8_decode($row->crews ?? '').chr(9).utf8_decode($row->name ?? '').chr(10);
  }
  }
}
?>
