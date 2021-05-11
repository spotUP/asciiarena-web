<?php
require_once "session.php";
$h1 = "rELEAsE iNFO";

$filename = $_GET['filename'];
$_SESSION['filename'] = $filename;
$nick = $_user['nick'];
$filename = preg_replace('/\.\.+/', '', $filename);
$colly_available = true;
if (!fetchOne("SELECT 1 FROM collys WHERE filename = :filename", [":filename" => $filename])) {
	header("HTTP/1.0 404 Not Found");
	$colly_available = false;
}

$type = fetchOne("SELECT type FROM collys WHERE filename = :filename", [":filename" => $filename])->type ?? "";

$row = fetchOne("SELECT def_font,def_fg_col,def_bg_col FROM users WHERE nick = :nick", [":nick" => $nick]);
if ($row) {
$font = (strlen($row->font) > 1) ? $row->font : 'mOsOul';
$fgcolor = (strlen($row->def_fg_col) > 1) ? $row->def_fg_col : '#ffffff';
$bgcolor = (strlen($row->def_bg_col) > 1) ? $row->def_bg_col : '#000000';
} else {
  $fgcolor = '#FF55FF';
  $bgcolor = '#111111';
}

require_once "header.php";?>

<div id="blacker" style="background-color: <?=$bgcolor?>;"></div>

<div class="modal-body row m-0 p-0">
	<div id="messages" class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
    <?php
      if (!$colly_available) 
      {
			?>
			<div class="row">
				<div class="col-lg-12">
					<div class="bs-component aml-1 amb-1">
						<div class="alert alert-danger">
							colly not found
						</div>
					</div>
				</div>
			</div>
			<?php
      } else {
        include('info_release_summary.php');
    ?>
      
    <div class="container-fluid bg-secondary amb-1 apb-1">
    <?php if ($type !== 'Archive') { ?>
		<input type="button" id="viewbutton" onclick="toggleColly()" class="btn-big amb-1 animate__animated animate__rubberBand animate__delay-2s" value="View Colly">
		<input type="button" id="fsbutton" style="display:none" onclick="showFullscreen()" class="btn-big amb-1" value="Fullscreen">
    <?php } ?>
		<input type="button" onclick="downloadfile()" class="btn-big amb-1" value="Download">
		<input id="collyid" type="hidden" data-id="<?=$colly_id?>" >
    <?php if (is_logged_in()) {
      $favourite = (fetchOne("SELECT 1 FROM favourites WHERE user_id = :user AND colly_id = :colly", [ "user" => $_user['id'], "colly" => $colly_id])) ? "Remove favourite" : "Favourite";
    ?>
    
    
		<input type="button" class="btn-big amb-1" onclick="addComment()" value="Comment">
		<input type="button" id="favbutton" onclick="favourite()" class="btn-big amb-1" value="<?=$favourite?>">
		<input type="button" class="btn-big amb-1" onclick="reportAsBroken()" value="Report Broken">   

    <form action="/admin.php#colly" method="post" id="edit-colly">
      <input type="hidden" name="getcollyname" value="<?=$filename?>">
      <input type="hidden" name="open_edit_colly_field" value="1">
      <input type="submit" class="btn-big amb-1" name="edit_colly" value="Edit Colly">
    </form>
    <?php } ?>
    </div>
      <div id="comments">
      </div>
      <div id="addcomment" style="display:none" >
        <div class="row apl-1 apr-1">
          <div class="header bg-header col-12 ap-1">ENTER YOUR COMMENT</div>
				</div>

				<div class="row">
					<div class="col-12 aml-1 amr-1">
						<textarea style="height: 128px; width: 100%;" class="bg-secondary cyan ap-1" id="user_comment" ></textarea>
					</div>
				</div>

				<div class="row aml-1 apl-1 apr-1">
					<div class="col-12 apl-1 apr-1 apb-1 apt-1 bg-secondary">
            <div class="col-2 d-flex justify-content-between">
              <label class="apr-1" for="user_rating">RATING</label>
              <select id="user_rating" class="custom-select">
                <option value="" selected="selected">Blank</option><?php
                for ($i = 1; $i < 11; $i++) 
                {
                  echo "<option value=$i>$i</option>";
                } ?>
              </select>
            </div>
						<div class="col-12 p-0 m-0 apt-1">
            <input type="button" class="btn-big" onclick="sendComment()" align="right" value="Comment">
            </div>
					</div>
				</div>
      </div>
      <div id="editcomment" style="display:none" >
        <div class="row">
          <div class="col-12 apb-1">
            <span class="white">Edit Your Comment...</span>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <textarea rows="5" class="w-100" id="user_edit_comment"></textarea>
            <input type="hidden" id="user_edit_comment_id"/>
          </div>
          <div class="col-12 apt-1">
            <input type="button" class="btn-big" onclick="sendEditedComment()" align="right" value="Save">
          </div>
        </div>
      </div>

      <div id="reportbroken" style="display:none" >
      	<div class="container-fluid bg-secondary amb-1 apb-1">
					<div class="row">
						<div class="col-12 amt-1">
							<span class="white">DESCRiBE THE PROBLEM</span>
						</div>
					</div>
					<div class="row">
						<div class="col-12 amt-1 amb-1">
							<textarea class="w-100" style="height: 64px;" id="broken_comment" ></textarea>
						</div>
					</div>
					<div class="row">
						<div class="col-12">
							<input type="button" class="btn-big" onclick="sendBrokenReport()" value="Report">
						</div>
					</div>
				</div>
      </div>

      
      <div style="display:none" id="colly-main">
      <div class="container-fluid">
        <div class="row apb-0">
          <div class="col-3">
            Colly BG:
          </div>
          <div class="col-3">
            <select class="custom-select" class="custom-select" id="colorselector_1">
              <option style="display: none;" id="selcol-1" selected="selected" value="<?=$bgcolor?>" data-color="<?=$bgcolor?>"></option>
              <option value='#555555' data-color="#555555">Bright Black</option>
              <option value='#5555ff' data-color="#5555ff">Bright Blue</option>
              <option value='#ff55ff' data-color="#ff55ff">Bright Magenta</option>
              <option value='#ff5555' data-color="#ff5555">Bright Red</option>
              <option value='#ffff55' data-color="#ffff55">Brigt Yellow</option>
              <option value='#55ff55' data-color="#55ff55">Bright Green</option>
              <option value='#55FFFF' data-color="#55FFFF">Bright Cyan</option>
              <option value='#ffffff' data-color="#ffffff">White</option>
              <option value='#000000' data-color="#000000">Black</option>
              <option value='#0000aa' data-color="#0000aa">Blue</option>
              <option value='#aa00aa' data-color="#aa00aa">Magenta</option>
              <option value='#aa0000' data-color="#aa0000">Red</option>
              <option value='#aa5500' data-color="#aa5500">Yellow</option>
              <option value='#00aa00' data-color="#00aa00">Green</option>
              <option value='#00aaaa' data-color="#00aaaa">Cyan</option>
              <option value='#aaaaaa' data-color="#aaaaaa">Grey</option>
            </select>
          </div>
        </div>
        <div class="row amb-1">
          <div class="col-3">
            Colly FG:
          </div>
          <div class="col-3">
            <select class="custom-select" class="custom-select" id="colorselector_2">
              <option id="selcol-2" selected="selected" value="<?=$fgcolor?>" data-color="<?=$fgcolor?>"></option>
              <option value='#555555' data-color="#555555">Bright Black</option>
              <option value='#5555ff' data-color="#5555ff">Bright Blue</option>
              <option value='#ff55ff' data-color="#ff55ff">Bright Magenta</option>
              <option value='#ff5555' data-color="#ff5555">Bright Red</option>
              <option value='#ffff55' data-color="#ffff55">Brigt Yellow</option>
              <option value='#55ff55' data-color="#55ff55">Bright Green</option>
              <option value='#55FFFF' data-color="#55FFFF">Bright Cyan</option>
              <option value='#ffffff' data-color="#ffffff">White</option>
              <option value='#000000' data-color="#000000">Black</option>
              <option value='#0000aa' data-color="#0000aa">Blue</option>
              <option value='#aa00aa' data-color="#aa00aa">Magenta</option>
              <option value='#aa0000' data-color="#aa0000">Red</option>
              <option value='#aa5500' data-color="#aa5500">Yellow</option>
              <option value='#00aa00' data-color="#00aa00">Green</option>
              <option value='#00aaaa' data-color="#00aaaa">Cyan</option>
              <option value='#aaaaaa' data-color="#aaaaaa">Grey</option>
            </select>
          </div>
        </div>
        <script>
          $(function() {
            $('#colorselector_1').colorselector({
              callback : function(value, color, title) {
                $("#colly").css('background-color', color);
                $("#colly-div").css('background-color', color);
                $("#blacker").css('background-color', color);
              }
            });
            $('#colorselector_2').colorselector({
              callback : function(value, color, title) {
                $("#colly").css('color', color);
              }
            });

          });
        </script>
        <div class="row aml-1">
          <div class="col-3">
            Font:
          </div>
          <div class="col-2">
            <select class="custom-select" id="colly-font">
              <option class="dropdown-item" value="MicroKnight"<?php if ($font == 'MicroKnight') echo ' selected'; ?>>MicroKnight</option>
              <option class="dropdown-item" value="MicroKnightPlus"<?php if ($font == 'MicroKnightPlus') echo ' selected'; ?>>MicroKnight+</option>
              <option class="dropdown-item" value="mOsOul"<?php if ($font == 'mOsOul') echo ' selected'; ?>>mOsOul</option>
              <option value="P0T-NOoDLE"<?php if ($font == 'P0T-NOoDLE') echo ' selected'; ?>>P0T-NOoDLE</option>
              <option value="Topaz_a500"<?php if ($font == 'Topaz_a500') echo ' selected'; ?>>A500 Topaz</option>
              <option value="TopazPlus_a500"<?php if ($font == 'TopazPlus_a500') echo ' selected'; ?>>A500 Topaz+</option>
              <option value="Topaz_a1200"<?php if ($font == 'Topaz_a1200') echo ' selected'; ?>>A1200 Topaz</option>
              <option value="TopazPlus_a1200"<?php if ($font == 'TopazPlus_a1200') echo ' selected'; ?>>A1200 Topaz+</option>
            </select>
          </div>
        </div>
      </div>
      <script>
        $("#colly-font").change(function() {
          font = $(this).val();
          $("#colly").css('font-family', font);
        });
      </script>
      <?php
      if ($type == "ASCII") 
      {
      ?>
      <div class="row ml-0 mr-0 amb-1 p-0 xs-m-0 xs-m-0 xs-p-0 s-m-0 justify-content-center align-items-center" style="background-color: <?=$bgcolor?>;" id="colly-div"><pre id="colly" style="font-family: <?=$font;?>; color: <?=$fgcolor?>; white-space: pre;"><?php
      if (file_exists("collections/{$dirname}/{$filename}")) 
      {
        $content = file_get_contents("collections/{$dirname}/{$filename}");
        $content = utf8_encode($content);
        $content = htmlentities($content);
        echo "<br><br><br><br>";
        echo $content;
        echo "<br><br><br><br>";
      }
      ?></pre>
      </div>
      <?php
      }
      elseif ($type == "ANSI") 
      {
        ?>
        <div class="row ml-0 mr-0 amb-1 p-0 xs-m-0 xs-m-0 xs-p-0 s-m-0 justify-content-center align-items-center" style="background-color: #000;"> 
          <span id="loading" style="animation: blink 2s linear infinite">.LOADiNG.</span>
          <div id="colly" style="padding-top: 64px;"></div>
        </div>
        <script type="text/javascript" src="/assets/js/ansilove.js"></script>
        <script>
          AnsiLove.splitRender("<?php echo "/collections/{$dirname}/{$filename}"; ?>", function (canvases, sauce) {
            canvases.forEach(function (canvas) {
              canvas.style.verticalAlign = "bottom";
              canvas.style.margin = "0 auto";
              canvas.style.display = "block";
              document.getElementById("colly").appendChild(canvas);
            });
            document.getElementById("loading").style.display = "none";
          }, 100, {"font": "mosoul", "bits": "8", "icecolors": 1, "columns": 80, "thumbnail": 0, "filetype": "ans"});
        </script>
        <?php
      }
      ?>    
    </div>
    <?php } ?>

  </div>

  <div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
    <?php include('sidebar.php'); ?>
  </div>

  <div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
    <?php include('sidebar_right.php'); ?>
  </div>
</div>
<?php include('footer.php'); ?>

<script type="text/javascript">

	function showFullscreen() {
		var element = document.getElementById("colly");
		element.classList.toggle("fullscreen");
		var element = document.getElementById("blacker");
		element.classList.toggle("show");
		var element = document.getElementById("spotclose");
		element.classList.toggle("show");
	}
  
	function showAlert(content, prependTo) {
 		const alertContent = '<div id="#success-alert" class="amb-1 animate__animated animate__shakeX alert alert-dismissible alert-success"><button type="button" class="close" data-dismiss="alert">x</button>'+content+'</div>';
		$(prependTo).prepend(alertContent);
	}

  function addComment() {
    $('#viewbutton').val('View Colly')
    $('#fsbutton').hide(100);
    $('#colly-main').hide(500);
    $('#reportbroken').hide(500);
    $('#comments').show(500);
    $("#addcomment").show(500);
    $("#editcomment").hide(500);
    $('#user_comment').focus();
  }

  function reportAsBroken() {
    $('#viewbutton').val('View Colly')
    $('#fsbutton').hide(100);
    $('#colly-main').hide(500);
    $('#comments').hide(500);
    $("#addcomment").hide(500);
    $("#editcomment").hide(500);
    $('#reportbroken').show(500);
    $('#broken_comment').focus();
  }

  function toggleColly() {
    $("#addcomment").hide(500);
    $("#editcomment").hide(500);
    $('#reportbroken').hide(500);
  
    if ($('#viewbutton').val() == 'View Colly') {
      const url = `/cmds.php/countview/${$("#collyid").data("id")}`;
      $.ajax(url);
      $('#colly-main').show(500);
      $('#comments').hide(500);
      $('#viewbutton').val('Hide Colly')
      $('#fsbutton').show(100);
      
    } else {
      $('#colly-main').hide(500);
      $('#comments').show(500);
      getComments();
      $('#viewbutton').val('View Colly')
      $('#fsbutton').hide(100);
    }
  }

  function editComment(commentid) {
    $('#viewbutton').val('View Colly')
    $('#fsbutton').hide(100);
    $('#colly-main').hide(500);
    $('#reportbroken').hide(500);
    $('#comments').hide(500);
    $("#addcomment").hide(500);
    $("#editcomment").show(500);
    $('#user_edit_comment').val($(`#comment${commentid}`).text());
    $('#user_edit_comment_id').val(commentid);
    $('#user_edit_comment').focus();
  }

  
  function downloadfile() {
    const url = `/cmds.php/countdl/${$("#collyid").data("id")}`;
    $.ajax(url);
    var link = document.createElement("a");
    link.setAttribute('download', '');
    link.href = '/collections/<?=$dirname?>/<?=$filename?>';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  
  function favourite() {
    if ($('#favbutton').val() == 'Favourite') {
      $('#favbutton').val('Remove favourite')
      addFavourite()
    } else {
      $('#favbutton').val('Favourite')
      removeFavourite()
    }
  }
    
  function addFavourite() {   
    const url = `/cmds.php/fave/${$("#collyid").data("id")}`;
    $.ajax(
      url
      ).done(data => {
        if (data.status === true) {
          showAlert('You added <?=$filename?> as a favourite!','#messages')
        }
      });   
  }

  function removeFavourite() {   
    const url = `/cmds.php/unfave/${$("#collyid").data("id")}`;
    $.ajax(
      url
      ).done(data => {
        if (data.status === true) {
          showAlert('You removed <?=$filename?> from your favourites!','#messages')
        }
      });   
  }
  
  function sendBrokenReport() {
    const url = `/cmds.php/broken/${$("#collyid").data("id")}`;
    $.ajax({
      "type": "POST",
			"url": url,
			"data": { 
        comment: $("#broken_comment").val()
      }
    }).done(data => {
        if (data.status === true) {
          $("#broken_comment").val("")
          showAlert('You reported <?=$filename?> as broken!','#messages')
        }
      });   
  }
  
  function sendComment() {
    const url = `/cmds.php/addcomment/${$("#collyid").data("id")}`;
    $.ajax({
      "type": "POST",
			"url": url,
			"data": { 
        rating: $("#user_rating").val(),
        comment: $("#user_comment").val()
      }
    }).done(data => {
        if (data.status === true) {
          showAlert('Comment added successfully!','#messages')
          $("#user_comment").val("")
          $("#addcomment").hide(500);
          getComments();
        }
      });   
  }
  
  function sendEditedComment() {
    const url = `/cmds.php/editcomment/${$("#user_edit_comment_id").val()}`;
    $.ajax({
      "type": "POST",
			"url": url,
			"data": { 
        comment: $("#user_edit_comment").val()
      }
    }).done(data => {
      let commentid=$('#user_edit_comment_id').val();
      $(`#comment${commentid}`).text($('#user_edit_comment').val());
      $('#viewbutton').val('View Colly')
      $('#fsbutton').hide(100);
      $('#colly-main').hide(500);
      $('#reportbroken').hide(500);
      $('#comments').show(500);
      $("#addcomment").hide(500);
      $("#editcomment").hide(500);     
    });   
  }
  
  function deleteComment(commentid) {
    const url = `/cmds.php/delcomment/${commentid}`;
    $.ajax({
      "type": "POST",
			"url": url,
      "data": { 
        colly_id: $("#collyid").data("id")
      }
    }).done(data => {
        if (data.status === true) {
          getComments();
          showAlert('You deleted a comment!','#messages');
        }
      });
  }
  
  function getComments() {
    let commentlist = $("#comments");
		commentlist.empty();
    $.ajax({
      type: 'GET',
      url: `/cmds.php/getcomments/${$("#collyid").data("id")}`
    }).done(function (data) {
      $.each(data, function (i, comment) {
        let buttons = ''
        <?php if (is_admin())  {         
        ?>
          buttons = `<input type="button" class="btn-big" onclick="editComment(${comment.id})" value="Edit"><input type="button" onclick="deleteComment(${comment.id})" class="btn-big" value="Delete">`
        <?php } elseif (is_logged_in()){
        ?>
        if (comment.nick == "<?=$_user[ "nick" ]?>") {
          buttons = `<input type="button" class="btn-big" onclick="editComment(${comment.id})" value="Edit">`
        }
        <?php }
        ?>

        if (comment.rating.length>0) {
          commentlist.append(`
          <div class="header bg-header col-12 ap-1">
            <span> BY:</span>
            <span class="yellow">${comment.nick}</span>
            <span>DATE:</span>
            <span class="white">${comment.time}</span>
            <span class="yellow">RATING:</span>
            <span class="white">${comment.rating}</span>
          </div>
          <div class="bg-secondary col-12 ap-1 amb-1">
            <span id="comment${comment.id}"class="cyan" style="white-space: pre-wrap;">${comment.comment}</span>
            <div class="col-12 p-0 m-0 apt-1">
            ${buttons}
            </div>
          </div>`); 
        }
        else {
          commentlist.append(`
          <div class="header bg-header col-12 ap-1">
            <span> BY:</span>
            <span class="yellow">${comment.nick}</span>
            <span>DATE:</span>
            <span class="white">${comment.time}</span>
          </div>
          <div class="bg-secondary col-12 ap-1 amb-1">
            <span id="comment${comment.id}"class="cyan" style="white-space: pre-wrap;">${comment.comment}</span>
            <div class="col-12 p-0 m-0 apt-1">
            ${buttons}
            </div>
          </div>`); 
        }
      });
    });   
  }
  
  $(function() {
    getComments();
  });
</script>