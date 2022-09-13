<?php  
header('Content-Type: text/plain');  
header("Content-Transfer-Encoding: utf-8");   
require_once "session.php";
echo "Filename".chr(9)."Path".chr(9)."Artist(s)".chr(9)."Crew(s)".chr(9)."Description".chr(13).chr(10);

foreach(fetchAll("select co.name, co.filename, (SELECT GROUP_CONCAT(c.name) FROM `collys_crews` cc inner join crews c on c.id = cc.crew_id where cc.colly_id=co.id group by cc.colly_id) crews, (SELECT GROUP_CONCAT(a.nick) FROM `artists_collys` ac inner join artists a on a.id= ac.artist_id where ac.colly_id=co.id group by ac.colly_id) artists from collys co") as $row) {
  if (strlen($row->filename)>0) {
  $dirname = explode(".", $row->filename);
  $dirname = $dirname[0];
  if (file_exists("collections/".$dirname."/".$row->filename)) {
    echo $row->filename.chr(9)."collections/".$dirname."/".$row->filename.chr(9).$row->artists.chr(9).$row->crews.chr(9).$row->name.chr(13).chr(10);
  }
  }
}
?>
