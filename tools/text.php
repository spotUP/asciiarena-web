<?php defined('VALID') or die('Nuh-uh!');

	function encodeText($text) {
    if (mb_detect_encoding($text,'UTF-8',true)==false) {
      $text = utf8_encode($text);
    }
    $$text = htmlentities($text, ENT_SUBSTITUTE);
    $text = str_replace("&nbsp;"," ",$$text);
    return $text;
  }
  
  function encodeFileText($filename) {
    return encodeText(file_get_contents($filename));
  }
  
  function convertToAsciiText($text) {
    $target = str_replace( "?", "[question_mark]", $text);
    $target = mb_convert_encoding($target,'ISO-8859-1','UTF-8');
    if (($target == false ) or (strpos($target,'?'))) {
       return false;
    }
    return mb_convert_encoding($text,'ISO-8859-1','UTF-8');
  }
