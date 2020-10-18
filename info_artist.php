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
		<div class="header"><?php include ('header.php'); ?></div>
		<div class="leftsidebar"><?php include ('sidebar.php'); ?></div>
		<div class="maincontent">
		<div class="wrap">
		<?php

//-----------------------------------------------------------------------------
// ARTIST INFO
//-----------------------------------------------------------------------------

		$showartist=mysql_real_escape_string($_GET['artist']); // (secure)
		$showartist=base64_decode($showartist);

		$ask="select * from artists where nick='$showartist'";
		$result=mysql_query($ask);
		while ($row=mysql_fetch_array($result))
		{
			$show_artist=$row['nick'];
			$show_www=$row['www'];
			$show_status=$row['active'];
			$show_crew=$row['crew'];
			$show_country=$row['country'];
			$show_rating=$row['rating'];	

			?>
			<div class="headline">
				Artist Info				
			</div>
			<div class="content_with_blenk">&nbsp;</div>

			<div style="background: #ff000; padding-left: 4px; width: 70px; float: left;">
				Nick:
			</div>

			<div style="padding-left: 4px; width: 620px; float: left;">
				<?=$show_artist?>
			</div>

			<div style="background: #ff000; padding-left: 4px; width: 70px; float: left;">
				Crew(s):
			</div>

			<div style="padding-left: 4px; width: 620px; float: left;">
			<?php
		    $ask_crew="select * from member_of where nick='$show_artist'";
		    $result_crew=mysql_query($ask_crew,$dbh);
		    $artists = array();
		    while ($row_crew=mysql_fetch_array($result_crew)) 
			{
		        if(!array_key_exists($row_crew['nick'], $artists))
				{
		            $artists[$row_crew['nick']] = array();
		        }
		        if(!in_array($row_crew['crew'], $artists[$row_crew['nick']]))
				{
		            $artists[$row_crew['nick']][] = $row_crew['crew'];
		        }
		    }
		    foreach($artists as $artist=>$crews) 
			{
		        $c = 0;
		        foreach($crews as $crew) 
				{
					$encoded_crew=base64_encode($crew);
		            if($c > 0) 
					{
		                if($c == count($crews)-1) 
						{
		                    echo ' &amp; ';
		                } 
						else
						{
		                    echo ', ';
		                }
		            }
		                echo '<a href="info_crew.php?crew='.$encoded_crew.'&sort_by=a.filename">'.$crew.'</a>';
		            $c++;
		        }
				?>
		        </div>
				<?
			}
			if (!empty($show_www))
			{
				?>
				<div style="background: #ff000; padding-left: 4px; width: 70px; float: left;">
					Webpage:
				</div>

				<div style="padding-left: 4px; width: 620px; float: left;">				
					<?=$show_www?>
				</div>
				<?
			}
			if (!empty($show_country))
			{
				?>
				<div style="background: #ff000; padding-left: 4px; width: 70px; float: left;">
					Country:
				</div>

				<div style="padding-left: 4px; width: 620px; float: left;">
					<?=$show_country?>
				</div>
				<? 
			}
			?>
			<div style="padding-left: 4px; width: 70px; float: left;">
				Status:
			</div>

			<div style="padding-left: 4px; width: 620px; float: left;">
				<?=$show_status?>
			</div>
			
			<div style="padding-left: 4px; width: 70px; float: left;">
				Rating:
			</div>

			<div style="padding-left: 4px; width: 620px; float: left;">
			<?
				$ask_artist_rating="SELECT rating FROM artists where nick='$showartist'";
				$result_artist_rating=mysql_query($ask_artist_rating,$dbh);
				while ($row_artist_rating=mysql_fetch_array($result_artist_rating))
				{
					$artistrating=$row_artist_rating[0];
				}

				if(empty($show_rating))
				{
					$askagain="SELECT COUNT(rating) from comments where artist='$showartist'";
					$resultagain=mysql_query($askagain,$dbh);
					while ($rowagain=mysql_fetch_array($resultagain))
					{
						$votecount=$rowagain[0];
					}

					$votesleft=(3-$votecount);
					if ($votesleft==1)
					{
						echo "Awaiting $votesleft vote";
					}
					elseif ($votesleft > 0)
	 				{
						echo "Awaiting $votesleft votes";
					}
				}
				else
				{
					$askagain="SELECT COUNT(rating) from comments where artist='$showartist'";
					$resultagain=mysql_query($askagain,$dbh);
					while ($rowagain=mysql_fetch_array($resultagain))
					{
						$votecount=$rowagain[0];
					}
					echo "$artistrating ($votecount votes)";
				}
				?>
				</div>
				<?
		}

//-----------------------------------------------------------------------------
// LATEST FILE_ID
//-----------------------------------------------------------------------------

$ask="SELECT a.*, b.nick AS author, c.crew FROM collys AS a INNER JOIN author_of AS b ON a.filename = b.filename INNER JOIN crew_of AS c ON a.filename = c.filename WHERE b.nick = '$show_artist' GROUP BY a.filename ORDER BY a.year DESC, a.month DESC, a.day DESC LIMIT 1";
$result=mysql_query($ask,$dbh);
while ($row=mysql_fetch_array($result))
{
	$crew = $row['crew'];
	$viewtimes = $row['view_counter'];
	$year = $row['year'];
	$filename = $row['filename'];
	$encoded_filename = base64_encode($row['filename']);
	$acronym = $row['acronym'];
	$file_id = $row[9];
	$dirname = explode(".", $filename);
	$dirname = $dirname[0];
	?>

					<div class="maincontent">
						<div class="headline">Latest Release</div>
						<div class="content_with_blenk"><br></div>

						<div class="release_file_id">
							<a href="info_release.php?filename=<?=$encoded_filename?>"><img class="centered" border="0" src="collys/<?=$dirname?>/<?=$row[9]?>"></a>
							<br>
						</div>

						<div style="float: right; width: 266px;">
						<div style="float: right; height: 16px; width: 265px;"></div>

						<div class="release_div_left">
							Artist(s):
						</div>

						<div class="release_div_right">
						<?php
							$authors = array();
							$ask_author="select * from author_of where filename='$filename'";
							$result_author=mysql_query($ask_author,$dbh);
							while ($row_author=mysql_fetch_array($result_author)) 
							{
								$authors[]=$row_author[0];
							}

							$c = 0;
							foreach($authors as $author) 
							{
								$encoded_author=base64_encode($author);
								if($c > 0) 
								{
									if($c == count($authors)-1) 
									{
										echo ' &amp; ';
									} 
									else 
									{
										echo ', ';
									}
								}
								echo "<a href=\"info_artist.php?artist=$encoded_author&sort_by=filename\">$author</a>";
								$c++;
							}
						?>
						</div>

						<div class="release_div_left">
							Crew:
						</div>

						<div class="release_div_right">							
							<?php
							$crews = array();
							$ask_crew="select * from crew_of where filename='$filename'";
							$result_crew=mysql_query($ask_crew,$dbh);
							while ($row_crew=mysql_fetch_array($result_crew)) 
							{
								$crews[]=$row_crew[0];
							}

							$c = 0;
							foreach($crews as $crew) 
							{
								$encoded_crew=base64_encode($crew);
								if($c > 0) 
								{
									if($c == count($crews)-1) 
									{
											echo ' <magenta>&amp;</magenta> ';
									} 
									else 
									{
										echo ', ';
									}
								}
								echo "<a href=\"info_crew.php?crew=$encoded_crew&sort_by=a.filename\">$crew</a>";
								$c++;
							}
							?>
						</div>

						<div class="release_div_left">
							Filename:
						</div>

						<div class="release_div_right">
							<a href="collys/<?=$row['filename']?>"><?=$row['filename']?></a>
						</div>

						<div class="release_div_left">
							Size:
						</div>
								
						<div class="release_div_right">
							<?=$row[filesize]?>
						</div>
								
						<div class="release_div_left">
							Released:
						</div>
								
						<div class="release_div_right">
							<?php
							if(!empty($prodday))
							{
								echo "$prodday ";
							}
							if(isset($prodmonth))
							{
								if ($month_list[$prodmonth]!=Unknown)
									echo "$month_list[$prodmonth] ";
							}
							if(!empty($year))
							{
								echo "$year";
							}
							echo "&nbsp;";
							?>
						</div>

						<div class="release_div_left">
							Rating:
						</div>
								
						<?php
						$ask_collyrating="SELECT rating from collys where filename='$filename'";
						$result_collyrating=mysql_query($ask_collyrating,$dbh);
						while ($row_collyrating=mysql_fetch_array($result_collyrating))
						{
							$collyrating=$row_collyrating[0];
						}

						$ask_votes="SELECT COUNT(rating) from comments where filename='$filename'";
						$result_votes=mysql_query($ask_votes,$dbh);
						while ($row_votes=mysql_fetch_array($result_votes))
						{
							$votecount=$row_votes[0];
						}
						?>
						<div class="release_div_right">
						<?
						if(empty($collyrating))
						{
							$askagain="SELECT COUNT(rating) from comments where filename='$filename'";
							$resultagain=mysql_query($askagain,$dbh);
							while ($rowagain=mysql_fetch_array($resultagain))
							{
								$votecount=$rowagain[0];
								$votesleft=(3-$votecount);
							}
							if ($votesleft==1)
							{
								echo "Awaiting $votesleft vote";
							}
								elseif ($votesleft > 1)
								{
									echo "Awaiting $votesleft votes";
								}
							}
							else
							{
								echo "$collyrating ($votecount votes)";
							}
							?>
						</div> 
								
						<div class="release_div_left">
							Added by:
						</div>
								
						<div class="release_div_right">									
							<?=$row[uploader]?>
						</div>
								
						<div class="release_div_left">
							Viewed:
						</div>

						<div class="release_div_right">
							<?=$viewtimes?> times
						</div>
								
						<div class="release_div_left">
							Downloaded:
						</div>
								
						<div class="release_div_right">
							<?
							$ask="SELECT downloads from collys where filename='$filename'";
							$result=mysql_query($ask,$dbh);
							while ($row=mysql_fetch_array($result))
							{
								$downloads=$row[0];
							}
	
							if(empty($downloads))
							{
								echo "0 Times";
							}
							elseif($downloads == 1)
							{
								echo "$downloads Time";
							}
							else
							{
								echo "$downloads Times";
							}
							?>
						</div>
						<?
						}
					?>
					</div>
					</div>
					<?

	$ask="SELECT acronym FROM artists where nick='$artist'";
	$result=mysql_query($ask,$dbh);
	while ($row=mysql_fetch_array($result))
	{
		$acronym=$row[0];
	}	
		$encoded_artist=base64_encode($artist);
	?>

		<div class="headline">[ All <?=$acronym?> Releases ]
		<yellow>Sort by:</yellow>
		<a class="lightgreen" href="info_artist.php?artist=<?=$encoded_artist?>&sort_by=a.name">Name</a>
		<a class="lightgreen" href="info_artist.php?artist=<?=$encoded_artist?>&sort_by=a.filename">Filename</a>
		<a class="lightgreen" href="info_artist.php?artist=<?=$encoded_artist?>&sort_by=a.year, a.month">Release Date</a>
		<a class="lightgreen" href="info_artist.php?artist=<?=$encoded_artist?>&sort_by=a.timestamp">Upload Date</a>
		<a class="lightgreen" href="info_artist.php?artist=<?=$encoded_artist?>&sort_by=a.uploader">Uploader</a>
		</div>

		<div class="content_with_blenk"><br></div>

		<?
		$sort_criteria=$_GET['sort_by'];
		$ask="SELECT a.*, b.nick AS author, c.crew FROM collys AS a INNER JOIN author_of AS b ON a.filename = b.filename INNER JOIN crew_of AS c ON a.filename = c.filename WHERE b.nick = '$showartist' GROUP BY a.filename ORDER BY $sort_criteria";

		$result=mysql_query($ask,$dbh);
		while ($row=mysql_fetch_array($result))
		{
			$author=$row['author'];
			$filename=$row['filename'];
			$encoded_filename=base64_encode($row['filename']);
			$name=$row['name'];
			$crew=$row['crew'];
			$encoded_crew=base64_encode($row['crew']);

			$filename=str_replace("&#39;", "'",$filename);				// replace ' with &#39	
			$filename=myTruncate($filename, 12);						// truncate
			$filename=str_replace("'", "&#39;",$filename);				// replace ' with &#39
			$name=str_replace("&#39;", "'",$name);						// replace ' with &#39	
			$name=myTruncate($name, 35);								// truncate
			$name=str_replace("'", "&#39;",$name);						// replace ' with &#39

			?>

			<div class="artist">			
				<a href="info_release.php?filename=<?=$encoded_filename?>" /><?=$filename?>
			</div>


			<div class="collyname">
				<a href="info_release.php?filename=<?=$encoded_filename?>" /><?=$name?></a>
			</div>
			
			<div class="crew">
				<a href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=a.filename"/> <?=$crew?></a>
			</div>
			<?
		}
		?>
			</div>
		</div>
	</div>
</body>
</html>
