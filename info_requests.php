<?php
require_once "session.php";
require_once "tools/text.php";
$h1 = "REQUEST";

$reqid = $_GET['id'];
$result = fetchOne("select requests.*, users.nick user, users.id requserid from requests LEFT JOIN users on users.id = requests.requestedby where requests.id=:reqid", [ 'reqid' => $reqid ]);

if (isset($result->id)) {
  $req_available = true;
} else {
	header("HTTP/1.0 404 Not Found");
	$req_available = false;
}

include "header.php";
//-----------------------------------------------------------------------------
// req INFO
//-----------------------------------------------------------------------------
?>
<script>
  function htmlEncode(s) {
    return $('<div>').text(s).html();
  }

  function showAlert(content, prependTo) {
   const alertContent = '<div id="#success-alert" class="animate__animated animate__shakeX alert alert-success">'+content+'</div>';
   $(prependTo).prepend(alertContent).children().first().delay(2000).slideUp();
 }

  function editReqComment(commentid) {
    $('#reqcomments').hide(500);
    $("#addreqcomment").hide(500);
    $("#editreqcomment").show(500);
    $('#user_edit_req_comment').val($(`#comment${commentid}`).text());
    $('#user_edit_req_comment_id').val(commentid);
    $('#user_edit_req_comment').focus();
  }

    function cancelReqEdit() {
      $("#addreqcomment").hide(500);
      $("#editreqcomment").hide(500);     
      $('#reqcomments').show(500);
      $("#addreqcomment").show(500);
      getReqComments();
    }
      
    function updateReqStatus(newstatus) {
      const url = `/cmds.php/updatereqstatus/<?=$reqid?>`;
      $.ajax({
        "type": "POST",
        "url": url,
        "data": { 
          "status": newstatus
        }
      }).done(data => {
        if (data.status === true) {
           document.location.reload()
        }
      });   
    }

    function delReqComment(commentid) {
      const url = `/cmds.php/delreqcomment/${commentid}`;
      $.ajax({
        "type": "POST",
        "url": url,
        "data": { 
          req_id: <?=$reqid?>
        }
      }).done(data => {
        if (data.status === true) {
          getReqComments();
          showAlert('You deleted a comment!','#messages');
        }
      });
    }

    function sendReqComment() {
      const url = `/cmds.php/addreqcomment/<?=$reqid?>`;
      $.ajax({
        "type": "POST",
        "url": url,
        "data": { 
          comment: $("#user_comment").val()
        }
      }).done(data => {
        if (data.status === true) {
          showAlert('Comment added successfully!','#messages')
          $("#user_comment").val("")
          getReqComments();
        }
      });   
    }

    function sendEditedReqComment() {
      const url = `/cmds.php/editreqcomment/${$("#user_edit_req_comment_id").val()}`;
      $.ajax({
        "type": "POST",
        "url": url,
        "data": { 
          comment: $("#user_edit_req_comment").val()
        }
      }).done(data => {
        let commentid=$('#user_edit_req_comment_id').val();
        $(`#comment${commentid}`).text($('#user_edit_req_comment').val());
        cancelReqEdit();
      });   
    }
    

    function getReqComments() {
      reqcommentlist = $("#reqcomments");
      reqcommentlist.empty();
      $.ajax({
        type: 'GET',
        url: '/cmds.php/get_req_comments/<?=$reqid?>'
      }).done(function (data) {

        $.each(data, function (i, comment) {

          let buttons = ''
          <?php if (is_admin())  {         
            ?>
            buttons = `<input type="button" class="btn-big" onclick="editReqComment(${comment.id})" value="Edit"><input type="button" onclick="delReqComment(${comment.id})" class="btn-big" value="Delete">`
          <?php } elseif (is_logged_in()){
            ?>
            if (comment.nick == "<?=$_user[ "nick" ]?>") {
              buttons = `<input type="button" class="btn-big" onclick="editReqComment(${comment.id})" value="Edit">`
            }
          <?php }
          ?>

            reqcommentlist.append(`
            <span class="yellow">${htmlEncode(comment.user)}</span>
            <span>DATE:</span>
            <span class="white">${comment.time}</span>
            </div>
            <div class="bg-secondary col-12 ap-1 amb-1">
            <span id="comment${comment.id}"class="cyan" style="white-space: pre-wrap;">${htmlEncode(comment.comment)}</span>
            <div class="col-12 p-0 m-0 apt-1">
            ${buttons}
            </div>`);
        });
      });
    }

    $(function() {
      getReqComments();
    });
  </script>

<div class="modal-body row m-0 p-0">
  <div class="col-lg-8 order-md-1 order-lg-2 order-xl-2">
	<div id="messages" class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1"></div>
    <?php
if ($req_available) {
         
					$title=$result->title;
					$description=$result->description;
          $user=$result->user;
          switch ($result->status) {
            case 0:
              $status = "Open";
              break;
            case 1:
              $status = "Closed (Fulfilled)";
              break;
            case 2:
              $status = "Closed (Unfulfilled)";
              break;
          }
          
	                        ?>

      <div class="row apb-1">
        <div class="header col-lg-12">
          <h2 class="ap-1 bg-header"><?=$title?></h2>
        </div>
      </div>

      <div class="apb-1">
        <span class="white">Title: </span><?=$title?>
      </div>
      <div class="apb-1">
        <span class="white">Requested By: </span><?=$user?>
      </div>
      <div class="apb-1">
        <span class="white">Current Status: </span><?=$status?>
      </div>
      <div class="apb-1">
        <span class="white">Description: </span>
      </div>
        <div class="bg-secondary col-12 ap-1 amb-1">
          <?=$description?>
        </div>
        
        <?php
      if (($result->requserid==$_user['id']) || is_admin()) {
        if ($status=="Open") {
        ?>
  <div class="row aml-1 apl-1 apr-1">
    <div class="col-12 p-0 m-0 apb-1">
      <input type="button" class="btn-big" align="right" onclick="updateReqStatus(1)" value="Close Request (Fulfilled)">
      <input type="button" class="btn-big" align="right" onclick="updateReqStatus(2)" value="Close Request (Unfulfilled)">
  </div>
</div>
        
        <?php
        } else {
        ?>
  <div class="row aml-1 apl-1 apr-1">
    <div class="col-12 p-0 m-0 apb-1">
      <input type="button" class="btn-big" align="right" onclick="updateReqStatus(0)" value="Re-open Request">
  </div>
</div>
        
        <?php
        }
      }
      ?>
      <div class="apb-1">
        <span class="white">Comments: </span>
      </div>


<div class="col-8">
 <div id="reqcomments">
  </div>
  </div>
  <div id="addreqcomment" >
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
    <div class="col-12 p-0 m-0 apt-1">
      <input type="button" class="btn-big" onclick="sendReqComment()" align="right" value="Comment">
    </div>
  </div>
</div>
</div>
<div id="editreqcomment" style="display:none" >
  <div class="row">
    <div class="col-12 apb-1">
      <span class="white">Edit Your Comment...</span>
    </div>
  </div>
  <div class="row">
    <div class="col-12">
      <textarea rows="5" class="w-100" id="user_edit_req_comment"></textarea>
      <input type="hidden" id="user_edit_req_comment_id"/>
    </div>
    <div class="col-12 apt-1">
      <input type="button" class="btn-big" onclick="cancelReqEdit()" align="right" value="Cancel">
      <input type="button" class="btn-big" onclick="sendEditedReqComment()" align="right" value="Save">
    </div>
  </div>
</div>

  <?php

} else {
	                        ?>
                                <div class="row">
                                        <div class="col-lg-12">
                                                <div class="bs-component aml-1 amb-1">
                                                        <div class="alert alert-danger">
                                                                 request not found
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

