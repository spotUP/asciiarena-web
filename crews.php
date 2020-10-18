<? require_once ('dbconnect_asciiarena.php'); ?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "https://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<title>ASCIIARENA brought to you by UP ROUGH SOUNDSYSTEM</title>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> 
		<link rel='stylesheet' href='style.css' type='text/css'>
		<meta name="viewport" content="width=device-width">
	</head>
	<body>
		<div class="maincontainer">
			<div class="header"><?include ('header.php');?></div>
			<div class="leftsidebar"><?include ('sidebar.php');?></div>
			<div class="maincontent">
			<div class='wrap'>
			<div class='headline'>
				Crews
			</div>
			<?php

//-----------------------------------------------------------------------------
// PAGINATION DB QUERY
//-----------------------------------------------------------------------------

			if (isset($_GET['pageno']))
			{
			   $pageno = $_GET['pageno'];
			} 
			else 
			{
			   $pageno = 1;
			}

			$query= "SELECT COUNT(name) from crews ORDER BY name ASC";
			$result = mysql_query($query, $dbh) or trigger_error("SQL", E_USER_ERROR);
			$query_data = mysql_fetch_row($result);
			$numrows = $query_data[0];

			$rows_per_page = 150;
			$lastpage      = ceil($numrows/$rows_per_page);

			$pageno = (int)$pageno;
			if ($pageno > $lastpage)
			{
			   $pageno = $lastpage;
			}
			if ($pageno < 1)
			{
			   $pageno = 1;
			}

			$limit = 'LIMIT ' .($pageno - 1) * $rows_per_page .',' .$rows_per_page;
		    $ask="SELECT name from crews ORDER BY name ASC $limit";
			$result = mysql_query($query, $dbh) or trigger_error("SQL", E_USER_ERROR);
			// end pagination DB query

//-----------------------------------------------------------------------------
// PAGINATION NAV BAR
//-----------------------------------------------------------------------------
			?>
		 	<div class='pagination'>
			<?
			if ($pageno == 1) 			
			{                   		
			}
			else
			{	
				echo "<a href='{$_SERVER['PHP_SELF']}?pageno=1'>FIRST</a> ";
				$prevpage = $pageno-1;
				echo " <a href='{$_SERVER['PHP_SELF']}?pageno=$prevpage'>PREV</a> ";
			}
			echo " ( Page $pageno of $lastpage ) "; 	
			if ($pageno == $lastpage) 					
			{
			}
			else
			{
				$nextpage = $pageno+1;
				echo " <a href='{$_SERVER['PHP_SELF']}?pageno=$nextpage'>NEXT</a> ";
				echo " <a href='{$_SERVER['PHP_SELF']}?pageno=$lastpage'>LAST</a>";	
			}
			?>
			</div>

			<div class="collys_search">
				<form enctype="multipart/form-data" action="crews.php" method="post">
					Search for: <input type="text" name="search">
				</form>	
			</div>	
			<?

//-----------------------------------------------------------
// SHOW CREWS
//-----------------------------------------------------------
		?>

			<div class="content"></div>

			<div style=" float: left ; width: 350px; padding-left: 4px; padding-bottom: 2px; padding-top: 2px;">
				<yellow>CREW</yellow>
			</div>

			<div class="artist">
				<yellow>MEMBERS</yellow>
			</div>

			<div style=" float: left ; width: 200px; padding-left: 4px; padding-bottom: 2px; padding-top: 2px;">
				<yellow>RELEASES</yellow>
			</div>
			
				<?php
				if (!isset($_POST['search'])) 
				{
					$ask="SELECT name,acronym FROM crews ORDER BY name $limit";
				}
				if (isset($_POST['search'])) 
				{		
					$searchquery=$_POST['search'];
					$searchquery=str_replace(" ",",",$searchquery);
					$ask="SELECT name,acronym from crews where match(name) against ('$searchquery' in boolean mode) ORDER BY name $limit";
				}
				$result=mysql_query($ask,$dbh);
				while ($row=mysql_fetch_array($result))
				{
					$crew=$row[0];
					$encoded_crew=base64_encode($crew);
					$acronym=$row[1];

					$ask_members="SELECT COUNT(nick) FROM member_of where crew='$crew'";
					$result_members=mysql_query($ask_members,$dbh);
					while ($row_members=mysql_fetch_array($result_members))
					$members=$row_members[0];					

					$ask_rels="SELECT COUNT(filename) FROM crew_of where crew='$crew'";
					$result_rels=mysql_query($ask_rels,$dbh);
					while ($row_rels=mysql_fetch_array($result_rels))
					$releases=$row_rels[0];				

					?>
					<div style=" float: left ; width: 350px; padding-left: 4px; padding-bottom: 2px; padding-top: 2px;">
					<?
					echo "<a href=\"info_crew.php?crew=$encoded_crew&sort_by=a.filename\">$crew</a>";
					if (!empty($acronym))
						echo " ($acronym)";
					?></div>

					<div class="artist"><?
					echo "$members";
					?></div>

					<div style=" float: left ; width: 200px; padding-left: 4px; padding-bottom: 2px; padding-top: 2px;">
					<?
					echo "$releases"; ?>
					</div> <?
				}
				
//-----------------------------------------------------------------------------
// PAGINATION NAV BAR
//-----------------------------------------------------------------------------
			?>
		 	<div class='pagination'>
			<?
			if ($pageno == 1) 			
			{                   		
			}
			else
			{	
				echo "<a href='{$_SERVER['PHP_SELF']}?pageno=1'>FIRST</a> ";
				$prevpage = $pageno-1;
				echo " <a href='{$_SERVER['PHP_SELF']}?pageno=$prevpage'>PREV</a> ";
			}
			echo " ( Page $pageno of $lastpage ) "; 	
			if ($pageno == $lastpage) 					
			{
			}
			else
			{
				$nextpage = $pageno+1;
				echo " <a href='{$_SERVER['PHP_SELF']}?pageno=$nextpage'>NEXT</a> ";
				echo " <a href='{$_SERVER['PHP_SELF']}?pageno=$lastpage'>LAST</a>";	
			}
			?>
			</div>

			<div class="collys_search">
				<form enctype="multipart/form-data" action="crews.php" method="post">
					Search for: <input type="text" name="search">
				</form>	
			</div>	
			</div>
			</div>
		</div>
	</body>
</html>
