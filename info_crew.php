<?php
require_once "session.php";
$h1 = ["cREW dETAiLS", "bY uP rOUGH and diViNE sTYLERS"];
include "header.php";

?>

<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">

		<?php

//-----------------------------------------------------------------------------
// CREW INFO
//-----------------------------------------------------------------------------

		$showcrew=$_GET['crew'] ?? '';
		$showcrew=base64_decode($showcrew);

		$sort_criteria=$_GET['sort_by'] ?? 'a.name';
		$sort_criteria=preg_replace('[^a-z.]','', $sort_criteria);

		$ask="select * from crews where name=:showcrew";
		$result=fetchAll($ask, [ 'showcrew' => $showcrew ]);
		foreach($result as $row)
		{
			$show_name=$row->name;
			$show_www=$row->www;
			$show_contact=$row->contact;
			$show_active=$row->active;
			$show_rating=$row->rating;	
			$show_acronym=$row->acronym;	
			$show_rating = round($show_rating, 2);

			?>	


			<div class="row apb-1">
				<div class="col-12">
					<h2 class="ap-1"><?=$show_name?>
					<?php
					if (isset($show_acronym))
					{
						echo "[$show_acronym]";
					}
					?></h1>											
				</div>
			</div>

			<div class="row apb-1">
				<div class="col-6">
					<?php

					if (!empty($show_www))
					{
						?>
						Webpage: <a href="<?=$show_www?>"><?=$show_www?></a>
						<?php
					}
					?>
				</div>
			</div>

			<div class="row">
				<div class="col-6">
					<?php
					if(!empty($how_contact))
					{
						?>
						Contact: <?=$show_contact?>
						<?php
					}
					if(!empty($how_active))
					{
						?>
						Status: <?=$show_active?>
						<?php
					}
					?>
				</div>
			</div>
			<div class="row">
				<div class="col-4">
					Rating:
					<?php
					$ask_crew_rating="SELECT rating from crews where name=:showcrew";
					$result_crew_rating=fetchAll($ask_crew_rating, [ 'showcrew' => $showcrew ] );
					foreach($result_crew_rating as $row_crew_rating)
					{
						$crewrating=$row_crew_rating->rating;
						$crewrating = round($crewrating, 2);
					}

					if(empty($show_rating))
					{
						$askagain="SELECT COUNT(rating) from comments where crew=:showcrew";
						$resultagain=fetchAll($askagain, [ 'showcrew' => $showcrew ]);
						foreach($resultagain as $rowagain)
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
						$ask_crew_rating="SELECT COUNT(rating) AS count from comments where crew=:showcrew";
						$result_crew_rating=fetchAll($ask_crew_rating, [ 'showcrew' => $showcrew ]);
						foreach($result_crew_rating as $row_crew_rating)
						{
							$votecount=$row_crew_rating->count;
						}
						echo " $crewrating ($votecount votes)</td></tr>";
					}
					?>
				</div>
				<div class="col-4">
					<?php
					$ask_members="SELECT COUNT(nick) AS count FROM member_of where crew=:showcrew";
					$result_members=fetchAll($ask_members, [ 'showcrew' => $showcrew ]);
					foreach($result_members as $row_members)
						$members=$row_members->count;					

					$ask_rels="SELECT COUNT(filename) AS count FROM crew_of where crew=:showcrew";
					$result_rels=fetchAll($ask_rels, [ 'showcrew' => $showcrew ]);
					foreach($result_rels as $row_rels)
						$releases=$row_rels->count;				

					?>
					Members: <?=$members?>
				</div>
				<div class="col-4">
					Releases: <?=$releases?>
					<?php
				}
				?>
			</div>
		</div>
		<div class="row apb-1 apt-1">
			<div class="col-12">
				<h2 class="ap-1">Members</h2>											
			</div>
		</div>

		<div class="row apb-1">
			<div class="col-4">
				<yellow>ARTiST</yellow>
			</div>
			<div class="col-4">
				<yellow>RATiNG</yellow>
			</div>
			<div class="col-4">

				<yellow>RELEASES</yellow>
			</div>
		</div>

		<?php
		$ask="select nick from member_of where crew=:showcrew";
		$result=fetchAll($ask, [ 'showcrew' => $showcrew ]);
		foreach($result as $row)
		{
			$crewmember=$row->nick;

			$ask_memb="SELECT acronym FROM artists WHERE nick=:crewmember";
			$result_memb=fetchAll($ask_memb, [ 'crewmember' => $crewmember ]);
			foreach($result_memb as $row_memb)
			{
				$membacronym=$row_memb->acronym;
				$encoded_crewmember=base64_encode($crewmember);

				?>
				<div class="row">
					<div class="col-4">
						<a href="info_artist.php?artist=<?=$encoded_crewmember?>&sort_by=filename" /> <?=$crewmember?> 
						<?php
						if(!empty($membacronym))
						{
							echo "[$membacronym]";
						}
						?>
					</a>
				</div>
				<?php
				$ask_artist_rating="SELECT rating FROM artists where nick=:crewmember";
				$result_artist_rating=fetchAll($ask_artist_rating, [ 'crewmember' => $crewmember ]);
				foreach($result_artist_rating as $row_artist_rating)
				{
					$artistrating=$row_artist_rating->rating;
					$artistrating = round($artistrating, 2);
				}

				if(empty($artistrating))
				{
					$askagain="SELECT COUNT(rating) AS count from comments where artist=:crewmember";
					$resultagain=fetchAll($askagain, [ 'crewmember' => $crewmember ]);
					foreach($resultagain as $rowagain)
					{
						$votecount=$rowagain->count;
					}

					$votesleft=(3-$votecount);
					if ($votesleft==1)
					{
						echo "<div class=\"col-4\">Awaiting $votesleft vote</div>";
					}
					elseif ($votesleft > 0)
					{
						echo "<div class=\"col-4\">Awaiting $votesleft votes</div>";
					}
				}
				else
				{
					$askagain="SELECT COUNT(rating) AS count from comments where artist=:crewmember";
					$resultagain=fetchAll($askagain, [ 'crewmember' => $crewmember ]);
					foreach($resultagain as $rowagain)
					{
						$votecount=$rowagain->count;
					}

					echo "<div class=\"col-4\">$artistrating ($votecount votes)</div>";
				}
				?>
				<?php
				$ask_memb_rels="SELECT COUNT(filename) AS count FROM author_of WHERE nick=:crewmember";
				$result_memb_rels=fetchAll($ask_memb_rels, [ 'crewmember' => $crewmember ]);
				foreach($result_memb_rels as $row_memb_rels)
				{
					$membrels=$row_memb_rels->count;
				}			
				echo "<div class=\"col-4\">$membrels</div></div>";
			}
		}
		?>

		<!-- ----------------------------------------------------------------------------- -->
		<!-- BBSLIST                                                                    -->
		<!-- ----------------------------------------------------------------------------- -->

		<?php
		$ask_bbs="select name from bbs_of where crew=:showcrew";
		$result_bbs=fetchAll($ask_bbs, [ 'showcrew' => $showcrew ]);
		foreach($result_bbs as $row_bbs)
		{
			$bbscount=$row_bbs->name;
		}
		if(!empty($bbscount))
		{ 
			?>

			<div class="row apt-1">
				<div class="col-12">
					<h2 class="ap-1">Boards</h2>											
				</div>
			</div>
			<?php
			$ask="select name from bbs_of where crew=:showcrew";
			$result=fetchAll($ask, [ 'showcrew' => $showcrew ]);
			foreach($result as $row)
			{
				$bbs_name=$row->name;
				$ask_bbs="select * from bbses where name=:bbs_name";
				$result_bbs=fetchAll($ask_bbs, [ 'bbs_name' => $bbs_name ]);
				foreach($result_bbs as $row_bbs)
				{
					$name=$row_bbs->name;
					$sysop=$row_bbs->sysop;
					$address=$row_bbs->address;
					$number=$row_bbs->number;
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
					<div class="row apt-1">
						<div class="col-4">
							<span class="white">Name: </span><?=$name?>
						</div>
						<div class="col-4">
							<span class="white">Sysop: </span><?=$sysop?>
						</div>
						<div class="col-4">
							<span class="white">Online: </span>Dummy
						</div>
					</div>
					<div class="row">
						<div class="col-4">
							<span class="white">Address: </span><?=$address?> 
						</div>

						<div class="col-4">
							<span class="white">Number: </span><?=$number?>
						</div>
						<div class="col-4">
							<span class="white">Country: </span>Dummy
						</div>
					</div>
					<?php
				}

			}
		}

//-----------------------------------------------------------------------------
// LATEST RELEASE
//-----------------------------------------------------------------------------

		$ask="SELECT a.*, b.nick AS author, c.crew FROM collys AS a INNER JOIN author_of AS b ON a.filename = b.filename INNER JOIN crew_of AS c ON a.filename = c.filename WHERE c.crew = :showcrew GROUP BY a.filename ORDER BY a.year DESC, a.month DESC, a.day DESC LIMIT 1";
		$result=fetchAll($ask, [ 'showcrew' => $showcrew ]);
		foreach($result as $row)
		{
			$crew = $row->crew;
			$viewtimes = $row->view_counter;
			$year = $row->year;
			$filename = $row->filename;
			$encoded_filename=base64_encode($filename);
			$uploader = $row->uploader;
			$dirname = explode(".", $filename);
			$dirname = $dirname[0];
			?>

			<div class="row apb-1 apt-1">
				<div class="col-12">
					<h2 class="ap-1">Latest Release</h2>											
				</div>
			</div>

			<div class="row">
				<div class="col-8">

					<?php
					if ($filename == "file_id.diz.png")
					{
						?>
						<a href="info_release.php?filename=<?=$encoded_filename?>"><img class="centered" border="0" src="collys/file_id.diz.png"></a>
						<?php
					}
					else
					{
						?>	
						<a href="info_release.php?filename=<?=$encoded_filename?>"><img class="centered" border="0" src="collys/<?=$dirname?>/<?=$filename?>"></a>
						<?php
					}
					?>
				</div>
				<div class="col-4">
					<div class="row d-flex justify-content-between">

						Artist(s):

						<?php
						$authors = array();
						$ask_author="select * from author_of where filename=:filename";
						$result_author=fetchAll($ask_author, [ 'filename' => $filename ]);
						foreach($result_author as $row_author) 
						{
							$authors[]=$row_author->id;
						}

						$c = 0;
						foreach($authors as $author) 
						{
							$encoded_author=base64_encode($author);
							if($c > 0) 
							{
								if($c == count($authors)-1) 
								{
									echo ' <span class="magenta"> &amp; </span>';
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
					<div class="row d-flex justify-content-between">
						Crew:

						<?php
						$crews = array();
						$ask_crew="select * from crew_of where filename=:filename";
						$result_crew=fetchAll($ask_crew, [ 'filename' => $filename ]);
						foreach($result_crew as $row_crew) 
						{
							$crews[]=$row_crew->id;
						}

						$c = 0;
						foreach($crews as $crew) 
						{
							$encoded_crew=base64_encode($crew);
							if($c > 0) 
							{
								if($c == count($crews)-1) 
								{
									echo ' <span class="magenta">&amp;</span> ';
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
					<div class="row d-flex justify-content-between">
						Filename:

						<a href="info_release.php?filename=<?=$encoded_filename?>"><?=mb_strimwidth($row->filename, 0, 12);?></a>
					</div>
					<div class="row d-flex justify-content-between">	
						<span>Size:</span>
						<?=$row->filesize?>
					</div>
					<div class="row d-flex justify-content-between">
						<span>Released:</span>
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
					<div class="row d-flex justify-content-between">
						<span>Rating:</span>

						<?php
						$ask_collyrating="SELECT rating from collys where filename=:filename";
						$result_collyrating=fetchAll($ask_collyrating, [ 'filename' => $filename ]);
						foreach($result_collyrating as $row_collyrating)
						{
							$collyrating=$row_collyrating->rating;
						}

						$ask_votes="SELECT COUNT(rating) AS count from comments where filename=:filename";
						$result_votes=fetchAll($ask_votes, [ 'filename' => $filename ]);
						foreach($result_votes as $row_votes)
						{
							$votecount=$row_votes->count;
						}
						?>
						<?php
						if(empty($collyrating))
						{
							$askagain="SELECT COUNT(rating) AS count from comments where filename=:filename";
							$resultagain=fetchAll($askagain, [ 'filename' => $filename ]);
							foreach($resultagain as $rowagain)
							{
								$votecount=$rowagain->count;
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
					<div class="row d-flex justify-content-between">
						<span>Added by:</span>

						<a href="members.php?user=<?=$uploader?>"><?=$uploader?></a>
					</div>

					<div class="row d-flex justify-content-between">
						<span>Viewed:</span>
						<?=$viewtimes?> times
					</div>
					<div class="row d-flex justify-content-between">
						<span>Downloaded:</span>
						<?php
						$ask="SELECT downloads from collys where filename=:filename";
						$result=fetchAll($ask, [ 'filename' => $filename ]);
						foreach($result as $row)
						{
							$downloads=$row->downloads;
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

		$ask_check="SELECT a.*, b.nick AS author, c.crew FROM collys AS a INNER JOIN author_of AS b ON a.filename = b.filename INNER JOIN crew_of AS c ON a.filename = c.filename WHERE c.crew = :crew GROUP BY a.filename ORDER BY $sort_criteria ASC LIMIT 1";
		$result_check=fetchAll($ask_check, [ 'crew' => $showcrew ]);
		foreach($result_check as $row_check)
		{
			if(!empty($row_check->filename))
			{
				$encoded_crew=base64_encode($showcrew);
				?>
				<h2 class="amb-1 amt-1 ap-1">All <?=$show_acronym?> Releases</h2>            
				<span class="yellow">Sort by:</span>
				<a href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=a.name">Name</a>
				<a href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=a.filename">Filename</a>
				<a href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=b.nick">Artist</a>
				<a href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=a.year, a.month">Release Date</a>
				<a href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=a.timestamp">Upload Date</a>
				<a href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=a.uploader">Uploader</a>

				<div class="row amt-1 amb-1">
					<div class="col-4">
						NAME
					</div>
					<div class="col-4">
						FiLENAME
					</div>
					<div class="col-4">
						ARTiST
					</div>
				</div>
				<?php
				$ask="SELECT a.*, b.nick AS author, c.crew FROM collys AS a INNER JOIN author_of AS b ON a.filename = b.filename INNER JOIN crew_of AS c ON a.filename = c.filename WHERE c.crew = :showcrew GROUP BY a.filename ORDER BY $sort_criteria ASC";
				$result=fetchAll($ask, [ 'showcrew' => $showcrew ]);
				foreach($result as $row)
				{
					$author=$row->author;
					$encoded_author=base64_encode($author);
					$filename=$row->filename;
					$encoded_filename=base64_encode($row->filename);
					$name=$row->name;

					?>
					<div class="row">
						<div class="col-4">
							<a href="info_release.php?filename=<?=$encoded_filename?>"><?=$name?></a>
						</div>

						<div class="col-4">

							<a href="info_release.php?filename=<?=$encoded_filename?>"><?=$filename?></a>
						</div>

						<div class="col-4">

							<a href="info_artist.php?artist=<?=$encoded_author?>&sort_by=filename"><?=$author?></a>
						</div>
					</div>

					<?php
				}
			}
		}
		?>

	</div>
	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>
</div>
<?php include "footer.php"; ?>
