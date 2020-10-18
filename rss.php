<?php
	header("Content-Type: application/xml; charset=ISO-8859-1"); 
	include("rss.class.php"); 
	$rss = new RSS(); 
	echo $rss->GetFeed($_GET["id"]); 
?>