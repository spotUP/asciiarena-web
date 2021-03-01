<?php
require_once "session.php";
$h1 = "CREWS";
require_once "header.php";

?>
	<?php

//-----------------------------------------------------------------------------
// CREW INFO
//-----------------------------------------------------------------------------

	$showcrew=$_GET['crew'];
	$showcrew=base64_decode($showcrew);

	$sort_criteria=$_GET['sort_by'];


	$ask="select * from crews where name='$showcrew'";
	$result=mysql_query($ask);
	while ($row=mysql_fetch_array($result))
	{
		$show_name=$row['name'];
		$show_www=$row['www'];
		$show_contact=$row['contact'];
		$show_active=$row['active'];
		$show_rating=$row['rating'];	
		$show_acronym=$row['acronym'];	
		$show_rating = round($show_rating, 2);

		?>	
		<div class="headline">
			<?=$show_name?> 
			<?php
			if (isset($show_acronym))
			{
				echo "[$show_acronym]";
			}
			?>
		</div>
		<div class="content_with_blenk"><br></div>

		<?php
		if (!empty($show_www))
		{
			?>
			<div class="content_centered">
				Webpage: <?=$show_www?>
			</div>
			<?php
		}
		if(!empty($how_contact))
		{
			?>
			<div class="content_centered">
				Contact: <?=$show_contact?>
			</div>
			<?php
		}
		if(!empty($how_active))
		{
			?>
			<div class="content_centered">
				Status: <?=$show_active?>
			</div>
			<?php
		}
		?>
		<div class="content_centered">
			Rating:
			<?php
			$ask_crew_rating="SELECT rating from crews where name='$showcrew'";
			$result_crew_rating=mysql_query($ask_crew_rating,$dbh);
			while ($row_crew_rating=mysql_fetch_array($result_crew_rating))
			{
				$crewrating=$row_crew_rating[0];
				$crewrating = round($crewrating, 2);
			}

			if(empty($show_rating))
			{
				$askagain="SELECT COUNT(rating) from comments where crew='$showcrew'";
				$resultagain=mysql_query($askagain,$dbh);
				while ($rowagain=mysql_fetch_array($resultagain))
				{
					$votecount=$rowagain[0];
				}
					$votesleft=(3-$votecount);
				if ($votesleft==1)
				{
					echo "Awaiting $votesleft vote</td></tr>";
				}
				elseif ($votesleft > 1)
				{
					echo "Awaiting $votesleft votes</td></tr>";
				}
			}
			else
			{
				$ask_crew_rating="SELECT COUNT(rating) from comments where crew='$showcrew'";
				$result_crew_rating=mysql_query($ask_crew_rating,$dbh);
				while ($row_crew_rating=mysql_fetch_array($result_crew_rating))
				{
					$votecount=$row_crew_rating[0];
				}
				echo " $crewrating ($votecount votes)</td></tr>";
			}
		?>
		</div>
		<?php
		$ask_members="SELECT COUNT(nick) FROM member_of where crew='$showcrew'";
		$result_members=mysql_query($ask_members,$dbh);
		while ($row_members=mysql_fetch_array($result_members))
		$members=$row_members[0];					

		$ask_rels="SELECT COUNT(filename) FROM crew_of where crew='$showcrew'";
		$result_rels=mysql_query($ask_rels,$dbh);
		while ($row_rels=mysql_fetch_array($result_rels))
		$releases=$row_rels[0];				

		?>
		<div class="content_centered">
			Members: <?=$members?>
		</div>

		<div class="content_centered">
			Releases: <?=$releases?>
		</div>

		<?php
	}
	?>

	<div class="headline">
		Members
	</div>

	<div class="content_with_blenk"><br></div>
	
	<div style="clear: left; float: left; width: 170px; padding-left: 4px; padding-bottom: 2px; padding-top: 2px;"> 
		<yellow>ARTiST</yellow>
	</div>

	<div style="float: left; width: 140px;">	
		<yellow>RATiNG</yellow>
	</div>

	<div style="float: left; width: 350px;">	
		<yellow>RELEASES</yellow>
	</div>
	
	<?php
	$ask="select nick from member_of where crew='$showcrew'";
	$result=mysql_query($ask,$dbh);
	while ($row=mysql_fetch_array($result))
	{
		$crewmember=$row[0];
		
		$ask_memb="SELECT acronym FROM artists WHERE nick='$crewmember'";
		$result_memb=mysql_query($ask_memb,$dbh);
		while ($row_memb=mysql_fetch_array($result_memb))
		{
			$membacronym=$row_memb['acronym'];
			$encoded_crewmember=base64_encode($crewmember);

			?>
			<div style="clear: left; float: left; width: 170px; padding-left: 4px; padding-bottom: 2px; padding-top: 2px;"> 
				<a href="info_artist.php?artist=<?=$encoded_crewmember?>&sort_by=filename" /> <?=$crewmember?> 
				<?php
				if(!empty($membacronym))
				{
				echo "[$membacronym]";
				}
				?>
				</a>
			</div>
		
			<div style="float: left; width: 140px;">	
				<?php
				$ask_artist_rating="SELECT rating FROM artists where nick='$crewmember'";
				$result_artist_rating=mysql_query($ask_artist_rating,$dbh);
				while ($row_artist_rating=mysql_fetch_array($result_artist_rating))
				{
					$artistrating=$row_artist_rating[0];
					$artistrating = round($artistrating, 2);
				}

				if(empty($artistrating))
				{
					$askagain="SELECT COUNT(rating) from comments where artist='$crewmember'";
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
					$askagain="SELECT COUNT(rating) from comments where artist='$crewmember'";
					$resultagain=mysql_query($askagain,$dbh);
					while ($rowagain=mysql_fetch_array($resultagain))
					{
						$votecount=$rowagain[0];
					}
					echo "$artistrating ($votecount votes)";
				}
			?>
			</div>	
			<?php
			$ask_memb_rels="SELECT COUNT(filename) FROM author_of WHERE nick='$crewmember'";
			$result_memb_rels=mysql_query($ask_memb_rels,$dbh);
			while ($row_memb_rels=mysql_fetch_array($result_memb_rels))
			{
				$membrels=$row_memb_rels[0];
			}			
			?>
			<div style="float: left; width: 350px;">	
				<?=$membrels?>
			</div>
			<?					
		}
	}
	?>
	
<!-- ----------------------------------------------------------------------------- -->
<!-- BBSLIST                                                                    -->
<!-- ----------------------------------------------------------------------------- -->

	<?php
	$ask_bbs="select name from bbs_of where crew='$showcrew'";
	$result_bbs=mysql_query($ask_bbs,$dbh);
	while ($row_bbs=mysql_fetch_array($result_bbs))
	{
		$bbscount=$row_bbs[0];
	}
	if(!empty($bbscount))
	{ 
		?>
		<div class="headline">
			Boards	
		</div>

		<div class="content_with_blenk"><br></div>

		<?	
		$ask="select name from bbs_of where crew='$showcrew'";
		$result=mysql_query($ask,$dbh);
		while ($row=mysql_fetch_array($result))
		{
			$bbs_name=$row[0];	
	
			$ask_bbs="select * from bbses where name='$bbs_name'";
			$result_bbs=mysql_query($ask_bbs,$dbh);
			while ($row_bbs=mysql_fetch_array($result_bbs))
			{
				$name=$row_bbs[0];	
				$sysop=$row_bbs[1];	
				$address=$row_bbs[2];	
				$number=$row_bbs[3];

				if (empty($sysop))
				{
					$sysop="Unknown";
				}

				if (empty($address))
				{
					$address="Unknown";
				}

				if (empty($number))
				{
					$number="Unknown";
				}
				
				?>

				<div class="content">	
					<white>Name: </white> <?=$name?> <white>Sysop: </white><?=$sysop?>
				 </div>

				<div class="content">	
				  	<white>Address: </white><?=$address?> <white>Number: </white><?=$number?>
				 </div>
				
				<?php
			}
	
		}
	}

//-----------------------------------------------------------------------------
// LATEST FILE_ID
//-----------------------------------------------------------------------------

	$ask="SELECT a.*, b.nick AS author, c.crew FROM collys AS a INNER JOIN author_of AS b ON a.filename = b.filename INNER JOIN crew_of AS c ON a.filename = c.filename WHERE c.crew = '$showcrew' GROUP BY a.filename ORDER BY a.year DESC, a.month DESC, a.day DESC LIMIT 1";
	$result=mysql_query($ask,$dbh);
	while ($row=mysql_fetch_array($result))
	{
		$crew = $row['crew'];
		$viewtimes = $row['view_counter'];
		$year = $row['year'];
		$filename = $row['filename'];
		$encoded_filename=base64_encode($filename);
		$uploader = $row['uploader'];
		$dirname = explode(".", $filename);
		$dirname = $dirname[0];
		?>

					<div class="maincontent">
						<div class="headline">Latest Release</div>
						<div class="content_with_blenk"><br></div>
						<?php
						if ($row[9] == "file_id.diz.png")
						{
							?>
							<div class="release_file_id">
							<a href="info_release.php?filename=<?=$encoded_filename?>"><img class="centered" border="0" src="collys/file_id.diz.png"></a>
							</div>
							<?php
						}
						else
						{
							?>	
							<div class="release_file_id">
								<a href="info_release.php?filename=<?=$encoded_filename?>"><img class="centered" border="0" src="collys/<?=$dirname?>/<?=$row[9]?>"></a>
								<br>
							</div>
							<?php
						}
						?>
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

						<div class="content_slim_divider"></div>

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

						<div class="content_slim_divider"></div>
				
						<div class="release_div_left">
							Filename:
						</div>

						<div class="release_div_right">
								<a href="info_release.php?filename=<?=$encoded_filename?>"><?=$row['filename']?></a>
						</div>

						<div class="content_slim_divider"></div>

						<div class="release_div_left">
							Size:
						</div>
								
						<div class="release_div_right">
							<?=$row[filesize]?>
						</div>

						<div class="content_slim_divider"></div>

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
							?>
						</div>

						<div class="content_slim_divider"></div>
						
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
						<?php
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

						<div class="content_slim_divider"></div>
														
						<div class="release_div_left">
							Added by:
						</div>
								
						<div class="release_div_right">									
							<a href="members.php?user=<?=$uploader?>"><?=$uploader?></a>
						</div>

						<div class="content_slim_divider"></div>
														
						<div class="release_div_left">
							Viewed:
						</div>

						<div class="release_div_right">
							<?=$viewtimes?> times
						</div>

						<div class="content_slim_divider"></div>
														
						<div class="release_div_left">
							Downloaded:
						</div>
								
						<div class="release_div_right">
							<?php
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
						
						<?php
						}
					?>
					</div>
					</div>
					<?php

	$ask_check="SELECT a.*, b.nick AS author, c.crew FROM collys AS a INNER JOIN author_of AS b ON a.filename = b.filename INNER JOIN crew_of AS c ON a.filename = c.filename WHERE c.crew = '$crew' GROUP BY a.filename ORDER BY $sort_criteria ASC LIMIT 1";
	$result_check=mysql_query($ask_check,$dbh);
	while ($row_check=mysql_fetch_array($result_check))
	{
		if(!empty($row_check['filename']))
		{
			$encoded_crew=base64_encode($crew);
			?>
			<div class="headline">[ All <?=$show_acronym?> Releases ]                
				<yellow>Sort by:</yellow>
				<a class="lightgreen" href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=a.name">Name</a>
				<a class="lightgreen" href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=a.filename">Filename</a>
				<a class="lightgreen" href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=b.nick">Artist</a>
				<a class="lightgreen" href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=a.year, a.month">Release Date</a>
				<a class="lightgreen" href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=a.timestamp">Upload Date</a>
				<a class="lightgreen" href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=a.uploader">Uploader</a>
			</div>

		<div class="content_with_blenk"><br></div>

		<div class="collyname">
			NAME
		</div>
		
		<div class="artist">			
			FiLENAME
		</div>
	
		<div class="artist">
			ARTiST
		</div>
				
		<?php
		$ask="SELECT a.*, b.nick AS author, c.crew FROM collys AS a INNER JOIN author_of AS b ON a.filename = b.filename INNER JOIN crew_of AS c ON a.filename = c.filename WHERE c.crew = '$showcrew' GROUP BY a.filename ORDER BY $sort_criteria ASC";
		$result=mysql_query($ask,$dbh);
		while ($row=mysql_fetch_array($result))
		{
			$author=$row['author'];
			$encoded_author=base64_encode($author);
			$filename=$row['filename'];
			$encoded_filename=base64_encode($row['filename']);
			$name=$row['name'];

			?>
			
			<div class="collyname">
				<a href="info_release.php?filename=<?=$encoded_filename?>"><?=$name?></a>
			</div>

			<div class="artist">			
				<a href="info_release.php?filename=<?=$encoded_filename?>"><?=$filename?></a>
			</div>
			
			<div class="artist">			
				<a href="info_artist.php?artist=<?=$encoded_author?>&sort_by=filename"><?=$author?></a>
			</div>
			<?php
			}
		}
	}
	?>
</div>
</body>
</html>

