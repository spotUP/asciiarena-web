<?php
	// --------------------------------------------------------------------------------
	// EDIT PLAYLIST FIELD
	// --------------------------------------------------------------------------------

?>
<script>
  function playlistclear() {
    $("#playlist_id, #playlist_title, #playlist_author, #playlist_filename, #playlist_filename1, #playlist_filename2, #playlist_genre").val('').trigger('change');;
    $("#btnReplace").hide();
    showselfile();
  }

function getBase64(file) {
    return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    });      
  }

  function fileAttached() {
    var files=$('#playlist_filename2').prop("files");
    if (files.length>0) {
      $('#playlist_filename').val(files[0].name);
      $('#playlist_filename1').val(files[0].name);
      getBase64(files[0]).then(data => $('#playlist_filedata').val(data));
    }
  }
  
    function showselfile()
    {
      $("#playlist_filename1").hide();
      $("#playlist_filename2").show();
      $("#btnReplace").hide();
    }
    
    function showeditfile()
    {
      $("#playlist_filename1").show();
      $("#playlist_filename2").hide();
      $("#btnReplace").show();
    }
  
		function getPlaylist() {
			const id = $("#playlist_fetch_id").val();
			if (id > 0) {
				$.get(`/admin_cmds.php?cmd=get_playlist&id=${id}`, function (data) {
					playlistclear();
          showeditfile();
					$('#playlist_id').val(data[0].id);
					$('#playlist_title').val(data[0].title);
					$('#playlist_author').val(data[0].author);
					$('#playlist_genre').val(data[0].genre);
          $('#playlist_filename1').val(data[0].filename);
				});
			} else {
				playlistclear();
			}
		}

		function getPlaylistList() {
			let playlistlist = $("#playlist_fetch_id");
      showselfile();
			playlistlist.empty();
			playlistlist.append($("<option/>").val("").text("Select Playlist"));
			$.get("/admin_cmds.php?cmd=get_playlist", function (data) {
				$.each(data, function (i, playlist) {
					playlistlist.append($("<option/>").val(playlist.id).text(playlist.title));
					if (($("#edit_playlist_id").val().length) && (playlist.id == $("#edit_playlist_id").val())) {         
						$("#playlist_fetch_id").val(playlist.id).trigger("change");
						$("#edit_playlist_id").val("")
          }
				});
			});
		}

		function delplaylist() {
			const activeName = $("#playlist_title").val();
			if (activeName !== "") {
				if (confirm(`Are you sure you want to delete ${activeName}?`)) {
					const form = $("#del_playlist_form");
					$("#del_playlist_id").val($("#playlist_id").val());
					const url = form.attr("action");
					$.ajax({
						"type": "POST",
						"url": url,
						"data": form.serialize(),
						"success": () => {
							showPlaylistAlert("Playlist Deleted!", true);
							playlistclear();
							getPlaylistList();
						}
					});
				}
			}
		}
  function savePlaylist() {
    if ($('#playlist_id').val()!="")  {
      $('#playlist_filename').val($('#playlist_filename1').val());
    }

    if ($("#playlist_title").val().trim().length==0) {
      showPlaylistAlert("You must fill the title field!", false);
      return
    }
    
    if ($("#playlist_author").val().trim().length==0) {
      showPlaylistAlert("You must fill the author field!", false);
      return
    }

    if ($("#playlist_genre").val().trim().length==0) {
      showPlaylistAlert("You must fill the genre field!", false);
      return
    }
    
		if ($("#playlist_filename").val().trim().length==0) {
			showPlaylistAlert("The filename must not be blank!", false);
			return
		}

    const form = $("#playlist_form");
    const url = form.attr("action");
    $.ajax({
      "type": "POST",
      "url": url,
      "data": new FormData(form[0]),
      "processData": false,
      "contentType": false,
      "error": (r) => {
        if (r.status==409) {
          showPlaylistAlert("The playlist already exists!",false);
        } else {
          if (r.responseJSON && r.responseJSON.result) {
            showPlaylistAlert(r.responseJSON.result,false);
          } else {
            showPlaylistAlert("There was an error during saving!",false);
          }
        }
      },            
      "success": () => {
        showPlaylistAlert("Playlist Saved!", true);
        getPlaylistList();       
        playlistclear();       
      }
    });
  }

  function replacePlaylist() {
    $("#playlist_filename2").trigger('click');
  }

	function showPlaylistAlert(content, success) {
    if (success) {
		alertContent = `<div id="#success-alert" class="bs-component quick-alert animate__animated animate__bounceIn alert alert-success">${content}</div>`;
    } else {
		alertContent = `<div id="#failure-alert" class="bs-component quick-alert animate__animated animate__shakeX alert alert-warning">${content}</div>`;
    }
		$("#playlist").prepend(alertContent).children().first().delay(2000).slideUp();
	}
</script>
<div class="tab-pane fade ap-1" id="playlist">
		<?php if (is_admin()) { ?>

		<form id="del_playlist_form" action="/admin_cmds.php?cmd=del_playlist" method="post">
			<input type="hidden" name="id" id="del_playlist_id">
		</form>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<select class="select2" name="playlist_id" id="playlist_fetch_id" class="w-100" onchange="getPlaylist();">
				</select>
			</div>
		</div>
		<form id="playlist_form" action="/admin_cmds.php?cmd=save_playlist" method="post">
			<input type="hidden" name="id" id="playlist_id">


		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apt-1">
				<label for="playlist_title" class="lightgrey">Title</label>
			</div>
		</div>

		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<input type="text" class="w-100" id="playlist_title" name="title">
			</div>
		</div>

		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apt-1">
				<label for="playlist_author" class="lightgrey">Author</label>
			</div>
		</div>

		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
				<input type="text" class="w-100" id="playlist_author" name="author">
			</div>
		</div>

		<div class="row apb-1">
			<div class="col-xs-12 col-md-6">
				<label for="playlist_genre" class="lightgrey">Genre</label>
			</div>
		</div>
		<div class="row apb-1">
			<div class="col-xs-12 col-md-6 apb-1">
        <input type="text" class="w-100" id="playlist_genre" name="genre">
			</div>
		</div>

    <div class="row apb-1">
      <div class="col-xs-12 col-md-6">
        <label class="lightgrey w-100 apt-1">File</label>
      </div>
    </div>

    <div class="row apb-1 col-xs-12 col-md-6 p-0 m-0">
      <input class="w-100 p-0 amr-1" type="text" id="playlist_filename1">
			<input type="file" class="w-100" id="playlist_filename2" oninput="fileAttached()">
      <input type="hidden" class="w-100" id="playlist_filename" name="filename">
      <input type="hidden" class="w-100" id="playlist_filedata" name="filedata">
    </div>

		<div class="row apt-1">
			<div class="col-12">
				<input type="button" class="btn-big w-100 white bg-green col-xs-12 col-md-2 amb-1" value="Save" onclick="savePlaylist()">
          <input type="button" class="btn-big w-100 bg-red white w-100 col-xs-12 col-md-2 amb-1" value="Delete" onclick="delplaylist()">
          <input type="button" class="btn-big w-100 white w-100 col-xs-12 col-md-2 amb-1" id="btnReplace" value="Replace Playlist" onclick="replacePlaylist()">
			</div>
		</div>
	</form>
  <input type="hidden" id="edit_playlist_id" value="<?php if(isset($_POST['getPlaylistid']) && (isset($_POST['open_edit_playlist_field']))) echo $_POST['getPlaylistid']; ?>">
		<?php } ?>
</div>

			<script>
				$(function () {         
					getPlaylistList();
				});
			</script>
