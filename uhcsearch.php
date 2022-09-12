<?php  
header('Content-Type: text/plain');  
header("Content-Transfer-Encoding: utf-8");   
require_once "session.php";
?>
<?="filename".chr(9)."path".chr(9)."description".chr(13).chr(10)?>
<?php
foreach(fetchAll("SELECT * FROM collys") as $row) {
  if (strlen($row->filename)>0) {
  $dirname = explode(".", $row->filename);
  $dirname = $dirname[0];
  if (file_exists("collections/".$dirname."/".$row->filename)) {?>
<?=$row->filename?><?=chr(9)?>https://asciiarena.se/collections/<?=$dirname?>/<?=$row->filename?><?=chr(9)?><?=$row->name?><?=chr(13).chr(10)?>
<?php
  }
  }
}
?>
