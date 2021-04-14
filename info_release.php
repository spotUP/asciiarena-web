<?php
require_once "session.php";

$filename = $_GET['filename'];
$_SESSION['filename'] = $filename;
$nick = $_user['nick'];
$filename = preg_replace('/\.\.+/', '', $filename);

require_once "header.php"; ?>

<div id="blacker"></div>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
		<?php

		$time = time();
		$comment = $_POST[ 'comment' ] ?? "";
		$user_added_rating = $_POST[ 'user_added_rating' ] ?? "";

		if (isset($_POST[ 'favourite' ]) && is_logged_in()) 
		{
			doQuery("INSERT INTO favourites (user_id, colly_id, nick, filename)
				VALUES (:user_id, (select id from collys where filename=:filename), :nick, :filename)",
				[":user_id" => $_user["id"], ":nick" => $nick, ":filename" => $filename]);
				?>
				<div class="row">
					<div class="col-lg-12">
						<div class="bs-component aml-1 amb-1">
							<div class="alert alert-dismissible alert-success">
								<button type="button" class="close" data-dismiss="alert">x</button>
								You added <?=$filename?> as a favourite!
							</div>
						</div>
					</div>
				</div>
				<?php
			}

			if (isset($_POST[ 'broken' ])) 
			{
				?>
				<form action="/release/<?=$filename?>" method="post">
					<div class="container-fluid bg-secondary amb-1 apb-1">
						<div class="row">
							<div class="col-12 amt-1">
								<span class="white">DESCRiBE THE PROBLEM</span>
							</div>
						</div>
						<div class="row">
							<div class="col-12 amt-1 amb-1">
								<textarea class="w-100" style="height: 64px;" id="broken_comment" name="broken_comment"></textarea>
							</div>
						</div>
						<div class="row">
							<div class="col-12">
								<input type="submit" class="btn-big" name="do_report_broken" value="Report">
							</div>
						</div>
					</div>
				</form>
				<?php
			}
			if (isset($_POST[ 'do_report_broken' ])) 
			{
				$broken_comment = $_POST[ 'broken_comment' ] ?? "";
				doQuery("UPDATE collys SET broken = 1, broken_comment = :comment WHERE filename = :filename", [
					":comment" => $broken_comment,
					":filename" => $filename
				]);
				?>
				<div class="row">
					<div class="col-lg-12">
						<div class="bs-component aml-1 amb-1">
							<div class="alert alert-dismissible alert-success">
								<button type="button" class="close" data-dismiss="alert">x</button>
								You reported <?=$filename?> as broken!
							</div>
						</div>
					</div>
				</div>
				<?php
			}

//----------------------------------------------------------------------------------------------
// WRITE EDITED MESSAGE TO DB
//----------------------------------------------------------------------------------------------

			if (isset($_POST[ 'edit_message' ]) && (isset($_GET[ 'comment' ]))) 
			{
				$commentid = $_POST[ 'commentid' ] ?? "";
				$edit_message = $_POST[ 'edit_message' ] ?? "";

				if (is_numeric($commentid)) 
				{
					doQuery("UPDATE comments SET comment = :comment WHERE commentid = :commentid", [
						":comment" => $edit_message,
						":commentid" => $commentid
					]);
				}

				header("Location: /release/".$filename);
				exit;
			}

			if (isset($_POST[ 'add_comment' ]) || (isset($_POST[ 'Delete' ]))) 
			{
				$crew = $_POST[ 'crew' ];

				$ask = "SELECT a.nick FROM collys c LEFT JOIN artists_collys ac ON ac.colly_id=c.id LEFT JOIN artists a ON a.id=ac.artist_id WHERE c.filename=:filename";
				$row = fetchOne($ask, [ 'filename' => $filename ]);
				if (isset($row->nick))
				{
					$artist = $row->nick;
				}

				$ask = "SELECT w.name as crew FROM collys c LEFT JOIN collys_crews cc ON cc.colly_id=c.id LEFT JOIN crews w ON w.id=cc.crew_id WHERE c.filename=:filename";
				$row = fetchOne($ask, [ 'filename' => $filename ]);
				if (isset($row->crew))
				{
					$crew = $row->crew;
				}

//----------------------------------------------------------------------------------------------
// WRITE COMMENT TO DATABASE
//----------------------------------------------------------------------------------------------

				if (isset($_POST[ 'comment' ]) && (isset($_GET[ 'comment' ]))) 
				{
					if (empty($comment))
					{
						$comment = "$nick voted $user_added_rating";
					}

					$ask = "SELECT a.nick FROM collys c LEFT JOIN artists_collys ac ON ac.colly_id=c.id LEFT JOIN artists a ON a.id=ac.artist_id WHERE c.filename=:filename";
					$row = fetchOne($ask, [ 'filename' => $filename ]);
					if (isset($row->nick))
					{
						$artist = $row->nick;
					}

					$ask_crew = "SELECT w.name as crew FROM collys c LEFT JOIN collys_crews cc ON cc.colly_id=c.id LEFT JOIN crews w ON w.id=cc.crew_id WHERE c.filename=:filename";
					$row_crew = fetchOne($ask_crew, [ 'filename' => $filename ]);
					if (isset($row_crew->crew))
					{
						$commentcrew = $row_crew->crew;
					}

					$ask = "insert into comments (colly_id, filename, crew, artist, comment, rating, nick, timestamp,user_id) 
					values ((select id from collys where filename=:filename),:filename,:commentcrew,:artist,:comment, :user_added_rating, :nick, :time, :user_id)";
					doQuery($ask, [
						'filename' => $filename,
						'commentcrew' => $commentcrew,
						'artist' => $artist,
						'comment' => $comment,
						'nick' => $nick,
						'time' => $time,
				  	'user_added_rating' => $user_added_rating, # might be empty, should end up as NULL
				  	'user_id' => $_user['id'],
				  ]);
				  ?>
				  <div class="row">
				  	<div class="col-lg-12">
				  		<div class="bs-component aml-1 amb-1">
				  			<div class="alert alert-dismissible alert-success">
				  				<button type="button" class="close" data-dismiss="alert">x</button>
				  				Comment added successfully!
				  			</div>
				  		</div>
				  	</div>
				  </div>
				  <?php
				}

//----------------------------------------------------------------------------------------------
// CALCULATE RATING FOR COLLY
//----------------------------------------------------------------------------------------------

				$ask_rate_amount = "SELECT COUNT(rating) AS count from comments where filename=:filename and rating>0";
				$result_rate_amount = fetchOne($ask_rate_amount, [ 'filename' => $filename ]);
				if ($row_rate_amount = $result_rate_amount) 
				{
					$rate_amount = $row_rate_amount->count;
				}

				if ($rate_amount > 2) 
				{
					$ask = "select avg(rating) AS avg from comments where filename=:filename and rating>0";
					$result = fetchOne($ask, [ 'filename' => $filename ]);
					if ($row = $result) 
					{
						$avgrating = $row->avg;
					}

					$ask = "update collys set rating=:avgrating where filename=:filename";
					doQuery($ask, [ 'filename' => $filename, 'avgrating' => $avgrating ]);
				}

//----------------------------------------------------------------------------------------------
// CALCULATE RATING
//----------------------------------------------------------------------------------------------
//
				recalculate_ratings();

			}

//----------------------------------------------------------------------------------------------
// DELETE COMMENTS
//----------------------------------------------------------------------------------------------

			if (isset($_POST[ 'Delete' ])) 
			{
				if ($rank = "Admin") 
				{
					$commentid = $_POST[ 'commentid' ];
					$ask = "DELETE FROM comments where filename=:filename and commentid=:commentid";
					doQuery($ask, [ 'filename' => $filename, 'commentid' => $commentid ]);
				}

				$ask = "SELECT a.nick FROM collys c LEFT JOIN artists_collys ac ON ac.colly_id=c.id LEFT JOIN artists a ON a.id=ac.artist_id WHERE c.filename=:filename";
				$result = fetchOne($ask, [ 'filename' => $filename ]);
				if (isset($result)) 
				{
					$artist = $result->nick;
				}

				$ask = "select avg(rating) as rating from comments where artist=:artist and rating>0";
				$result = fetchOne($ask, [ 'artist' => $artist]);
				if (isset($result)) 
				{
					$avg_artist_rating = $result->rating;
				} else { 
					$avg_artist_rating = 0;
				}

				$ask = "SELECT COUNT(rating) as rating from comments where artist=:artist and rating>0";
				$result = fetchOne($ask, [ 'artist' => $artist]);
				if (isset($result)) 
				{
					$rate_amount = $result->rating;
				}
				if ($rate_amount > 2) 
				{
					$ask = "update artists set rating=:rating where nick=:nick";
					doQuery($ask, [ 'rating' => $avg_artist_rating, 'nick' => $artist ]);
				}
				$ask = "select avg(rating) as rating from comments where filename=:filename and rating>0";
				$result = fetchOne($ask, [ 'filename' => $filename ]);
				if (isset($result)) 
				{
					$avg_colly_rating = $result->rating;
				} else {
					$avg_colly_rating = 0;
				}

				$ask = "SELECT w.name as crew FROM collys c LEFT JOIN collys_crews cc ON cc.colly_id=c.id LEFT JOIN crews w ON w.id=cc.crew_id WHERE c.filename=:filename";
				$result = fetchOne($ask, [ 'filename' => $filename ]);
				if (isset($result)) 
				{
					$crew = $result->crew;
				}

				$ask = "select avg(rating) as rating from comments where crew=:crew and rating>0";
				$result = fetchOne($ask, [ 'crew' => $crew ]);
				if (isset($result)) 
				{
					$avg_crew_rating = $result->rating;
				} else { 
					$avg_crew_rating = 0;
				}

				$ask_rate_amount = "SELECT COUNT(rating) as rating from comments where crew=:crew and rating>0";
				$result = fetchOne($ask, [ 'crew' => $crew ]);
				if (isset($result)) 
				{
					$rate_amount = $result->rating;
				}

				if ($rate_amount > 2) 
				{
					$ask = "update crews set rating=:rating where name=:crew";
					doQuery($ask, [ 'rating' => $avg_artist_rating, 'crew' => $crew ]);
				}
				?>
				<div class="row">
					<div class="col-lg-12">
						<div class="bs-component aml-1 amb-1">
							<div class="alert alert-dismissible alert-success">
								<button type="button" class="close" data-dismiss="alert">x</button>
								Comment deleted!
							</div>
						</div>
					</div>
				</div>
				<?php
			}

			include('info_release_summary.php');

//----------------------------------------------------------------------------------------------
// TOP CONTROL TABLE
//----------------------------------------------------------------------------------------------

			if (!isset($_POST[ 'edit_colly' ]) && !isset($_POST[ 'broken' ])) 
			{
				$type = fetchOne("SELECT type FROM collys WHERE filename = :filename", [":filename" => $filename])->type ?? "";


				?>
				<div class="container-fluid bg-secondary amb-1 apb-1" style="height: 132px;">
					<script>
						$(document).ready(function() 
						{
							$("#ctrlForm select").change(function() 
							{
								$("#ctrlForm input[name='view']").click();
							});
						});

					</script>

					<?php
					echo "<form action=\"/release/".$filename."\" method='post'  id='ctrlForm'>";

					echo "<input type='submit' class='btn-big amb-1' name='hide' value='Hide Colly!'" . ((!isset($_POST[ 'change' ]) && (!isset($_POST[ 'view' ]) && ($type != "Archive"))) ? " style='display:none'" : "") . "> ";
					echo "<input type='submit' class='btn-big amb-1 animate__animated animate__rubberBand animate__delay-2s' name='view' value='View Colly'" . ((isset($_POST[ 'view' ]) || (isset($_POST[ 'change' ]))) ? " style='display:none'" : "") . "> ";
					echo "<input type='button' onclick='myFunction()' class='btn-big amb-1' name='fullscreen' value='Fullscreen'" . ((isset($_POST[ 'change' ]) || (!isset($_POST[ 'view' ]))) ? " style='display:none'" : "") . "> ";

					if (is_logged_in()) 
					{
						$ask = "select uploader from collys where filename=:filename";
						$result_uploader = fetchOne($ask, [ 'filename' => base64_decode($filename) ]);
						if (isset($result_uploader->uploader)) $uploader = $result_uploader->uploader;
						?>
						<input type="submit" class="btn-big amb-1" name="addcomment" value="Comment">
						<input type="submit" class="btn-big amb-1" name="favourite" value="Favourite">
						<input type="submit" class="btn-big amb-1" name="broken" value="Report Broken">
						</form>
						<?php
						if ($_user[ "nick" ] === $uploader || is_admin()) 
						{
							?>
							<form action="/admin.php#colly" method='post' id='edit-colly'>
								<input type="hidden" name="getcollyname" value="<?=$filename?>">
								<input type="hidden" name="open_edit_colly_field" value="1">
								<input type="submit" class="btn-big amb-1" name="edit_colly" value="Edit Colly">
							</form>
							<?php
						}
					}
					if (!isset($_POST[ 'download' ])) 
					{
						?>
						<input type="submit" class="btn-big amb-1" name="download" value="Download">
						<?php
					} 
					elseif (isset($_POST[ "download" ])) 
					{
            $ask = "select downloads from collys where filename=:filename"; // download counter
            $row = fetchOne("SELECT view_counter, type FROM collys WHERE filename = :filename", [":filename" => $filename]);
            $downloads = $row->downloads+1;

            doQuery("update collys set downloads=:downloads where filename=:filename", [":downloads" => $downloads, ":filename" => $filename]);
            ?><meta content="1"; URL="<?=$filenameandpath?>" http-equiv="Refresh"><?php
        }

        $font = fetchOne("SELECT def_font FROM users WHERE nick = :nick", [":nick" => $nick]);
        if (($font) && ($font->def_font)) 
        {
        	$font = $font->def_font;
        } 
        else if (isset($_POST['font'])) 
        {
        	$font = $_POST['font'];
        } 
        else
        {
        	$font = "mOsOul";
        }

        $fgcolor = (isset($_POST[ 'foreground_color'])) ? $_POST[ 'foreground_color'] : '';

        $def_color = fetchOne("SELECT def_bg_col FROM users WHERE nick = :nick", [":nick" => $nick]);
        if (($def_color) && ($def_color->def_bg_col)) 
        {
        	$bgcolor = $def_color->def_bg_col;
        }
        else if (isset($_POST['background_color'])) 
        {
        	$bgcolor = $_POST['background_color'];
        }
        else
        {
        	$bgcolor = "#000000";
        }

        if ($type != "ANSI") 
        {
        	if (isset($_POST[ 'view' ]) || (isset($_POST[ 'change' ]))) 
        	{
        		?>
        		<div class="apb-0">
        			<select name="font">
        				<option class="dropdown-item" value="MicroKnight"<?php if ($font == 'MicroKnight') echo ' selected'; ?>>MicroKnight</option>
        				<option class="dropdown-item" value="MicroKnightPlus"<?php if ($font == 'MicroKnightPlus') echo ' selected'; ?>>MicroKnight+</option>
        				<option class="dropdown-item" value="mOsOul"<?php if ($font == 'mOsOul') echo ' selected'; ?>>mOsOul</option>
        				<option value="P0T-NOoDLE"<?php if ($font == 'P0T-NOoDLE') echo ' selected'; ?>>P0T-NOoDLE</option>
        				<option value="Topaz_a500"<?php if ($font == 'Topaz_a500') echo ' selected'; ?>>A500 Topaz</option>
        				<option value="TopazPlus_a500"<?php if ($font == 'TopazPlus_a500') echo ' selected'; ?>>A500 Topaz+</option>
        				<option value="Topaz_a1200"<?php if ($font == 'Topaz_a1200') echo ' selected'; ?>>A1200 Topaz</option>
        				<option value="TopazPlus_a1200"<?php if ($font == 'TopazPlus_a1200') echo ' selected'; ?>>A1200 Topaz+</option>
        			</select>
        			<select name="background_color">
        				<option value=""<?php if ($bgcolor == '') echo ' selected'; ?>>BG Color</option>
        				<option value="Black"<?php if ($bgcolor == 'Black') echo ' selected'; ?>>Black</option>
        				<option value="DarkBlue"<?php if ($bgcolor == 'DarkBlue') echo ' selected'; ?>>Dark Blue</option>
        				<option value="DarkGreen"<?php if ($bgcolor == 'DarkGreen') echo ' selected'; ?>>Dark Green</option>
        				<option value="DarkCyan"<?php if ($bgcolor == 'DarkCyan') echo ' selected'; ?>>Dark Cyan</option>
        				<option value="DarkRed"<?php if ($bgcolor == 'DarkRed') echo ' selected'; ?>>Dark Red</option>
        				<option value="Magenta"<?php if ($bgcolor == 'Magenta') echo ' selected'; ?>>Magenta</option>
        				<option value="Brown"<?php if ($bgcolor == 'Brown') echo ' selected'; ?>>Brown</option>
        				<option value="DarkGrey"<?php if ($bgcolor == 'DarkGrey') echo ' selected'; ?>>Dark Grey</option>
        				<option value="Grey"<?php if ($bgcolor == 'Grey') echo ' selected'; ?>>Grey</option>
        				<option value="Blue"<?php if ($bgcolor == 'Blue') echo ' selected'; ?>>Blue</option>
        				<option value="Green"<?php if ($bgcolor == 'Green') echo ' selected'; ?>>Green</option>
        				<option value="Cyan"<?php if ($bgcolor == 'Cyan') echo ' selected'; ?>>Cyan</option>
        				<option value="Red"<?php if ($bgcolor == 'Red') echo ' selected'; ?>>Red</option>
        				<option value="Magenta"<?php if ($bgcolor == 'Magenta') echo ' selected'; ?>>Magenta</option>
        				<option value="Yellow"<?php if ($bgcolor == 'Yellow') echo ' selected'; ?>>Yellow</option>
        				<option value="White"<?php if ($bgcolor == 'White') echo ' selected'; ?>>White</option>
        			</select>
        			<select name="foreground_color">
        				<option value=""<?php if ($fgcolor == '') echo ' selected'; ?>>FG Color</option>
        				<option value="Black"<?php if ($fgcolor == 'Black') echo ' selected'; ?>>Black</option>
        				<option value="DarkBlue"<?php if ($fgcolor == 'DarkBlue') echo ' selected'; ?>>Dark Blue</option>
        				<option value="DarkGreen"<?php if ($fgcolor == 'DarkGreen') echo ' selected'; ?>>Dark Green</option>
        				<option value="DarkCyan"<?php if ($fgcolor == 'DarkCyan') echo ' selected'; ?>>Dark Cyan</option>
        				<option value="DarkRed"<?php if ($fgcolor == 'DarkRed') echo ' selected'; ?>>Dark Red</option>
        				<option value="Magenta"<?php if ($fgcolor == 'Magenta') echo ' selected'; ?>>Magenta</option>
        				<option value="Brown"<?php if ($fgcolor == 'Brown') echo ' selected'; ?>>Brown</option>
        				<option value="DarkGrey"<?php if ($fgcolor == 'DarkGrey') echo ' selected'; ?>>Dark Grey</option>
        				<option value="Grey"<?php if ($fgcolor == 'Grey') echo ' selected'; ?>>Grey</option>
        				<option value="Blue"<?php if ($fgcolor == 'Blue') echo ' selected'; ?>>Blue</option>
        				<option value="Green"<?php if ($fgcolor == 'Green') echo ' selected'; ?>>Green</option>
        				<option value="Cyan"<?php if ($fgcolor == 'Cyan') echo ' selected'; ?>>Cyan</option>
        				<option value="Red"<?php if ($fgcolor == 'Red') echo ' selected'; ?>>Red</option>
        				<option value="Magenta"<?php if ($fgcolor == 'Magenta') echo ' selected'; ?>>Magenta</option>
        				<option value="Yellow"<?php if ($fgcolor == 'Yellow') echo ' selected'; ?>>Yellow</option>
        				<option value="White"<?php if ($fgcolor == 'White') echo ' selected'; ?>>White</option>
        			</select>
        		</div>
        		<?php
        	}
        	?>
        </form>
    <?php
} ?>
    </div>
<?php

//----------------------------------------------------------------------------------------------
// SHOW COLLY?
//----------------------------------------------------------------------------------------------

if (isset($_POST[ 'view' ]) || (isset($_POST[ 'change' ]))) 
{


	if (isset($_POST[ 'change' ])) 
	{
		$bgcolor = $_POST[ 'background_color' ];
		$font = $_POST[ 'font' ];
	}
	
	$row = fetchOne("SELECT view_counter, type FROM collys WHERE filename = :filename", [":filename" => $filename]);
	$type = $row->type;
	$counter = $row->view_counter;
	$counter++;

	doQuery("UPDATE collys SET view_counter = :counter WHERE filename = :filename", [
		":counter" => $counter,
		":filename" => $filename
	]);

	if ($type == "ASCII") 
	{
		?>
		<div class="row ml-0 mr-0 amb-1 p-0 xs-m-0 xs-m-0 xs-p-0 s-m-0 justify-content-center align-items-center" style="background-color: <?=$bgcolor?>;"><pre id="colly" style="font-family: <?=$font;?>; color: <?=$fgcolor?>; white-space: pre-wrap;"><?php
		if (file_exists(__DIR__ . "/collections/{$dirname}/{$filename}")) 
		{
			$content = file_get_contents(__DIR__ . "/collections/{$dirname}/{$filename}");
			echo "<br><br><br><br>";
			echo utf8_encode($content);
			echo "<br><br><br><br>";
		}
		?></pre>
		</div>
<?php   }
	elseif ($type == "ANSI") 
	{
		?>
		<div class="row ml-0 mr-0 amb-1 p-0 xs-m-0 xs-m-0 xs-p-0 s-m-0 justify-content-center align-items-center" style="background-color: #000;"> 
			<div id="colly" style="padding-top: 64px;"></div>
		</div>
		<script type="text/javascript" src="/assets/js/ansilove.js"></script>
		<script>
		AnsiLove.render("<?php echo "/collections/{$dirname}/{$filename}"; ?>", function (canvas, sauce) {
		    document.getElementById("colly").appendChild(canvas);
		}, {"font": "mosoul", "bits": "8", "icecolors": 1, "columns": 80, "thumbnail": 0, "filetype": "ans"});
		</script>
<?php
	}
}

//----------------------------------------------------------------------------------------------
//SHOW COMMENTS
//----------------------------------------------------------------------------------------------
if (!isset($_POST[ 'edit' ])) 
{
	foreach (fetchAll("SELECT comment, rating, nick, timestamp, commentid FROM comments WHERE filename = :filename ORDER BY timestamp ASC", [":filename" => $filename]) as $row) 
	{
		$comment = $row->comment;
		$userrating = $row->rating;
		$commentnick = $row->nick;
		$commentid = $row->commentid;
		$commenttime = date("Y-m-d H:i", $row->timestamp);

		echo "<form action='/release/".$filename."&post' method='post'>";
		if ($userrating > 0) 
		{
			if (!is_admin()) 
			{
				if ($commentnick === $_user[ "nick" ]) 
				{
					?>
					<div class="header bg-header col-12 ap-1">
						<span> BY:</span>
						<span class="yellow"><?=$commentnick?></span>
						<span>DATE:</span>
						<span class="white"><?=$commenttime?></span>
						<span class="yellow">RATING:</span>
						<span class="white"><?=$userrating?></span>
					</div>
					<div class="bg-secondary col-12 ap-1 amb-1">
						<span class="cyan"><?=$comment?></span>
						<div class="col-12 p-0 m-0 apt-1">
							<input type="hidden" name="commentid" value="<?=$commentid?>"/><input type="submit" class="btn-big" name="edit" value="Edit">
						</div>
					</div>
					<?php
				}
				else 
				{
					?>
					<div class="header bg-header col-12 ap-1">
						<span> BY:</span>
						<span class="yellow"><?=$commentnick?></span>
						<span>DATE:</span>
						<span class="white"><?=$commenttime?></span>
						<span class="yellow">RATING:</span>
						<span class="white"><?=$userrating?></span>
					</div>
					<div class="bg-secondary col-12 ap-1 amb-1">
						<span class="cyan" style="white-space: pre-wrap;"><?=$comment?></span>
					</div>
					<?php
				}
			}
			if (is_admin()) 
			{
				?>
				<div class="header bg-header col-12 ap-1">
					<span> BY:</span>
					<span class="yellow"><?=$commentnick ?></span>
					<span> DATE:</span>
					<span class="white"><?=$commenttime ?></span>
					<span class="yellow"> RATING:</span>
					<span class="white"><?=$userrating ?></span>
				</div>
				<div class="bg-secondary col-12 ap-1 amb-1">
					<span class="cyan" style="white-space: pre-wrap;"><?=$comment?></span>
					<div class="col-12 p-0 m-0 apt-1">
						<input type="hidden" class="btn-big" name="commentid" value="<?=$commentid?>">
						<input type="submit" class="btn-big" name="edit" value="Edit">
						<input type="submit" class="btn-big" name="Delete" value="Delete">
					</div>
				</div>

				<?php
			}
		} 
		else 
		{
			if (!is_admin()) 
			{
				if ($commentnick === $_user[ "nick" ]) 
				{
					?>
					<div class="header bg-header col-12 ap-1">
						<span> BY:</span>
						<span class="yellow"><?=$commentnick ?></span>
						<span> DATE:</span>
						<span class="white"><?=$commenttime ?></span>
					</div>
					<div class="col-12 ap-1 amb-1">
						<span class="cyan" style="white-space: pre-wrap;"><?=$comment?></span>
						<div class="col-12 p-0 m-0 apt-1">
							<input type="hidden" class="btn-big" name="commentid" value="<?=$commentid?>">
							<input type="submit" class="btn-big" name="edit" value="Edit">
						</div>
					</div>
					<?php
				}
				else
				{
					?>
					<div class="header bg-header col-12 ap-1">
						<span> BY:</span>
						<span class="yellow"><?=$commentnick ?></span>
						<span> DATE:</span>
						<span class="white"><?=$commenttime ?></span>
					</div>
					<div class="bg-secondary col-12 ap-1 amb-1">
						<span class="cyan" style="white-space: pre-wrap;"><?=$comment?></span>
					</div>
					<?php
				}
			}
			if (is_admin()) 
			{
				?>
				<div class="bg-header header col-12 ap-1">
					<span> BY:</span>
					<span class="yellow"><?=$commentnick ?></span>
					<span> DATE:</span>
					<span class="white"><?=$commenttime ?></span>
				</div>
				<div class="bg-secondary col-12 ap-1 amb-1">
					<span class="cyan" style="white-space: pre-wrap;"><?=$comment?></span>
					<input type="hidden" name="commentid" value="<?=$commentid?>">
					<div class="col-12 p-0 m-0 apt-1">
						<input type="submit" class="btn-big" name="edit" value="Edit">
						<input type="submit" class="btn-big" name="Delete" value="Delete">
					</div>
				</div>
				<?php
			}
		}
		echo "</form>";
	}
}
}

//----------------------------------------------------------------------------------------------
// ADD COMMENT FIELD
//----------------------------------------------------------------------------------------------

if (isset($_POST[ 'addcomment' ])) 
{
	$ask = "SELECT w.name as crew FROM collys c LEFT JOIN collys_crews cc ON cc.colly_id=c.id LEFT JOIN crews w ON w.id=cc.crew_id WHERE c.filename=:filename";
	$row = fetchOne($ask, ['filename' => $filename ]);
	$crew = $row->crew;

	$ask = "SELECT a.nick FROM collys c LEFT JOIN artists_collys ac ON ac.colly_id=c.id LEFT JOIN artists a ON a.id=ac.artist_id WHERE c.filename=:filename";
	$row = fetchOne($ask, ['filename' => $filename ]);
	$artist = $row->nick;

	if (!isset($_POST[ 'edit' ])) 
	{
		$ask = "select sum(rating) as rating from comments where filename=:filename and nick=:artist and rating>0";
		$row = fetchOne($ask, [':filename' => $filename, ':artist' => $artist ]);
		$hasrated = $row->rating;
		if ($hasrated > 0) 
		{
			echo "<form action=\"/release/".$filename."&comment\" method=\"post\">";
			?>
			<div class="row">
				<h2>Enter your comment...</h2>
			</div>

			<div class="row">
				<textarea rows="5" cols="82" id="commentvote" name="comment"></textarea>
				<input type="hidden" name="crew" align="right" value="<?=$crew?>"><input type="hidden" name="artist" align="right" value="<?=$artist?>">
				<input type="submit" class="btn-big" name="add_comment" align="right" value="Comment">
			</div>
		</form>
		<script type="text/javascript">
			document.getElementById('commentvote').focus();
		</script>
		<?php
	}
	else
	{
		echo "<form action=\"/release/".$filename."&comment\" method=\"post\">";
		?>
		<div class="row apl-1 apr-1">
			<div class="header bg-header col-12 ap-1">ENTER YOUR COMMENT</div>
		</div>

		<div class="row">
			<div class="col-12 aml-1 amr-1">
				<textarea style="height: 128px; width: 100%;" class="bg-secondary cyan ap-1" id="comment" name="comment"></textarea>
			</div>
		</div>

		<div class="row aml-1 apl-1 apr-1">
			<div class="col-12 apl-1 apr-1 apb-1 apt-1 bg-secondary">

				RATING
				<select name="user_added_rating">
					<option value="0" selected="selected">Blank</option><?php
					for ($i = 1; $i < 11; $i++) 
					{
						echo "<option value=$i>$i</option>";
					} ?>
				</select>
				<input type="hidden" name="crew" align="right" value="<?=$crew?>"><input type="hidden" name="artist"
				align="right" value="<?=$artist?>">
				<input type="submit" class="btn-big" name="add_comment" align="right" value="Comment">
			</div>
		</div>
	</form>
	<script type="text/javascript">
		document.getElementById('comment').focus();
		</script><?php
	}
}
}

//--------------------------------------------------------------------------------------------------
// EDIT COMMENT FIELD
//--------------------------------------------------------------------------------------------------

if (isset($_POST[ 'edit' ])) 
{
	echo "<form action=\"/release/".$filename."&comment\" method=\"post\">";
	$commentid = $_POST[ 'commentid' ];

	$ask = "select comment from comments where commentid=:commentid";
	$result = fetchAll($ask, [ 'commentid' => $commentid ]);
	foreach ($result as $row)
	{
		$comment = fixOutputEdit($row->comment);
	}
	echo "<form action=\"/release/".$filename."&comment\" method=\"post\">";
	?>
	<div class="headline">
		Edit Your Comment...
	</div>

	<div class="row">
		<textarea rows="5" cols="82" name="edit_message"><?=$comment?></textarea>
		<input type="hidden" name="commentid" value="<?=$commentid?>"/>
		<input type="submit" class="btn-big" name="writeedit" align="right" value="Submit">
	</form>
</div>
<?php
}
?>
</div>

<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
	<?php include('sidebar.php'); ?>
</div>

<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
	<?php include('sidebar_right.php'); ?>
</div>
<?php include('footer.php'); ?>
