<?php
require_once "session.php";
require_once "tools/text.php";
$h1 = "REQUEST";

$reqid = $_GET['id'];
$result = fetchOne("select requests.*, users.nick user from requests LEFT JOIN users on users.id = requests.requestedby where requests.id=:reqid", [ 'reqid' => $reqid ]);

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

    function getReqComments() {
      let commentlist = $("#comments");
      commentlist.empty();
      $.ajax({
        type: 'GET',
        url: '/cmds.php/get_req_comments/<?=$reqid?>'
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

          commentlist.append(`
            <div class="header bg-header col-12 ap-1 text-truncate">
            <span> BY:</span>
            <span class="yellow">${htmlEncode(comment.user)}</span>
            <span>DATE:</span>
            <span class="white">${comment.time}</span>
            </div>
            <div class="bg-secondary col-12 ap-1 amb-1">
            <span id="comment${comment.id}"class="cyan" style="white-space: pre-wrap;">${htmlEncode(comment.comment)}</span>
            <div class="col-12 p-0 m-0 apt-1">
            ${buttons}
            </div>
            </div>`); 
        });
      });   
    }

    getReqComments();
  </script>

<div class="modal-body row m-0 p-0">
  <div class="col-lg-8 order-md-1 order-lg-2 order-xl-2">
    <?php
if ($req_available) {
         
					$title=$result->title;
					$description=$result->description;
          $user=$result->user;
          
	                        ?>

      <div class="row apb-1">
        <div class="header col-lg-12">
          <h2 class="ap-1 bg-header"><?=$title?></h2>
        </div>
      </div>

      <div class="apb-1 col-8">
        <span class="white">Title: </span><?=$title?>
      </div>
      <div class="apb-1 col-4">
        <span class="white">Requested By: </span><?=$user?>
      </div>
      <div class="col-8">
        <span class="white">Description: </span><?=$description?>
      </div>
      <div class="apb-1"></div>


test
 <div id="comments">
  </div>
test2
  <div id="addcomment" >
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

