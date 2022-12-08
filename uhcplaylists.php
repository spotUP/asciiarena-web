<?php  
  require_once "session.php";

$file = $_GET[ "file" ] ?? "";

if (!empty($file)) {
    $row = fetchOne("select filename,filedata from hippo_playlists where filename=:filename", [
        ":filename" => $file
      ]);
  if ($row) {
    $filedata = base64_decode(str_replace("data:application/octet-stream;base64,","",$row->filedata));
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename='.$row->filename);
    header('Content-Transfer-Encoding: binary');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . strlen($filedata));
    ob_clean();
    flush();
    echo $filedata;
  }  
} else {
  header('Content-Type: text/plain; charset=ISO-8859-1');  
  echo "Filename".chr(9)."Path".chr(9)."Title".chr(9)."Author".chr(9)."Genre".chr(10);

  foreach(fetchAll("select * from hippo_playlists order by id") as $row) {
      echo utf8_decode($row->filename).chr(9)."playlist".chr(9).utf8_decode($row->title).chr(9).utf8_decode($row->author).chr(9).utf8_decode($row->genre).chr(10);
    }
}
?>
