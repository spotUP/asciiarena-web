<?php
require_once "session.php";
$h1 = "aRTIST iNFO";
include "header.php";
//-----------------------------------------------------------------------------
// ARTIST INFO
//-----------------------------------------------------------------------------

?>
<div class="row">
    <div class="col-lg-2">
        <?php include "sidebar.php"; ?>
    </div>
    <div class="col-lg-8">
        <?php

        $validSorts = array(
            'a.name' => 'Name',
            'a.filename' => 'Filename',
            'a.year, a.month' => 'Release Date',
            'a.timestamp' => 'Upload Date',
            'a.uploader' => 'Uploader'
        );

        $showartist=base64_decode($_GET['artist']);

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

          <div class="col-lg-12">
            Nick: <?=$show_artist?>
        </div>
        <div class="col-lg-12">
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
          foreach($artists as $artist=>$crews) {
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
              echo '<a href="info_crew.php?crew='.$encoded_crew.'&sort_by=a.filename">'.$crew.'</a>';
              $c++;
          }
      }
      ?>
  </div>
  <?php

  if (!empty($show_www))
  {
    ?>
    <div class="col-lg-12">
        Webpage: <?=$show_www?>
    </div>
    <?php
}
if (!empty($show_country))
{
    ?>
    <div class="col-lg-12">
        Country: <?=$show_country?>
    </div>
    <?php
}
?>
<div class="col-lg-12">
    Status: <?=$show_status?>
</div>
<div class="col-lg-12">
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
$q = "SELECT a.*, b.nick AS author, c.crew FROM collys AS a " .
"  INNER JOIN author_of AS b ON a.filename = b.filename " .
"  INNER JOIN crew_of AS c ON a.filename = c.filename " .
"WHERE b.nick = :nick GROUP BY a.filename ORDER BY a.year DESC, a.month DESC, a.day DESC LIMIT 1";
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
                <h1>Latest Release</h1>
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
                        $q = "select * from author_of where filename=:filename";
                        $p = [":filename" => $filename];
                        foreach (fetchAll($q, $p) as $row_author) {
                            $row_author = get_object_vars($row_author);
                            $authors[]=$row_author['nick'];
                        }

                        $c = 0;
                        foreach($authors as $author) {
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
                            echo "<a href=\"info_artist.php?artist=$encoded_author&sort_by=a.filename\">$author</a>";
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
                     $q = "select * from crew_of where filename=:filename";
                     $p = [":filename" => $filename];

                     foreach (fetchAll($q, $p) as $row_crew) {
                        $row_crew = get_object_vars($row_crew);
                        $crews[]=$row_crew['crew'];
                    }

                    $c = 0;
                    foreach($crews as $crew) {
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
          </span>
      </div>
      <div class="row d-flex justify-content-between">
        <span>
            Filename:
        </span>
        <span>
            <a href="info_release.php?filename=<?=$encoded_filename?>" ><?=$row['filename']?></a>
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
$p = [":nick" => $artist];
$result = fetchOne($q, $p);
$acronym = $result->acronym;

$encoded_artist=base64_encode($artist);
?>
<div style="clear: both"></div>


<div class="row apt-1 apb-1">
    <div class="header col-lg-12">
        <h1>[ All <?=$acronym?> Releases ] <span class="yellow">Sort by:</span>
            <?php
            foreach ($validSorts as $key => $val) {
              echo "<a class=\"lightgreen\" href=\"info_artist.php?artist={$encoded_artist}&sort_by={$key}\">{$val}</a>";
          }
          ?>
      </h1>
  </div>
</div>

<?php
$sort_criteria=$_GET['sort_by'];
$q = "SELECT a.*, b.nick AS author, c.crew FROM collys AS a " .
"  INNER JOIN author_of AS b ON a.filename = b.filename " .
"  INNER JOIN crew_of AS c ON a.filename = c.filename " .
"WHERE b.nick = :nick GROUP BY a.filename";

if ((isset($_GET['sort_by'])) && (array_key_exists($sort_criteria, $validSorts))) {
    $q.= " ORDER BY {$sort_criteria}";
}

$p = [":nick" => $showartist];
foreach (fetchAll($q, $p) as $row) {
    $row = get_object_vars($row);

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
            <div class="col-lg-12 d-flex justify-content-between">

                <div class="col-lg-3">
                    <a href="info_release.php?filename=<?=$encoded_filename?>" ><?=$filename?></a>
                </div>

                <div class="col-lg-6">            
                    <a href="info_release.php?filename=<?=$encoded_filename?>" ><?=$name?></a> 
                </div>
                <div class="col-lg-3">            
                    <a href="info_crew.php?crew=<?=$encoded_crew?>&sort_by=a.filename"> <?=$crew?></a>
                </div>
            </div>

            <?
        }
        ?>
    </div>
    <div class="col-lg-2">
        <?php include "sidebar_right.php"; ?>
    </div>
    <?php include "footer.php";