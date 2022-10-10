<?php
require_once "session.php";
require_once "tools/text.php";
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
        </div>
		</div>
					<?php
				}
				?>
		    <?php if (is_admin()) { ?>
        <div class="amt-1" >
        <form action="/admin.php#crew" method="post" id="edit-crew">
          <input type="hidden" name="getcrew" value="<?=$showcrew?>">
          <input type="hidden" name="open_edit_crew_field" value="1">
          <input type="submit" class="btn-big amb-1" name="edit_crew" value="Edit">
        </form>
        </div>
        <?php } ?>

  <?php
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
