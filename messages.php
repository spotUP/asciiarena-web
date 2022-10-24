<?php
include_once "session.php";
$h1 = "MAiL";
include_once "header.php";
?>

<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
    <?php
		if (is_logged_in()) {
    ?>
    <ul class="nav nav-tabs" id="myTab" role="tablist">
      <li class="nav-item">
        <a class="nav-link active" id="inboxTab" data-toggle="tab" onclick="getMessages(1,1)" href="#msgList" role="tab" aria-controls="msgList" aria-selected="true">Inbox</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-toggle="tab" id="outboxTab" onclick="getMessages(2,1)" href="#msgList" role="tab" aria-controls="msgList" aria-selected="false">Outbox</a>
      </li>
      
      <li class="nav-item">
        <a class="nav-link" data-toggle="tab" id="newMsgTab" onclick="newMessage()" href="#newMessage "role="tab" aria-controls="newMessage" aria-selected="false">New message</a>
      </li>

      
    </ul>
    <div class="row apb-1 apl-1">
      <input type="hidden" id="inboxId" value="1">
    </div>
    <div id="alerts"></div>
    <div role="tabpanel" aria-labelledby="newMsgTab" id="newMessage" style="display:none"  class="container-fluid bg-secondary amb-1 apb-1">
      <div class="row apt-1 apb-1 apl-1 apr-1">
        Receiver: 
        <select class="select2" style="margin-left: 8px;" id="posttomember">
          <option selected="selected" value="">Select User</option>
          <?php
          $ask = $_db->prepare("SELECT id,nick FROM users ORDER BY nick ASC");
          $ask->execute();
          $rows = $ask->fetchAll(PDO::FETCH_OBJ);
          foreach($rows as $row) {
            $nick = htmlspecialchars($row->nick);
            echo "<option value='$row->id' >$nick</option>";
          }
          ?>
        </select>
        <script>
          $('.select2').select2();
        </script>
      </div>

      <div class="row apl-1 apr-1">
        Subject:
      </div>

      <div class="row apb-1 apl-1 apr-1">
        <input id="postnewsubject" class="w-100" type="text" >
      </div>

      <div class="row apb-1 apl-1 apr-1">
        <textarea clasS="w-100" rows="16" id="postnewmessage"></textarea>
      </div> 
      <div class="row apl-1 apr-1">
        <input type="button" onclick="sendNewMessage()" value="Send Message!">
      </div>
    </div>
 
    <div id="msgDetails" style="display:none" class="container-fluid bg-secondary ap-1">
      <div class="row">
        <input type="hidden" id="replyid" value="">
        <div class="col-6">
          <span class="cyan">Date:</span>
          <span id="threadDate" class="white">thread date</span>
        </div>
        <div class="col-6">
          <span class="cyan text-truncate">Subject:</span> <span id="threadSubject" class="white">subject</span>
        </div>
      </div>
      <div class="row">
        <div class="col-6">
          <span class="cyan">From:</span>
          <span id="threadFromName" class="white">fromname</span>
        </div>
        <div class="col-6">
          <span class="cyan" style="white-space: pre;"> Status:</span>
          <span class="white">Private</span>
        </div>
      </div>
      <div class="row">
        <div class="col-6">
          <span class="cyan" style="white-space: pre;">  To:</span>
          <span id="threadToName" class="white">toname</span>
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <div class="bg-cyan" style="margin-bottom: 2px; margin-top: 12px; height: 2px; width: 100%"></div>
        </div>
      </div>
              
      <div id="msgThreadBody">
      </div>

      <div class="row">
        <div class="col-12">
          <textarea name="postmessage" id="postreply" class="w-100" style="height: 256px;"></textarea>
        </div>
      </div>
             
      <div class="row">
        <div class="col-12 apt-1">
          <input type="button" id="replybutton" onclick="sendreply()" value="Send">
          <span id="msgbutton"></span>
        </div>
      </div>
      <a id="dlfiledata" style="display:none"> </a>

		</div>

    <div role="tabpanel" aria-labelledby="inboxTab, outboxTab" id="msgList" class="row">
    </div>
			<?php
		} 
		else
		{
			?>
			<div class="col-lg-12">
				<div class="bs-component">
					<div class="animate__animated animate__shakeX alert alert-dismissible alert-primary">
						<button type="button" class="close" data-dismiss="alert">x</button>
						You need to be <a class="ascii" data-toggle="modal" style="padding-right: 8px;" href="#login">logged in</a>to use this feature.
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
</div>
<script>
  function downloadAttachment(e,msgid) {
    e.preventDefault();
    
    $.ajax({
      type: 'GET',
      url: '/cmds.php/get_message_attach/'+msgid
    }).done(function (data) {
      var a = $('#dlfiledata')
      a[0].href = data.filedata
      a[0].download = data.filename; //File name Here
      a[0].click(); //Downloaded file
    });   
  }
  

  function htmlEncode(s) {
    return $('<div>').text(s).html();
  }

  function sendNewMessage() {
  const receiver = $("#posttomember").val();
  const subject = $("#postnewsubject").val();
  const msgtext = $("#postnewmessage").val();
  
  if (receiver=="") {
    showAlert("You have not selected a receiver!", false);
    return;
  }
  
  if (subject==="") {
    showAlert("You have not entered the subject!", false);
    return;
  }
  
  if (msgtext=="") {
    showAlert("You have not entered the message!", false);
    return;
  }

  $.ajax({
        "type": "POST",
        "url": "/cmds.php/new_message",
        "data": {
          receiver: receiver,
          subject: subject,
          msgtext: msgtext
        },
        "success": () => {
          $("#posttomember").val("");
          $("#postnewmessage").val("");
          $("#postnewsubject").val("");
          showAlert("Message sent succesfully!", true);
          getMessages(1,1);
        },
        "error": () => {
          showAlert("An error occured sending the message!", false);
        }
      });
      
  }

  function newMessage() {
    $("#newMessage").show();
    $("#msgList").hide();
    $("#msgDetails").hide();
    
    $("#posttomember").val("");
    $("#postnewmessage").val("");
    $("#postnewsubject").val("");
    $('#postnewmessage').focus();  
  }
  
  function sendReply(msgid,threadid) {
    const replyText = $("#postreply").val();
    const replysubject = $("#threadSubject").text();
		if (replyText !== "") {
       $.ajax({
            "type": "POST",
            "url": "/cmds.php/reply_thread",
            "data": {
              thread: threadid,
              subject: replysubject, 
              msgtext: replyText,
              receiver: $("#replyid").val()
            },
            "success": () => {
              getMessageThread(msgid, threadid,1);
              $("#postreply").val("");
            },
            "error": () => {
              showAlert("An error occured sending the reply!", false);
              window.scrollTo(0, 0);
            }
          });
    }
  }
  
  function getMessageThread(msgid, threadid,page) {
    let a = $("#msg"+msgid);
    a.removeClass("yellow");
    a.addClass("green");

    $("#msgDetails").show();
    $("#newMessage").hide();
    $("#msgList").hide();
   
    let threadBody = $("#msgThreadBody");
    let count=0;
		threadBody.empty();   
    $('#postreply').val(""); 
		$('#postreply').focus();    
    
    $("#threadDate").text("");
    $("#threadSubject").text("");
    $("#threadFromName").text("");
    $("#threadToName").text("");
    $("#replybutton")[0].setAttribute("onclick","sendReply("+msgid+","+threadid+")");

    $.get("/cmds.php/get_message/"+msgid, function (msg) {
      let date = new Date(msg.timestamp * 1000);
      
      $("#threadDate").text(date.toDateString());
      $("#threadSubject").text(msg.subject);
      $("#threadFromName").text(msg.postername);
      $("#threadToName").text(msg.postedto);
      $("#replyid").val(msg.replyid);
    });
    
      
    $.get("/cmds.php/get_thread/"+msgid+"/"+threadid+"/"+page, function (data) {
      let pagesize = 20
      if (data.length>0) {
        cnt = data[0].total_count
      }
			
      $.each(data, function (i, msg) {
        count++;
        let file="";
          if (msg.filename) {           
            file = `<div onclick="downloadAttachment(event,${msg.id})"><a href="#"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text" viewBox="0 0 16 16"><path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/><path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/></svg>${msg.filename}</a></div>`
          }

        threadBody.append(`
        <div class="row">
          <div class="col-12 apt-1 apb-1">
            <span class="white" style="white-space: pre-wrap;">${htmlEncode(msg.message)}</span>
          </div>
        </div>
        ${file}
        <div class="row">
          <div class="col-1">
            <span class="cyan" style="white-space: pre-wrap;">${htmlEncode(msg.postername)}</span>
          </div>
        </div>
        <div class="row apb-1">
          <div class="col-12">
            <div class="bg-cyan" style="margin-bottom: 2px; margin-top: 12px; height: 2px; width: 100%"></div>
          </div>
        </div>`);
			});        

      let nextpage = page-1;
      let prevpage = page+1;
      let maxpage = ~~((cnt+pagesize-1) / pagesize)
      
      pagectrl = '<input class="m-2" type="button" '
      if (page >= maxpage) pagectrl = pagectrl + 'disabled '
      pagectrl = pagectrl + `onclick="getMessageThread(${msgid},${threadid},${prevpage})" value="Prev Page">`
      pagectrl = pagectrl + '<input class="m-2" type="button" '
      if (page<=1) pagectrl = pagectrl + 'disabled ';
      pagectrl = pagectrl + `onclick="getMessageThread(${msgid},${threadid},${nextpage})" value="Next Page">`
      page = maxpage - (page-1)
      pagectrl = pagectrl + `<span> Page ${page} of ${maxpage}</span>`
       
      $("#msgbutton").html(pagectrl);


      $('#postreply')[0].scrollIntoView(false);
      
    });
  }
  
  function getMessages(mailbox,page) {
    $("#msgList").show();
    $("#newMessage").hide();
    $("#msgDetails").hide();
    
    $("#inboxId").val(mailbox);
    let msglist = $("#msgList");
		msglist.empty();
    
    $.get("/cmds.php/get_messages/"+mailbox+"/"+page, function (data) {
      let cnt = 1
      let pagesize = 20
      if (data.length>0) {
        cnt = data[0].total_count
      }
			$.each(data, function (i, msg) {
        
        colour = "green";
        if ((msg.new==1) && (mailbox==1)) { colour="yellow" };

        let date = new Date(msg.timestamp * 1000);
        let dateStr = date.getDate().toString().padStart(2,"0")+"/"+date.getMonth().toString().padStart(2,"0")+" "+date.getHours().toString().padStart(2,"0")+":"+date.getMinutes().toString().padStart(2,"0");
        
        let msgtxt = `
          <div class="col-7">
            <a class="${colour} text-truncate !important;" id="msg${msg.id}" onclick="getMessageThread(${msg.id},${msg.thread},1)">${htmlEncode(msg.subject)}</a>
          </div>
          <div class="col-2">
            <span class="cyan">${mailbox==1 ? 'From:' : 'To:'}</span> <a class="yellow" href="/member/${mailbox==1 ? htmlEncode(msg.postername) : htmlEncode(msg.postedto)}" >${mailbox==1 ? htmlEncode(msg.postername) : htmlEncode(msg.postedto)}</a>           
          </div>
          <div class="col-2">
            <span class="cyan">Date:</span> <span class="white">${dateStr}</span>
          </div>`;
        if (mailbox==1) {
          msgtxt+=`
          <div class="col-1">
            <div class="float-right apr-1"><input type="button" onclick="deleteMessage(${msg.thread})"; value="Delete"></div>
          </div>`
        }
          
        msglist.append(msgtxt);
        
			});
        let nextpage = page+1;
        let prevpage = page-1;
        let pagectrl = '<div class="apt-1 col-5">'
        let maxpage = ~~((cnt+pagesize-1) / pagesize)
        
        pagectrl = pagectrl + '<input class="m-2" type="button" '
        if (page<=1) pagectrl = pagectrl + 'disabled '
        pagectrl = pagectrl + `onclick="getMessages(${mailbox},${prevpage})" value="Prev Page">`
        pagectrl = pagectrl + '<input class="m-2" type="button" '
        if (page >= maxpage) pagectrl = pagectrl + 'disabled ';
        pagectrl = pagectrl + `onclick="getMessages(${mailbox},${nextpage})" value="Next Page">`
        pagectrl = pagectrl + `<span> Page ${page} of ${maxpage}</span>`
         
        pagectrl = pagectrl + "</div>"

        msglist.append(pagectrl);
		});    
  }
  
  function deleteMessage(threadid) {   
    $.ajax({
					"type": "POST",
					"url": "/cmds.php/delete_message/"+threadid,
					"success": () => {
            showAlert("Message deleted", true);
            getMessages($("#inboxId").val(),1);
					},
          "error": () => {
            showAlert("An error occured deleting the message!", false);
          }          
				});
  }

	function showAlert(content,success) {
    if (success) {
      alertContent = `<div id="#success-alert" class="bs-component quick-alert animate__animated animate__bounceIn alert alert-success">${content}</div>`;
    } else {
      alertContent = `<div id="#failure-alert" class="bs-component quick-alert animate__animated animate__shakeX alert alert-warning">${content}</div>`;
    }
		$("#alerts").prepend(alertContent).children().first().delay(2000).slideUp();
	}
  
  function getQueryParam(param, defaultValue = undefined) {
    location.search.substr(1)
        .split("&")
        .some(function(item) { // returns first occurence and stops
            return item.split("=")[0] == param && (defaultValue = item.split("=")[1], true)
        })
    return defaultValue
}

	$(function() {
    let msguser = getQueryParam('sendmsg','');
    
    if (msguser.length==0) {
      getMessages(1,1);    
    } else {
      newMessage();
      $('#posttomember').val(msguser).trigger('change');
    }
	});
    
</script>
<?php include "footer.php"; ?>
