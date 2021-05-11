<?php
require_once "session.php";
$h1 = "aRTIST iNFO";

$artist_available = true;
$artisturl = $_GET['artist'];
$result = fetchOne("select nick from artists where artisturl=:artisturl", [ 'artisturl' => $artisturl ]);
if (isset($result->nick)) {
	$showartist = $result->nick;
} else {
	header("HTTP/1.0 404 Not Found");
	$artist_available = false;
}


include "header.php";
//-----------------------------------------------------------------------------
// ARTIST INFO
//-----------------------------------------------------------------------------
?>
<div class="modal-body row m-0 p-0">
  <div class="col-lg-8 order-md-1 order-lg-2 order-xl-2">
    <?php
if ($artist_available) {

    $validSorts = array(
      'c.filename' => 'Filename',
      'a.nick' => 'Name',
      'w.name' => 'Crew',
      'c.year, c.month' => 'Release Date'
    );

    $q = "select * from artists where nick=:nick";
    $p = [":nick" => $showartist];
    foreach (fetchAll($q, $p) as $row) {
      $row = get_object_vars($row);
      $show_artist=$row['nick'];
      $show_www=$row['www'];
      $show_status=$row['active'];
      $show_country=$row['country'];
      $show_rating=$row['rating'];  

      ?>
      <div class="row apb-1">
        <div class="header col-lg-12">
          <h2 class="ap-1 bg-header"><?=$show_artist?></h2>
        </div>
      </div>
      <div class="col-lg-12 pl-0">
        Nick: <?=$show_artist?>
      </div>
      <div class="col-lg-12 pl-0">
        Crew(s):
        <?php
        $q = "select * from member_of where nick=:nick";
        $p = [":nick" => $show_artist];
        $artists = array();

        foreach (fetchAll($q, $p) as $row_crew) {
          $row_crew = get_object_vars($row_crew);
          if(!array_key_exists($row_crew['nick'], $artists))
          {
            $artists[$row_crew['nick']] = array();
          }
          if(!in_array($row_crew['crew'], $artists[$row_crew['nick']]))
          {
            $artists[$row_crew['nick']][] = $row_crew['crew'];
          }
        }
        foreach($artists as $showartist=>$crews) {
          $c = 0;
          foreach($crews as $crew) {
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
          echo '<a href="/crew/'.urlsafe($crew).'">'.$crew.'</a>';
          $c++;
        }
      }
      ?>
    </div>
    <?php

    if (!empty($show_www))
    {
      ?>
      <div class="col-lg-12 pl-0">
        Webpage: <?=$show_www?>
      </div>
      <?php
    }
    if (!empty($show_country))
    {
      ?>
      <div class="col-lg-12 pl-0">
        Country: <?=$show_country?>
      </div>
      <?php
    }
    ?>
    <div class="col-lg-12 pl-0">
      Status: <?=$show_status?>
    </div>
    <div class="col-lg-12 pl-0">
      Rating:

      <?php
      $q = "SELECT rating FROM artists where nick=:nick";
      $p = [":nick" => $showartist];
      $result_artist_rating = fetchOne($q, $p);
      $artistrating = $result_artist_rating->rating;

      $q = "SELECT COUNT(rating) AS cnt from comments where artist=:nick";
      $p = [":nick" => $showartist];
      $result_again = fetchOne($q, $p);
      $votecount = $result_again->cnt;

      if(empty($show_rating))
      {
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
     echo "$artistrating ($votecount votes)";
   }
   ?>
 </div>

 <?php
}

//-----------------------------------------------------------------------------
// LATEST FILE_ID
//-----------------------------------------------------------------------------
$q = "  SELECT c.*,a.nick,w.name FROM collys c
	    LEFT JOIN artists_collys ac ON c.id=ac.colly_id
	    LEFT JOIN artists a ON ac.artist_id=a.id
	    LEFT JOIN collys_crews cc ON cc.colly_id=c.id
            LEFT JOIN crews w ON cc.crew_id=w.id
	    WHERE a.id in (SELECT artist_id FROM artists_collys WHERE artist_id IN (SELECT id FROM artists WHERE nick=:nick))
            GROUP BY c.filename ORDER BY c.year DESC, c.month DESC, c.day LIMIT 1";
$p = [":nick" => $show_artist];
foreach (fetchAll($q, $p) as $row) {
  $row = get_object_vars($row);

  $crew = $row['crew'];
  $viewtimes = $row['view_counter'];
  $year = $row['year'];
  $filename = $row['filename'];
  $encoded_filename = base64_encode($row['filename']);
  $dirname = explode(".", $filename);
  $dirname = $dirname[0];
  ?>

  <div class="maincontent">
    <div class="row apt-1">
      <div class="header col-lg-12">
        <h2 class="ap-1 bg-header">Latest Release</h2>
      </div>
    </div>
    <div class="container-fluid">
      <div class="row">
        <div class="col-8 apt-1 ml-0 pl-0 d-flex justify-content-center">
          <span>
            <pre><?php
            if ($row['file_id'] == "file_id.diz.png") {
              echo file_get_contents("collections/file_id.diz.txt");
            } else {
              if (file_exists(__DIR__ . "/collections/{$dirname}/{$row['filename']}.diz")) {
                $content = file_get_contents(__DIR__ . "/collections/{$dirname}/{$row['filename']}.diz");
                echo utf8_encode($content);
              }
            }
            ?>
          </pre>
        </span>
      </div>
      <div class="col-4">
        <div class="row d-flex justify-content-between" style="margin-top: 16px;">
          <span>
            Artist(s):
          </span>
          <span>
            <?php
            $authors = array();
	    $q = "SELECT c.filename,a.nick FROM collys c
		    LEFT JOIN artists_collys ac ON ac.colly_id=c.id
		    LEFT JOIN artists a on a.id=ac.artist_id
	            WHERE c.filename=:filename";
            $p = [":filename" => $filename];
            foreach (fetchAll($q, $p) as $row_author) {
              $row_author = get_object_vars($row_author);
              $authors[]=$row_author['nick'];
            }

            $c = 0;
            foreach($authors as $author) {
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
              echo "<a href=\"/artist/".urlsafe($author)."\">$author</a>";
              $c++;
            }
            ?>
          </span>
        </div>
        <div class="row d-flex justify-content-between">
          <span>
            Crew:
          </span>
          <span>
           <?php
           $crews = array();
	    $q = "SELECT c.filename,w.name as crew FROM collys c
		    LEFT JOIN collys_crews cc ON cc.colly_id=c.id
		    LEFT JOIN crews w on w.id=cc.crew_id
		    WHERE c.filename=:filename";
           $p = [":filename" => $filename];

           foreach (fetchAll($q, $p) as $row_crew) {
            $row_crew = get_object_vars($row_crew);
            $crews[]=$row_crew['crew'];
          }

          $c = 0;
          foreach($crews as $crew) {
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
          echo "<a href=\"/crew/".urlsafe($crew)."\">$crew</a>";
          $c++;
        }
        ?>
      </span>
    </div>
    <div class="row d-flex justify-content-between">
      <span>
        Filename:
      </span>
      <span>
        <a href="/release/<?=$filename?>" ><?=$row['filename']?></a>
      </span>
    </div>

    <div class="row d-flex justify-content-between">
      <span>
        Size:
      </span>
      <span>
        <?=$row['filesize']?>
      </span>
    </div>

    <div class="row d-flex justify-content-between">
      <span>
        Released:
      </span>
      <span>
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
      </span>
    </div>

    <div class="row d-flex justify-content-between">
      <span>
        Rating:
      </span>
      <span>
        <?php
        $q = "SELECT rating from collys where filename=:filename";
        $p = [":filename" => $filename];
        $result_colly_rating = fetchOne($q, $p);
        $collyrating = $result_colly_rating->rating;

        $q = "SELECT COUNT(rating) AS cnt from comments where filename=:filename";
        $p = [":filename" => $filename];
        $result_votes = fetchOne($q, $p);
        $votecount = $result_votes->cnt;

        if(empty($collyrating))
        {
         $votesleft=(3-$votecount);
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
    </span>
  </div>

  <div class="row d-flex justify-content-between">
    <span>
      Added by:
    </span>
    <span>
      <?=$row['uploader']?>
    </span>
  </div>

  <div class="row d-flex justify-content-between">
    <span>
      Viewed:
    </span>
    <span>
      <?=$viewtimes?> times
    </span>
  </div>

  <div class="row d-flex justify-content-between">
    <span>
      Downloaded:
    </span>
    <span>
     <?php
     $q = "SELECT downloads from collys where filename=:filename";
     $p = [":filename" => $filename];
     $result = fetchOne($q, $p);
     $downloads = $result->downloads;

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
  </span>
</div>

</div>
</div>
</div>
</div>
<?php
}
$q = "SELECT acronym FROM artists where nick=:nick";
$p = [":nick" => $showartist];
$result = fetchOne($q, $p);
$acronym = $result->acronym;
?>
<div style="clear: both"></div>


<div class="row apt-1 apb-1">
  <div class="header col-lg-12">
    <h2 class="ap-1 bg-header">All <?=$acronym?> Releases</h2>
  </div>
</div>
<div class="col-lg-12 d-flex justify-content-between pl-0">
  <?php
  foreach ($validSorts as $key => $val) {
    echo "<div class=\"col-lg-3 pl-0 amb-1\"><a class=\"lightgreen\" href=\"/artist/".urlsafe($showartist)."?&sort_by={$key}\">{$val}</a></div>";
  }
  ?>

</div>
<?php
$sort_criteria = (isset($_GET['sort_by'])) ? $_GET['sort_by'] : 'c.filename';
$q = "SELECT c.*,a.nick AS author, w.name AS crew FROM collys c
	  LEFT JOIN artists_collys ac ON ac.colly_id = c.id
	  LEFT JOIN artists a ON ac.artist_id = ac.artist_id
	  LEFT JOIN collys_crews cc ON cc.colly_id=c.id
	  LEFT JOIN crews w ON cc.crew_id=w.id
	  WHERE ac.artist_id in (SELECT id FROM artists WHERE nick=:nick)
	  GROUP BY c.filename";
if ((isset($_GET['sort_by'])) && (array_key_exists($sort_criteria, $validSorts))) {
  $q.= " ORDER BY {$sort_criteria}";
}

$p = [":nick" => $showartist];
foreach (fetchAll($q, $p) as $row) {
  $row = get_object_vars($row);

  $author=$row['author'];
  $filename=$row['filename'];
  $encoded_filename=base64_encode($row['filename']);
  $year=$row['year'];
  $name=$row['name'];
  $crew=$row['crew'];
  $encoded_crew=base64_encode($row['crew']);
  $filename=str_replace("&#39;", "'",$filename);        // replace ' with &#39  
  $filename=myTruncate($filename, 12);            // truncate
  $filename=str_replace("'", "&#39;",$filename);        // replace ' with &#39
  $name=str_replace("&#39;", "'",$name);            // replace ' with &#39  
  $name=myTruncate($name, 35);                // truncate
  $name=str_replace("'", "&#39;",$name);            // replace ' with &#39

 ?>
 <div class="col-lg-12 d-flex justify-content-between pl-0">
  <div class="col-lg-3 pl-0">
    <a class="magenta" href="/release/<?=$filename?>" ><?=$filename?></a>
  </div>

  <div class="col-lg-3 pl-0">            
    <a class="magenta" href="/release/<?=$filename?>" ><?=$name?></a> 
  </div>
  <div class="col-lg-3 pl-0">            
    <a href="/crew/<?=urlsafe($crew)?>/"> <?=$crew?></a>
  </div>
  <div class="col-lg-3 pl-0">            
    <span class="lightgrey"><?php if(!empty($year)){ echo "$year"; }?></span>
  </div>
</div>

<?php
}
} else {
	                        ?>
                                <div class="row">
                                        <div class="col-lg-12">
                                                <div class="bs-component aml-1 amb-1">
                                                        <div class="alert alert-danger">
                                                                 artist not found
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                                <?php
}
?>
</div>
<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
  <?php include "sidebar.php"; ?>
</div>
<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
  <?php include "sidebar_right.php"; ?>
</div>
<?php include "footer.php"; ?>
