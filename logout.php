<?php
require_once ('dbconnect_asciiarena.php');
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "https://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<title>ASCIIARENA brought to you by UP ROUGH SOUNDSYSTEM</title>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> 
		<meta name="viewport" content="width=device-width">
		<link rel='stylesheet' href='style.css' type='text/css'>
	</head>
	<body>
		<div style="width: 700px ; margin-left: auto ; margin-right: auto ;">
			<div class="maincontent">

				<?php
				if(isset($_GET['logout']))
				{
					?>
					<br>
					<div class="wrap">

						<div class="content_with_blenk">&nbsp;</div>
						<div class="content">
							<a href="index.php"> <img border='0' src='data/goodbye.png'></a>
						</div>
						<?php

						mysqli_query($dbh, "update users set lastactive='0' where nick='$nick'");

						unset($nick);
						unset($password);
						session_destroy();
						?>
						<meta http-equiv="Refresh" content="10; url=index.php">
						<?php
					}
					?>			
				</div>
			</div>
		</div>
	</body>
</html>

