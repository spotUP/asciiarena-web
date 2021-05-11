<?php
require_once "session.php";
$h1 = "cREW dETAiLS";

$crewurl=$_GET['crew'] ?? '';
$crew_available = true;
$result = fetchOne("select name from crews where crewurl=:crewurl", [ 'crewurl' => $crewurl ]);
if (isset($result->name)) {
	$showcrew = $result->name;
} else {
	header("HTTP/1.0 404 Not Found");
	$crew_available = false;
}

$sort_order = (isset($_GET['sort_order'])) ? strtolower($_GET['sort_order']) : "";
switch ($sort_order) {
        case "desc": $sort_order = 'DESC'; $osort_order = 'asc'; break;
        default: $sort_order = 'ASC'; $osort_order = 'desc'; break;
}
$sort_by = $_GET['sort_by'] ?? "";
switch ($sort_by) {
        case "name": $sort_criteria = "w.name"; break;
        case "filename": $sort_criteria = "c.filename"; break;
        case "artist": $sort_criteria = "a.nick"; break;
        case "date": $sort_criteria = "c.year, c.month"; break;
        default:
                $sort_criteria = "w.name";
                $sort_by = "name";
                break;
}
$sort_criteria .= ' '.$sort_order;

include "header.php";
?>

<div class="modal-body row m-0 p-0">
  <div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include "sidebar.php"; ?>
	</div>
	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include "sidebar_right.php"; ?>
	</div>
  
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">

		<?php

//-----------------------------------------------------------------------------
// CREW INFO
//-----------------------------------------------------------------------------

	if ($crew_available) {

		//$sort_criteria=$_GET['sort_by'] ?? 'a.name';
		//$sort_criteria=preg_replace('[^a-z.]','', $sort_criteria);
		//if ($sort_criteria === 'a.name') $sort_criteria = 'w.name';

		$ask="select * from crews where crewurl=:crewurl";
		$result=fetchAll($ask, [ 'crewurl' => $crewurl ]);
		foreach($result as $row)
		{
			$show_name=$row->name;
			$showcrew=$row->name;
			$show_www=$row->www;
			$show_contact=$row->contact;
			$show_active=$row->active;
			$show_rating=$row->rating;	
			$show_acronym=$row->acronym;	
			$show_rating = sprintf("%0.2d", $row->rating);

			?>	


			<div class="row apb-1">
				<div class="col-12">
					<h2 class="ap-1 bg-header"><?=$show_name?>
					<?php
					if (isset($show_acronym))
					{
						echo "[$show_acronym]";
					}
					?></h2>											
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
						$crewrating = sprintf("%0.2f", $row_crew_rating->rating);
					}

					if(empty($show_rating))
					{
						$askagain="SELECT COUNT(rating) as cnt from comments where crew=:showcrew";
						$resultagain=fetchAll($askagain, [ 'showcrew' => $showcrew ]);
						foreach($resultagain as $rowagain)
						{
							$votecount=$rowagain->cnt;
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

					$ask_rels="SELECT COUNT(colly_id) as count FROM collys_crews WHERE crew_id = (SELECT id FROM crews WHERE name=:showcrew)";
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
				<h2 class="ap-1 bg-header">MEMBERS</h2>											
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

				?>
				<div class="row">
					<div class="col-4">
						<a href="/artist/<?=urlsafe($crewmember)?>" /> <?=$crewmember?> 
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
					$artistrating = sprintf("%0.2f", $row_artist_rating->rating);
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
				$ask_memb_rels="SELECT COUNT(colly_id) as count FROM artists_collys WHERE artist_id = (SELECT id FROM artists WHERE nick=:crewmember)";
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
					<h2 class="ap-1 bg-header">Boards</h2>											
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

		$ask="SELECT c.*,a.nick,w.name as crew FROM collys c
			  LEFT JOIN artists_collys ac ON c.id=ac.colly_id
			  LEFT JOIN artists a ON ac.artist_id=a.id
			  LEFT JOIN collys_crews cc ON cc.colly_id=c.id
			  LEFT JOIN crews w ON cc.crew_id=w.id
			  WHERE c.id in (SELECT colly_id FROM collys_crews WHERE crew_id IN (SELECT id FROM crews WHERE name=:showcrew))
			  GROUP BY c.filename ORDER BY c.year DESC, c.month DESC, c.day LIMIT 1";
		$result=fetchAll($ask, [ 'showcrew' => $showcrew ]);
		foreach($result as $row)
		{
			$crew = $row->crew;
			$viewtimes = $row->view_counter;
			$year = $row->year;
			$filename = $row->filename;
			$uploader = $row->uploader;
			$dirname = explode(".", $filename);
			$dirname = $dirname[0];

			$file_id = "collections/" . $dirname . "/" . $filename . ".diz";
			if (file_exists($file_id)) 
			{
				$file_id = utf8_encode(file_get_contents($file_id));
			}
			else
				$file_id = utf8_encode(file_get_contents("collections/file_id.diz.txt"));	
			?>

			<div class="row apb-1 apt-1">
				<div class="col-12">
					<h2 class="ap-1 bg-header">LATEST RELEASE</h2>											
				</div>
			</div>

			<div class="row apr-1">
				<div class="col-8">
					<?php
					?>	
					<a class="ascii magenta" href="/release/<?=$filename?>"><pre class="magenta"><?=$file_id?></pre></a>
					<?php
					?>
				</div>
				<div class="col-4">
					<div class="row d-flex justify-content-between">
						Artist(s):
						<?php
						$authors = [];
						foreach(fetchAll("SELECT a.nick FROM collys c LEFT JOIN artists_collys ac ON ac.colly_id=c.id LEFT JOIN artists a ON a.id=ac.artist_id 
                                                                WHERE c.filename=:filename GROUP BY ac.artist_id", [ ':filename' => $filename ]) as $author) {
							$authors[] = "<a href=\"/artist/".urlsafe($author->nick)."\">{$author->nick}</a>";
						}
						echo pluralize($authors, '<span class="magenta"> & </span>');
						?>
					</div>
					<div class="row d-flex justify-content-between">
						Crew(s):
						<?php
							$crews = [];
							foreach(fetchAll("SELECT w.name as crew FROM collys c LEFT JOIN collys_crews cc ON cc.colly_id=c.id LEFT JOIN crews w ON w.id=cc.crew_id 
                                                                WHERE c.filename=:filename GROUP BY cc.crew_id", [ ':filename' => $filename ]) as $crew) {
								$crews[] = "<a href=\"/crew/".urlsafe($crew->crew)."/\">{$crew->crew}</a>";
							}
							echo pluralize($crews, '<span class="magenta"> & </span>');
						?>
					</div>
					<div class="row d-flex justify-content-between">
						Filename:

						<a href="/release/<?=$filename?>"><?=mb_strimwidth($row->filename, 0, 12);?></a>
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

						<a href="/member/<?=urlsafe($uploader)?>"><?=$uploader?></a>
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
		$ask_check = "SELECT count(c.filename) as files FROM collys c 
			WHERE c.id in (SELECT colly_id FROM collys_crews WHERE crew_id IN (SELECT id FROM crews WHERE name=:crew))";
		$result_check = fetchOne($ask_check, [ 'crew' => $showcrew ]);
		if($result_check->files > 0)
		{
			?>
			<h2 class="amb-1 amt-1 ap-1 bg-header">ALL <?=$show_acronym?> RELEASES</h2>
			<div class="row amt-1 amb-1">
				<div class="col-6">
					<a class="white" href="/crew/<?=urlsafe($showcrew)?>/?sort_by=name&sort_order=<?=$osort_order?>">NAME</a>
				</div>
				<div class="col-2">
					<a class="white" href="/crew/<?=urlsafe($showcrew)?>/?sort_by=filename&sort_order=<?=$osort_order?>">FiLENAME</a>
				</div>
				<div class="col-2">
					<a class="white" href="/crew/<?=urlsafe($showcrew)?>/?sort_by=artist&sort_order=<?=$osort_order?>">ARTiST</a>
				</div>
				<div class="col-2">
					<a href="/crew/<?=urlsafe($showcrew)?>/?sort_by=date&sort_order=<?=$osort_order?>">DATE</a>
				</div>
			</div>
			<?php
			$ask = "SELECT c.*,a.nick,w.name, 
				GROUP_CONCAT(a.nick) as author
				FROM collys c
  				LEFT JOIN artists_collys ac ON c.id=ac.colly_id
  				LEFT JOIN artists a ON ac.artist_id=a.id
  				LEFT JOIN collys_crews cc ON cc.colly_id=c.id
  				LEFT JOIN crews w ON cc.crew_id=w.id
  				WHERE c.id in (SELECT colly_id FROM collys_crews WHERE crew_id IN (SELECT id FROM crews WHERE name=:crew))
  				GROUP BY c.filename ORDER BY $sort_criteria";
			$result=fetchAll($ask, [ 'crew' => $showcrew ]);
			foreach($result as $row)
				{
				$author=$row->author;
				$filename=$row->filename;
				$name=$row->name;
				$year=$row->year;
				?>
				<div class="row">
					<div class="col-6 text-truncate">
						<a class="magenta" href="/release/<?=$filename?>"><?=$row->name?></a>
					</div>
					<div class="col-2 text-truncate">
						<a class="magenta" href="/release/<?=$filename?>"><?=$row->filename?></a>
					</div>

					<div class="col-2 text-truncate">
						<a class="green" href="/artist/<?=urlsafe($author)?>"><?=$author?></a>
					</div>

					<div class="col-2 text-truncate">
						<span class="lightgrey" href="/artist/<?=urlsafe($author)?>"><?php if (!empty($year)) { echo $year; }?></span>
					</div>

				</div>
				<?php
			}
		}
	} else {
			        ?>
                                <div class="row">
                                        <div class="col-lg-12">
                                                <div class="bs-component aml-1 amb-1">
                                                        <div class="alert alert-danger">
                                                                crew not found
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                                <?php
	}
		?>

	</div>
	
</div>
<?php include "footer.php"; ?>
