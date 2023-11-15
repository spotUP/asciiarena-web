<?php
define("NO_PING", true);
require_once "session.php";
require_once "functions.php";
require_once "tools/text.php";

function extractFileDiz($filename) {
    $ext = substr($filename, strrpos($filename,'.'), strlen($filename)-1); 	// extract extension 
    $tempDiz="temp.diz";
    $contents="";
    
    if (strtolower($ext) == ".dms") {		
      exec("/usr/bin/xdms d $filename >$tempDiz");
      if (file_exists($tempDiz))
      {
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
        unlink($tempDiz);
      }

    }

    if ((strtolower($ext) == ".lha") || (strtolower($ext) == ".lzh")) {

      $lhal = shell_exec('/usr/bin/lha l "'.$filename.'"');
      $fileids = array();
      foreach (explode("\n", $lhal) as $l) {
        if (preg_match('/%\s+[A-Za-z]+\s+\d+\s+\d{4}\s+(.*file_id\.diz)$/i', $l, $m)) $fileids[] = $m[1];
      }
      
      foreach ($fileids as $fileid) {
        shell_exec('/usr/bin/lha pq "'.$filename.'" "'.$fileid.'" | sed 1,3d >'.$tempDiz);
        if (file_exists($tempDiz))
        {
          $size_check = filesize($tempDiz);
          if ($size_check>0)
          {
            $handle = fopen($tempDiz, "r");
            $contents = fread($handle, filesize($tempDiz));
            fclose($handle);
          }
          unlink($tempDiz);
          if ($size_check>0) break;
        }

      }			
    }
    
    if (strtolower($ext) == ".txt") 
    { 
      $word1='@BEGIN_FILE_ID.DIZ';
      $word2='@END_FILE_ID.DIZ';

      $handle = fopen($filename, "r");
      $txtcontents = fread($handle, filesize($filename));
      fclose($handle);

      list($junk, $good) = explode('@BEGIN_FILE_ID.DIZ', $txtcontents);
      list($good, $junk) = explode('@END_FILE_ID.DIZ', $good);

      if (strlen ($good) > 0)
      {
        $contents = $good;
      }
    }

    if (strtolower($ext) == ".zip")
    {
      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
       exec("/usr/bin/unzip -p -Ca $filename file_id.diz >$tempDiz");
       $size_check = filesize($tempDiz);
       if ($size_check > 0)
       {
        $handle = fopen($tempDiz, "r");
        $contents = fread($handle, filesize($tempDiz));
        fclose($handle);
      }
    }

    if (file_exists($tempDiz)) unlink($tempDiz);
  }

  return $contents;
}


function login() {
  global $_user;
  $login = false;
  $pw = $_POST[ "password" ] ?? "";
  $ni = $_POST[ "nick" ] ?? "";
  $loc = $_POST[ "location" ] ?? "/";
  $spw = fetchOne("SELECT pwhash FROM users WHERE (nick = :nick OR mail = :mail)", [ ":nick" => $ni, ":mail" => $ni ])->pwhash;
  if (preg_match('/^[a-f0-9]{32}$/i', $spw)) {
    $login = fetchOne("SELECT id,nick,crew,`rank`,crt_effect FROM users WHERE pwhash = :pwhash AND (nick = :nick OR mail = :mail)", [
      ":pwhash" => md5($pw),
      ":nick" => $ni,
      ":mail" => $ni
    ]);
    if ($login) {
      $pwhash = password_hash($pw, PASSWORD_BCRYPT, array('cost' => 13));
      doQuery("UPDATE users SET pwhash=:pwhash WHERE id=:id", [ ":pwhash" => $pwhash, ":id" => $login->id ]);
    }
  } else {
    if (password_verify($pw, $spw)) {
      $login = fetchOne("SELECT id,nick,crew,`rank`,crt_effect FROM users WHERE (nick = :nick OR mail = :mail)", [ ":nick" => $ni, ":mail" => $ni ]);
    }
  }
  if ($login) {
    $_user = $_SESSION[ "_user" ] = [
      "id" => $login->id,
      "nick" => $login->nick,
      "crew" => $login->crew,
      "rank" => $login->rank,
      "settings" => [
        "crt_effect" => $login->crt_effect,
      ]
    ];
    if (isset($_POST["rememberme"]) && $_POST["rememberme"] == 1) setremember();
    doQuery("INSERT INTO lastusers (nick, crew, user_id, timestamp) VALUES (:nick, :crew, {$login->id}, UNIX_TIMESTAMP())", [
      ":nick" => $_user[ "nick" ],
      ":crew" => $_user[ "crew" ]
    ]);
    doQuery("UPDATE users SET lastactive = UNIX_TIMESTAMP() WHERE id = {$login->id}");
    if (is_ajax()) { ?>
      <script>window.location.replace('<?=addslashes($loc)?>');</script>
      <?php 
      exit;
    }
  } else {
    if (is_ajax()) { ?>
      <div class="bs-component quick-alert amb-1" id="login-failure" style="display: none;">
        <div id="#danger-alert" class="animate__animated animate__shakeX alert alert-danger">authentication failed</div>
      </div>
      <script>$('#login-failure').fadeIn('slow').delay(2000).fadeOut('slow');</script>
      <?php 
      exit;
    }
  }
  exit;
}

function logout() {
  global $_user;
  $_user = $_SESSION[ "_user" ];
  doQuery("UPDATE users SET lastactive = UNIX_TIMESTAMP()-300 WHERE id = {$_user['id']}");
  $_SESSION = [];
  if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params[ "path" ], $params[ "domain" ], $params[ "secure" ], $params[ "httponly" ]);
  }
  session_destroy();
  if (isset($_COOKIE['aarm'])) setcookie('aarm', '', (time()-86400), '/', 'asciiarena.se', true, true);
}

function tag() {
  global $_user;
  $_user = $_SESSION[ "_user" ];
  $text = $_POST[ 'tagtext' ] ?? "";
  $text = strip_tags($text);
  $wall = $_POST[ 'wall_id' ] ?? 1;
  if (!empty($text) && is_logged_in()) {
    doQuery("INSERT INTO wallposts (user_id, wall_id, nick, tag) VALUES (:user_id, :wall_id, :nick, :text)", [
      ":user_id" => $_user[ "id" ],
      ":wall_id" => (int)$wall,
      ":nick" => $_user[ "nick" ],
      ":text" => $text
    ]);
  }
  if (is_ajax()) {
    foreach (fetchAll("(SELECT * FROM wallposts WHERE wall_id = :wall_id ORDER BY id DESC LIMIT 13) ORDER BY id ASC", [":wall_id" => (int)$wall]) as $row) { ?>
        <div class="col-10 d-flex">
          <span class="cyan text-truncate" style="white-space: pre"><?=$row->tag?></span>
        </div>
        <div class="col-2 text-right">
          <span class="lightpink"><a href="/member/<?=urlsafe($row->nick)?>"><?=$row->nick?></a></span>
        </div>

    <?php }
    exit();
  }
}

function countDownload($collyid) {
  if (is_ajax() && is_logged_in()) {
    $colly = $_POST[ "colly_id" ] ?? $collyid ?? 0;
    if ($colly > 0) {
      $status = doQuery("update collys set downloads=downloads+1 where id = :colly_id",[
        ":colly_id" => (int)$colly,
      ]);
      $code = ($status) ? 200 : 400;
      exit(json_out([
        "status" => $status
      ], $code));
    }
    exit(json_out(["status" => false], 400));
  }
}

function countView($collyid) {
  if (is_ajax() && is_logged_in()) {
    $colly = $_POST[ "colly_id" ] ?? $collyid ?? 0;
    if ($colly > 0) {
      $status = doQuery("update collys set view_counter=view_counter+1 where id = :colly_id",[
        ":colly_id" => (int)$colly,
      ]);
      $code = ($status) ? 200 : 400;
      exit(json_out([
        "status" => $status
      ], $code));
    }
    exit(json_out(["status" => false], 400));
  }
}

function brokenColly($collyid) {
  if (is_ajax() && is_logged_in()) {
    $colly = $_POST[ "colly_id" ] ?? $collyid ?? 0;
    $comment = $_POST[ 'comment' ] ?? "";
    if ($colly > 0) {
      $status = doQuery("update collys set broken=1, broken_comment=:comment where id = :colly_id",[
        ":colly_id" => (int)$colly,
        ":comment" => $comment
      ]);
      $code = ($status) ? 200 : 400;
      exit(json_out([
        "status" => $status
      ], $code));
    }
    exit(json_out(["status" => false], 400));
  }
}

function getComments($collyid) {
  if (is_ajax()) {
    $colly = $_POST[ "colly_id" ] ?? $collyid ?? 0;
    if ($colly > 0) {
      $data = [];
      $comments = fetchAll("SELECT commentid,timestamp,nick,ifnull(rating,'') as rating,comment FROM comments WHERE colly_id = :id", [":id" => $colly]);
      foreach($comments as $comment) {
        $data[] = [
          "id" => (int)$comment->commentid,
          "time" => date("Y-m-d H:i",$comment->timestamp),
          "nick" => $comment->nick,
          "rating" => $comment->rating,
          "comment" => $comment->comment
        ];
      }
      exit(json_out($data));
    }
    exit(json_out(["status" => false], 404));
  }  
}

function deleteComment($collyid) {
  if (is_ajax() && is_logged_in() &&is_admin()) {
    $id = $_POST[ "comment_id" ] ?? $collyid ?? 0;
    $colly = $_POST[ "colly_id" ] ?? 0;
    if ($id > 0) {
      $status = doQuery("delete from comments where commentid = :commentid",[
        ":commentid" => (int)$id,
      ]);
      $code = ($status) ? 200 : 400;
      doQuery("update collys set rating=(select avg(rating) AS avg from comments where colly_id=:colly_id and rating>0) where id=:colly_id",[
        ":colly_id" => (int)$colly,
      ]);
      recalculate_ratings();
      exit(json_out([
        "status" => $status
      ], $code));
    }
    exit(json_out(["status" => false], 400));
  }
}

function editComment($collyid) {
  global $_user;
  if (is_ajax() && is_logged_in()) {
    $id = $_POST[ "comment_id" ] ?? $collyid ?? 0;
    $comment = $_POST[ 'comment' ] ?? "";
    if ($id > 0) {
      if (is_admin()) {
        $admin=1;
      } else {
        $admin=0;
      }
      $status = doQuery("update comments set comment = :comment where (:admin = 1 or nick = :nick) and commentid = :commentid",[
        ":commentid" => (int)$id,
        ":comment" => $comment,
        ":nick" => $_user[ "nick" ],
        ":admin" => $admin
      ]);
      $code = ($status) ? 200 : 400;
      exit(json_out([
        "status" => $status
      ], $code));
    }
    exit(json_out(["status" => false], 400));
  }
}

function addComment($collyid) {
  global $_user;
  if (is_ajax() && is_logged_in()) {
    $colly = $_POST[ "colly_id" ] ?? $collyid ?? 0;
    $comment = $_POST[ 'comment' ] ?? "";
    $rating = $_POST[ 'rating' ] ?? "";
    if (empty($rating)) $rating = null;

    if (!is_null($rating)) {
      $status = doQuery("update comments set rating = null where colly_id=:colly_id and user_id=:user_id",[
        ":colly_id" => (int)$colly,
        ":user_id" => $_user[ "id" ],
      ]);
    }

    if ($colly > 0) {
      $status = doQuery("insert into comments (colly_id, filename, crew, artist, comment, rating, nick, timestamp,user_id) 
        values (:colly_id,:filename,(select group_concat(w.name) from collys_crews cc LEFT JOIN crews w ON w.id=cc.crew_id where cc.colly_id=:colly_id group by cc.colly_id),(select group_concat(a.nick) from artists_collys ac LEFT JOIN artists a ON a.id=ac.artist_id where ac.colly_id=:colly_id GROUP BY ac.colly_id),:comment, :rating, :nick, :time, :user_id)",[
          ":colly_id" => (int)$colly,
          ":filename" => $_SESSION['filename'],
          ":comment" => $comment,
          ":rating" => $rating,
          ":nick" => $_user[ "nick" ],
          ":time" => time(),
          ":user_id" => $_user[ "id" ],
        ]);
      $code = ($status) ? 200 : 400;
      doQuery("update collys set rating=(select avg(rating) AS avg from comments where colly_id=:colly_id and rating>0) where id=:colly_id",[
        ":colly_id" => (int)$colly,
      ]);
      recalculate_ratings();

      exit(json_out([
        "status" => $status
      ], $code));
    }
    exit(json_out(["status" => false], 400));
  }
}

function faveColly($collyid) {
  global $_user;
  if (is_ajax() && is_logged_in()) {
    $colly = $_POST[ "colly_id" ] ?? $collyid ?? 0;
    if ($colly > 0) {
      $status = doQuery("INSERT INTO favourites (user_id, colly_id, nick, filename)
        VALUES (:user_id, :colly_id, :nick, :filename)", [
          ":user_id" => $_user[ "id" ],
          ":colly_id" => (int)$colly,
          ":nick" => $_user[ "nick" ],
          ":filename" => $_SESSION['filename']
        ]);
      $code = ($status) ? 200 : 400;
      exit(json_out([
        "status" => $status
      ], $code));
    }
    exit(json_out(["status" => false], 400));
  }  
}

function unfaveColly($collyid) {
  global $_user;
  if (is_ajax() && is_logged_in()) {
    $colly = $_POST[ "colly_id" ] ?? $collyid ?? 0;
    if ($colly > 0) {
      $status = doQuery("DELETE FROM favourites WHERE user_id = :user AND colly_id = :colly", [
        ":user" => $_user[ "id" ],
        ":colly" => (int)$colly
      ]);
      $code = ($status) ? 200 : 400;
      exit(json_out([
        "status" => $status
      ], $code));
    }
    exit(json_out(["status" => false], 400));
  }
}

function saveArtist() {
  if (is_ajax() && is_logged_in()) {

    $q = "select count(*) as cnt from artists where nick=:nick";
    $data = [
      ":nick" => $_POST[ "nick" ] ?? ""
    ];
    $count = fetchOne($q, $data);
    if (((int)$count->cnt) >0) {
      exit(json_out(["status" => true], 409));     
    }

    $data = [
      ":nick" => $_POST[ "nick" ] ?? "",
      ":acronym" => $_POST[ "acronym" ] ?? "",
      ":www" => $_POST[ "www" ] ?? "",
      ":country" => $_POST[ "country" ] ?? "",
      ":active" => $_POST[ "active" ] ?? "",
      ":artisturl" => urlsafe($_POST[ "nick" ] ?? ""),
    ];

    $q = "INSERT INTO artists (nick, acronym, www, active, country, artisturl) VALUES (:nick, :acronym, :www, :active, :country, :artisturl)";
    $response = 201;
    $id = "";

    if(!doQuery($q, $data)) {
      exit(json_out(["status" => true], 400));  
    }			
    
    $crewnames = $_POST[ "crewname" ] ?? [];     

    if(!empty($crewnames)) {
      foreach($crewnames as $crewname) {
        $q = "INSERT INTO member_of (crew,nick) select :crew, :nick where (select count(*) from member_of where crew = :crew and nick = :nick)=0";
        $data = [
          ":crew" => $crewname ?? "",
          ":nick" => $_POST[ "nick" ] ?? ""

        ];
        if(!doQuery($q, $data)) {
          exit(json_out(["status" => true], 400));     
        }
      }
    }

    exit(json_out(["status" => true], $response));    
  }
}

function saveCrew() {
  if (is_ajax() && is_logged_in()) {

    $q = "select count(*) as cnt from crews where name=:name";
    $data = [
      ":name" => $_POST[ "name" ] ?? ""
    ];
    $count = fetchOne($q, $data);
    if (((int)$count->cnt) >0) {
      exit(json_out(["status" => true], 409));     
    }

    $data = [
      ":name" => $_POST[ "name" ] ?? "",
      ":acronym" => $_POST[ "acronym" ] ?? "",
      ":contact" => $_POST[ "contact" ] ?? "",
      ":crewurl" => urlsafe($_POST[ "name" ] ?? ""),
      ":rating" => null,
      ":www" => $_POST[ "www" ] ?? "",
      ":active" => $_POST[ "active" ] ?? "",
    ];

    $q = "INSERT INTO crews (name, acronym, contact, crewurl, rating, www, active) VALUES (:name, :acronym, :contact, :crewurl, :rating, :www, :active)";
    $response = 201;

    if(!doQuery($q, $data)) {
      exit(json_out(["status" => true], 400));     
    }
    
    $bbsnames = $_POST[ "bbsname" ] ?? [];     

    if(!empty($bbsnames)) {
      foreach($bbsnames as $bbsname) {
        $q = "INSERT INTO bbs_of (name,crew) select :name, :crew where (select count(*) from bbs_of where name = :name and crew = :crew)=0";
        $data = [
          ":name" => $bbsname ?? "",
          ":crew" => $_POST[ "name" ] ?? ""
        ];
        if(!doQuery($q, $data)) {
          exit(json_out(["status" => true], 400));     
        }

      }
    }

    exit(json_out(["status" => true], $response));			
  }
}

function saveBBS() {
  if (is_ajax() && is_logged_in()) {
    $q = "select count(*) as cnt from bbses where name=:name";
    $data = [
      ":name" => $_POST[ "name" ] ?? ""
    ];
    $count = fetchOne($q, $data);
    if (((int)$count->cnt) >0) {
      exit(json_out(["status" => true], 409));     
    }

    $data = [
      ":name" => $_POST[ "name" ] ?? "",
      ":address" => $_POST[ "address" ] ?? "",
      ":sysop" => $_POST[ "sysop" ] ?? "",
      ":number" => $_POST[ "number" ] ?? "",
      ":country" => $_POST[ "country" ] ?? "",
      ":software" => $_POST[ "software" ] ?? "",
      ":online" => 0,
    ];

    if (($_POST[ "online" ] ?? "") == "on") {
      $data[":online"] = 1;
    }


    $q = "INSERT INTO bbses (name, address, sysop, number, country, online, software) VALUES (:name, :address, :sysop, :number, :country, :online, :software)";
    $response = 201;
    if(!doQuery($q, $data)) {
      exit(json_out(["status" => true], 400));
    }
    exit(json_out(["status" => true], $response));
  }
}

function dupeCheckColly() {
  if (is_ajax() && is_logged_in()) {
    $filename=$_GET[ "filename" ];
    $q = "select count(*) as cnt from collys where filename=:filename";
    $data = [
      ":filename" => $filename
    ];
    $count = fetchOne($q, $data);
    $data = [
      "count"=>$count->cnt
    ];
    exit(json_out($data));     
  }
}

function saveColly() {
  global $_user;
  if (is_ajax() && is_logged_in()) {

    $filename = $_FILES['filename']['name'];

    $q = "select count(*) as cnt from collys where name=:name or filename=:filename";
    $data = [
      ":name" => $_POST[ "name" ] ?? "",
      ":filename" => $filename,
    ];
    $count = fetchOne($q, $data);
    if (((int)$count->cnt) >0) {
      exit(json_out(["status" => true], 409));     
    }      

      $ext = substr($filename, strrpos($filename,'.')+1); 	// extract extension      
      $upload_path = "collections/";
      if(!is_writable($upload_path)) {								// upload dir ok?
        exit(json_out(["status" => false, "result" => "You can not upload to the specified directory, inform an Admin!"], 400));     
      }
      
      $filesize = filesize($_FILES['filename']['tmp_name']);
      if(((int)$filesize)>10240000) {								
        exit(json_out(["status" => false, "result" => "The file is too large, contact an admin to upload this file"], 400));     
      }

      $dirname = explode(".", $filename);
      $dirname = $dirname[0];

      $filen = $upload_path . $dirname . '/' . basename($_FILES['filename']['name']); 		// fetch filename with path
      mkdir($upload_path.$dirname, 0755, TRUE);
      if(!move_uploaded_file($_FILES['filename']['tmp_name'], $filen)) { 
        exit(json_out(["status" => false, "result" => "An error occured while saving the uploaded file."], 400));     
      }

      
      $type = 'ASCII';
      if (in_array(strtolower($ext), array('ans'))) $type = 'ANSI';
      if (in_array(strtolower($ext), array('dms,','lzh','lha', 'zip'))) $type = 'Archive';

      $fileDiz = extractFileDiz($filen);
      $dizName = $upload_path.$dirname.'/'.$filename.'.diz';
      
      $crewnames = $_POST[ "crewname" ] ?? [];     
      $artistnames = $_POST[ "artistname" ] ?? [];     
      
      if (strlen($fileDiz)<1) {
        file_put_contents($dizName, $_POST[ "name" ]." by ".join(",",$artistnames));
      } else {
        file_put_contents($dizName, $fileDiz);
      }
      
      $file_id_name = $filename.'.diz';

      $data = [
        ":name" => $_POST[ "name" ] ?? "",
        ":filename" => $filename ?? "",
        ":year" => $_POST[ "year" ] ?? 1900,
        ":month" => $_POST[ "month" ] ?? 1,
        ":day" => $_POST[ "day" ] ?? 1,
        ":type" => $_POST[ "type" ] ?? "",
        ":file_id" => $file_id_name,
        ":filesize" =>$filesize,
        ":uploader" =>$_user['nick'],
        ":type" =>$type,
        ":uploader_id" => $_user['id']
      ];
      
      $q = "INSERT INTO collys (name, filename, type, year, month, day, file_id,filesize,uploader,uploader_id,timestamp,view_counter,downloads,broken) VALUES (:name, :filename, :type, :year, :month, :day, :file_id, :filesize,:uploader,:uploader_id,UNIX_TIMESTAMP(),0,0,0)";
      $id = "";
      $response = 201;
      
      if(!doQuery($q, $data)) {
        exit(json_out(["status" => true], 400));     
      }

      if (empty($id)) {
        $rowInserted = fetchOne("SELECT LAST_INSERT_ID() rowid");
        $collyid = $rowInserted->rowid;
      }     

      if(!empty($crewnames)) {
        foreach($crewnames as $crewname) {
          $q = "INSERT INTO collys_crews (colly_id,crew_id) select :colly_id, id from crews where name = :name and (select count(*) from collys_crews where colly_id = :colly_id and crew_id = crews.id)=0";
          $data = [
            ":colly_id" => $collyid,
            ":name" => $crewname
            
          ];
          if(!doQuery($q, $data)) {
            exit(json_out(["status" => true], 400));     
          }       
        }
      }

      if(!empty($artistnames)) {
        foreach($artistnames as $artistname) {
          $q = "INSERT INTO artists_collys (colly_id,artist_id) select :colly_id, id from artists where nick = :nick and (select count(*) from artists_collys where colly_id = :colly_id and artist_id = artists.id)=0";
          $data = [
            ":colly_id" => $collyid,
            ":nick" => $artistname
            
          ];
          if(!doQuery($q, $data)) {
            exit(json_out(["status" => true], 400));     
          }
        }
      }

      exec("curl -H \"Content-Type: application/json\" -d '{\"username\": \"ASCII ARENA Uploads\", \"content\": \"A new ascii collection has just been uploaded to [asciiarena.se](https://asciiarena.se) by ".$_user[ "nick" ]." named ".addslashes($_POST[ "name" ])."\"}' \"https://discord.com/api/webhooks/1034089537544126494/MdurdpqtOlFhb2W2-N3xuRV4tW9lqXVhIDzl3tDez3W74A4QVCv3t0T70FVolfuGirYG\"");

      $link="https://asciiarena.se/release/".$filename;
      if(!empty($artistnames)) {
        $fbmessage = urlencode("\"".$_POST[ "name" ]."\" by ".implode(" ",$artistnames));
      } else if(!empty($crewnames)) {
        $fbmessage = urlencode("\"".$_POST[ "name" ]."\" by ".implode(" ",$crewnames));
      } else {
        $fbmessage = urlencode("\"".$_POST[ "name" ]."\"");
      }
      
      exec("curl -i -X POST \"https://graph.facebook.com/aSCIIaRENA/feed?message=".$fbmessage."&link=".$link."&access_token=EAALbaIZCnZBCoBAJL6BJGS6DqGTB6RkLeL4WE6ZBDfwVX9RwS6nCUUcgYO8HMz6srxKYZARI7bf0dZANuWKejZCkvEZBpfIZAZAtshMc9tnW48lDx5zixifRtssXDzi5tOJNLJGZArquUX27jCl5IjIQWhToAaqmZC4TW43MuVpojfRCzoNk5x2fINK\"");

      doQuery("update users set uploaded=uploaded+:pumped where id=:userid", [ 'pumped' => $filesize, 'userid' => $_user['id'] ]);
      exit(json_out(["status" => true], $response));
    }
  }

  function saveapp() {
    global $_user;
    if (is_ajax() && is_logged_in()) {

      $filename = $_FILES['file']['name'];
      $q = "select count(*) as cnt from apps where name=:name or filename=:filename";
      $data = [
        ":name" => $_POST[ "name" ] ?? "",
        ":filename" => $filename
      ];
      $count = fetchOne($q, $data);
      if (((int)$count->cnt) >0) {
        exit(json_out(["status" => true], 409));     
      }

      $allowed_filetypes = array('.lha','.LHA','.txt','.TXT','.dms','.DMS','.lzh','.LZH','.zip','.ZIP'); 	// allowed extensions
      $ext = substr($filename, strrpos($filename,'.'), strlen($filename)-1); 	// extract extension 
      if(!in_array($ext,$allowed_filetypes)) {									// filetype allowed?		
        exit(json_out(["status" => false, "data" =>$filename, "result" => "This filetype is not allowed here! Only LHA, LZH, DMS, ZIP and TXT can do it!"], 400));     
      }
      $upload_path = "apps/"; 												// upload dir
      if(!is_writable($upload_path)) {								// upload dir ok?
        exit(json_out(["status" => false, "result" => "You can not upload to the specified directory, inform an Admin!"], 400));     
      }
      
      $filesize = filesize($_FILES['file']['tmp_name']);
      if(((int)$filesize)>10240000) {								
        exit(json_out(["status" => false, "result" => "The file is too large, contact an admin to upload this file"], 400));     
      }

      $filen = $upload_path . basename($_FILES['file']['name']); 		// fetch filename with path
      if(!move_uploaded_file($_FILES['file']['tmp_name'], $filen)) {
        exit(json_out(["status" => false, "result" => "Error uploading file."], 400));     
      }

      $name=$_POST[ "name" ] ?? "";
      $author=$_POST[ "author" ] ?? "";

      $fileDiz = extractFileDiz($filen);
      $dizName = $upload_path.preg_replace('/\\.[^.\\s]{3,4}$/', '', $filename).'.diz';
      
      if (strlen($fileDiz)<1) {
        file_put_contents($dizName, "$name by $author");
      } else {
        file_put_contents($dizName, $fileDiz);
      }
      
      $file_id_name = $filename.'.diz';

      $data = [
        ":name" =>$name,
        ":author" =>$author,
        ":filename" => $filename ?? "",
        ":filesize" => $filesize,
        ":uploader" => $_user[ "nick" ],
        ":uploaderid" => $_user[ "id" ],
        ":file_id" => $file_id_name,
        ":year" => $_POST[ "year" ] ?? 1900,
        ":month" => $_POST[ "month" ] ?? 1,
        ":day" => $_POST[ "day" ] ?? 1,
      ];

      $q = "INSERT INTO apps (name, filename, filedate, timestamp, author, filesize, uploader_id, uploader, view_counter, downloads,file_id, year, month, day) VALUES (:name, :filename, null, UNIX_TIMESTAMP(), :author, :filesize, :uploaderid, :uploader,0,0,:file_id,:year,:month,:day)";
      $response = 201;

      if(!doQuery($q, $data)) {
        exit(json_out(["status" => true], 400));        
      }

      exec("curl -H \"Content-Type: application/json\" -d '{\"username\": \"ASCII ARENA Uploads\", \"content\": \"A new application has just been uploaded to [asciiarena.se](https://asciiarena.se) by ".$_user[ "nick" ]." named ".addslashes($name)."\"}' \"https://discord.com/api/webhooks/1034089537544126494/MdurdpqtOlFhb2W2-N3xuRV4tW9lqXVhIDzl3tDez3W74A4QVCv3t0T70FVolfuGirYG\"");

      doQuery("update users set uploaded=uploaded+:pumped where id=:userid", [ 'pumped' => $filesize, 'userid' => $_user['id'] ]);
      exit(json_out(["status" => true], $response));
    }
  }
  
  function saveMag() {
    global $_user;
    if (is_ajax() && is_logged_in()) {
      $filename = $_FILES['file']['name'];
      $q = "select count(*) as cnt from mags where name=:name or filename=:filename";
      $data = [
        ":name" => $_POST[ "name" ] ?? "",
        ":filename" => $filename
      ];
      $count = fetchOne($q, $data);
      if (((int)$count->cnt) >0) {
        exit(json_out(["status" => true], 409));     
      }

      $allowed_filetypes = array('.lha','.LHA','.txt','.TXT','.dms','.DMS','.lzh','.LZH','.zip','.ZIP'); 	// allowed extensions
      $ext = substr($filename, strrpos($filename,'.'), strlen($filename)-1); 	// extract extension 
      if(!in_array($ext,$allowed_filetypes)) {									// filetype allowed?		
        exit(json_out(["status" => false, "data" =>$filename, "result" => "This filetype is not allowed here! Only LHA, LZH, DMS, ZIP and TXT can do it!"], 400));     
      }

      $upload_path = "mags/"; 												// upload dir
      if(!is_writable($upload_path)) {								// upload dir ok?
        exit(json_out(["status" => false, "result" => "You can not upload to the specified directory, inform an Admin!"], 400));     
      }
      
      $filesize = filesize($_FILES['file']['tmp_name']);
      if(((int)$filesize)>10240000) {								
        exit(json_out(["status" => false, "result" => "The file is too large, contact an admin to upload this file"], 400));     
      }

      $dirname = explode(".", $filename);
      $dirname = $dirname[0];

      $filen = $upload_path . $dirname . '/' . basename($_FILES['file']['name']); 		// fetch filename with path
      mkdir($upload_path.$dirname, 0755, TRUE);     
      if(!move_uploaded_file($_FILES['file']['tmp_name'], $filen)) {
        exit(json_out(["status" => false, "result" => "Error uploading file."], 400));     
      }

      $name=$_POST[ "name" ] ?? "";
      $author=$_POST[ "author" ] ?? "";
      
      $fileDiz = extractFileDiz($filen);
      $dizName = $upload_path.$dirname.'/'.$filename.'.diz';
      
      if (strlen($fileDiz)<1) {
        file_put_contents($dizName, "$name by $author");
      } else {
        file_put_contents($dizName, $fileDiz);
      }
      
      $file_id_name = $filename.'.diz';

      $data = [
        ":name" => $name,
        ":author" => $author,
        ":filename" => $filename ?? "",
        ":file_id" => $file_id_name,
        ":filesize" =>$filesize,
        ":uploader" =>$_user['nick'],
        ":year" => $_POST[ "year" ] ?? 1900,
        ":month" => $_POST[ "month" ] ?? 1,
        ":day" => $_POST[ "day" ] ?? 1,
      ];

      $q = "INSERT INTO mags (name, filename, filedate, timestamp, author, filesize, file_id, view_counter, downloads, uploader, year, month, day) VALUES (:name, :filename, null, UNIX_TIMESTAMP(), :author, :filesize, :file_id, 0, 0, :uploader, :year, :month, :day)";
      $response = 201;

      if(!doQuery($q, $data)) {
        exit(json_out(["status" => true], 400));        
      }

      exec("curl -H \"Content-Type: application/json\" -d '{\"username\": \"ASCII ARENA Uploads\", \"content\": \"A new magazine has just been uploaded to [asciiarena.se](https://asciiarena.se) by ".$_user[ "nick" ]." named ".addslashes($name)."\"}' \"https://discord.com/api/webhooks/1034089537544126494/MdurdpqtOlFhb2W2-N3xuRV4tW9lqXVhIDzl3tDez3W74A4QVCv3t0T70FVolfuGirYG\"");     
      
      doQuery("update users set uploaded=uploaded+:pumped where id=:userid", [ 'pumped' => $filesize, 'userid' => $_user['id'] ]);
      exit(json_out(["status" => true], $response));

    }
  }
  
  function getMessage($msgId) {
    global $_user;
    if (is_ajax() && is_logged_in()) {

      $msg = fetchOne("SELECT * FROM messages WHERE id = :msgid", [":msgid" => $msgId]);
      
      $data = [
        "id" => (int)$msg->id,
        "thread" =>(int)$msg->thread,
        "postedto" =>$msg->postedto,
        "postername" =>$msg->postername,
        "subject" =>$msg->subject,
        "message" =>$msg->message,
        "replyid" =>$msg->to_id==$_user['id'] ? $msg->from_id : $msg->to_id,          
        "timestamp" =>$msg->timestamp,
      ];

      if(!empty($data)) {
        exit(json_out($data));
      }
      exit(json_out(["status" => false], 404));
    }  
  }

  function deleteMessage($threadId) {
    global $_user;
    if (is_ajax() && is_logged_in()) {

      $status = doQuery("delete FROM messages WHERE thread = :threadid and (to_id=:user_id)", [
        ":threadid" => $threadId,
        ":user_id" => $_user['id']
      ]);
      $code = ($status) ? 200 : 400;
      exit(json_out([
        "status" => $status
      ], $code));

      exit(json_out(["status" => false], 400));
    }  
  }

  function getMessages($msgboxId, $page) {
    global $_user;
    if (is_ajax() && is_logged_in()) {
      $data = [];
      
      $messages = [];
      
      $pagesize = 20;
      $start = ($page-1) * $pagesize;
      $cnt = 0;
      
      $user = $_user['id'];
      
      if ((int)$msgboxId==1) {
        $messages = fetchAll("SELECT * FROM messages WHERE to_id = :user_id GROUP BY thread ORDER BY timestamp DESC LIMIT $start, $pagesize", [":user_id" => $user]);
        $cnt= fetchOne("select count(distinct thread) cnt FROM messages WHERE to_id = :user_id", [":user_id" => $user]);
      } else if ((int)$msgboxId == 2) {
        $messages = fetchAll("SELECT * FROM messages WHERE from_id = :user_id GROUP BY thread ORDER BY timestamp DESC LIMIT $start, $pagesize", [":user_id" => $user]);
        $cnt= fetchOne("select count(distinct thread) cnt FROM messages WHERE from_id = :user_id", [":user_id" => $user]);
      }
      
      foreach($messages as $msg) {
        $data[] = [
          "total_count" => (int)$cnt->cnt,
          "id" => (int)$msg->id,
          "thread" =>(int)$msg->thread,
          "postedto" =>$msg->postedto,
          "postername" =>$msg->postername,
          "subject" =>$msg->subject,         
          "message" =>$msg->message,
          "new" =>$msg->new,
          "timestamp" =>$msg->timestamp,
        ];
      }
      if(!empty($data)) {
        exit(json_out($data));
      }
      exit(json_out(["status" => false], 404));
    }  
  }

  function getMessageThread($msgId, $threadId, $page) {
    global $_user;
    if (is_ajax() && is_logged_in()) {
      $data = [];
      
      $pagesize = 20;

      $cnt= fetchOne("select count(id) cnt FROM messages WHERE thread = :thread", [ 'thread' => $threadId ]);
      $maxpage = (int)(($cnt->cnt + $pagesize - 1 ) / $pagesize);
      $start = ($maxpage - $page) * $pagesize;
      
      doQuery("update messages set new=0 where thread=:thread and to_id=:user_id",[ 'thread' => $threadId,":user_id" => $_user['id']]);      
      $messages = fetchAll("select * from messages where thread = :thread LIMIT $start, $pagesize", [ 'thread' => $threadId ]);
      
      foreach($messages as $msg) {
        $data[] = [
          "total_count" => (int)$cnt->cnt,
          "id" => (int)$msg->id,
          "thread" =>(int)$msg->thread,
          "postedto" =>$msg->postedto,
          "postername" =>$msg->postername,
          "subject" =>$msg->subject,
          "message" =>$msg->message,
          "filename" =>$msg->attach_filename,
          "timestamp" =>$msg->timestamp,
        ];
      }
      if(!empty($data)) {
        exit(json_out($data));
      }
      exit(json_out(["status" => false], 404));
    }  
  }

  function newMessage() {
    global $_user;

    if (is_ajax() && is_logged_in()) {
      $msgtext = $_POST[ 'msgtext' ] ?? "";
      $subject = $_POST[ 'subject' ] ?? "";
      $touserid = $_POST[ 'receiver' ] ?? "";
      
      $status = doQuery("insert into messages (thread,from_id,to_id,postedto,postername,timestamp,subject,message,new,unread) 
        select ifnull(max(thread)+1,1),:user_id,:touserid,(select nick from users where id=:touserid),(select nick from users where id=:user_id),UNIX_TIMESTAMP(),:subject,:msgtext,1,1 from messages",[
          ":user_id" => $_user[ "id" ],
          ":subject" => $subject,
          ":touserid" => $touserid,
          ":msgtext" => $msgtext
        ]);
      $code = ($status) ? 200 : 400;

      exit(json_out([
        "status" => $status
      ], $code));
    }
    
  }

  function replyMessage() {
    global $_user;

    if (is_ajax() && is_logged_in()) {
      $thread = (int)$_POST[ "thread" ] ?? 0;
      $msgtext = $_POST[ 'msgtext' ] ?? "";
      $subject = $_POST[ 'subject' ] ?? "";
      $touserid = $_POST[ 'receiver' ] ?? "";
      
      if ($thread > 0) {
        $status = doQuery("insert into messages (thread,from_id,to_id,postedto,postername,timestamp,subject,message,new,unread) 
          values (:thread_id,:user_id,:touserid,(select nick from users where id=:touserid),(select nick from users where id=:user_id),UNIX_TIMESTAMP(),:subject,:msgtext,1,1)",[
            ":thread_id" => $thread,
            ":user_id" => $_user[ "id" ],
            ":subject" => $subject,
            ":touserid" => $touserid,
            ":msgtext" => $msgtext
          ]);
        $code = ($status) ? 200 : 400;

        exit(json_out([
          "status" => $status
        ], $code));
      }
      exit(json_out(["status" => false], 400));
    }
  }

  function getSettings() {
    global $_user;
    if (is_ajax() && is_logged_in()) {

      $row = fetchOne("select * from users where id=:userid", ['userid' => $_user['id'] ]);
      
      if ($row) {
        $data = [
          "nick" => $row->nick,
          "crew" => $row->crew,
          "byear" => $row->byear,
          "bmonth" => $row->bmonth,
          "bday" => $row->bday,
          "country" => $row->country,
          "mail" => $row->mail,
          "webpage" => $row->webpage,            
          "upload_signature" => $row->upload_signature,
          "viewmode" => $row->list_view_mode,
          "def_bg_col" => $row->def_bg_col ?? "#000000",
          "def_fg_col" => $row->def_fg_col ?? "#ffffff",
          "display_mail" => $row->display_mail,
          "def_font" => $row->def_font,
          "crt_effect" => $row->crt_effect,
          "anim_effect" => $row->anim_effect,
        ];
        exit(json_out($data));
      } else {
        exit(json_out(["status" => false], 404));
      }
    }
  }
  
  function saveSettings() {
    global $_user;
    if (is_ajax() && is_logged_in()) {

      $user_id = $_user[ "id" ];
      
      $oldpass = $_POST[ 'oldpass' ] ?? "";
      $newpass = $_POST[ 'newpass' ] ?? "";
      $errors = '';
      
      if (strlen($newpass)>0) {
        $spw = fetchOne("SELECT pwhash FROM users WHERE (id = :id)", [ ":id" => $_user['id'] ])->pwhash;
        if (preg_match('/^[a-f0-9]{32}$/i', $spw)) {
          if (md5($oldpass) !== $spw) $error = 'old password is incorrect';
        } else {
          if (!password_verify($oldpass, $spw)) {
            $errors = 'old password is incorrect';
          }
        }
        
        if (strlen($errors)<1) {
          if (!preg_match('/[A-Z]/',$newpass) || !preg_match('/[a-z]/',$newpass) || !preg_match('/[0-9]/',$newpass) || !preg_match('/[^\w]/',$newpass)) {
            $errors = 'password should include at least one upper case letter, one lower caser letter, one number and one special character';
          }
        }

        if (strlen($errors)>0) {
          exit(json_out([
            "status" => false,
            "error" => $errors
          ], 400));
        }

        $pwhash = password_hash($newpass, PASSWORD_BCRYPT, array('cost' => 13));

        $status = doQuery("update users set pwhash = :pwhash where id = :user_id",[   
          ":pwhash" => $pwhash,
          ":user_id" => $user_id
        ]);
        
        if (!$status) {
          exit(json_out([
            "status" => $status
          ], 400));
        }

      }
      
      $nick = $_POST[ 'nick' ] ?? "";
      $crew = $_POST[ 'crew' ] ?? "";
      $byear = $_POST[ 'byear' ] ?? "";
      $bmonth = $_POST[ 'bmonth' ] ?? "";
      $bday = $_POST[ 'bday' ] ?? "";
      $country = $_POST[ 'country' ] ?? "";
      $mail = $_POST[ 'mail' ] ?? "";
      $uploadsig = $_POST[ 'upload_signature' ] ?? "";
      $viewmode = $_POST[ 'viewmode' ] ?? "";
      $def_bg_col = $_POST[ 'def_bg_col' ] ?? "";
      $def_fg_col = $_POST[ 'def_fg_col' ] ?? "";
      $display_mail = $_POST[ 'display_mail' ] ?? "";
      $def_font = $_POST[ 'def_font' ] ?? "";
      $crt_effect= $_POST[ 'crt_effect' ] ?? "";   
      $anim_effect= $_POST[ 'anim_effect' ] ?? "";   
      
      
      $status = doQuery("update users set nick=:nick, crew=:crew, byear=:byear, bmonth=:bmonth, bday=:bday, country=:country,
        mail=:mail, upload_signature=:uploadsig, list_view_mode=:viewmode, def_fg_col=:def_fg_col, def_bg_col=:def_bg_col, display_mail=:display_mail,
        def_font=:def_font, crt_effect=:crt_effect, anim_effect=:anim_effect where id = :user_id",[
          ":user_id" => $user_id,
          ":nick" => $nick,
          ":crew" => $crew,
          ":byear" => $byear,
          ":bmonth" => $bmonth,
          ":bday" => $bday,
          ":country" => $country,
          ":mail" => $mail,
          ":uploadsig" => $uploadsig,
          ":viewmode" => $viewmode,
          ":def_bg_col" => $def_bg_col,
          ":def_fg_col" => $def_fg_col,
          ":display_mail" => $display_mail,
          ":def_font" => $def_font,
          ":crt_effect" => $crt_effect,
          ":anim_effect" => $anim_effect
        ]);
      $code = ($status) ? 200 : 400;

      $_user['nick'] = $nick;
      $_user['settings']['crt_effect'] = $crt_effect;
      $_SESSION[ "_user" ]['nick'] = $nick;
      $_SESSION[ "_user" ]['settings']['crt_effect'] = $crt_effect;

      exit(json_out([
        "status" => $status
      ], $code));
    }

  }

  function loadFont() {
    global $_user;
    if (is_ajax() && is_logged_in()) {
      $id = $_GET[ "id" ] ?? 0;
      $data = [];
      if($id) {
        $styles = fetchAll("SELECT * FROM styles WHERE id = :id and (user=:username OR status>1)", [":id" => $id, ":username" => $_user[ "nick" ]]);
      } else {
        $styles = fetchAll("SELECT * FROM styles where (user=:username or status>1) ORDER BY name", [":username" => $_user[ "nick" ]]);
      }
      foreach($styles as $style) {
        $data[] = [
          "fontid" => (int)$style->id,
          "fontstatus" => (int)$style->status,
          "fontname" => $style->name,
          "fontdata" => $style->style
        ];
      }
      if(!empty($data)) {
        exit(json_out($data));
      }
      exit(json_out(["status" => false], 404));
    }
  }
  
  function saveFont() {
    global $_user;
    if (is_ajax() && is_logged_in()) {

      $response = 200;
      $data = [
        ":fontdata" => $_POST[ "fontdata" ] ?? "",
        ":userid" => $_user[ "id" ]
      ];
      if(!empty($_POST[ "fontid" ])) {
        $q = "UPDATE styles SET name = :fontname, status = :status WHERE id = :id and user_ids=:userid";
        $data2 = [
          ":status" => $_POST[ "fontstatus" ] ?? "1",
          ":fontname" => $_POST[ "fontname" ] ?? "",
          ":id" => $_POST[ "fontid" ],
          ":userid" => $_user[ "id" ]
        ];
        if(!doQuery($q, $data2)) {
          exit(json_out(["status" => true], 400));      
        }
        
        $q = "UPDATE styles SET style = :fontdata WHERE id = :id and (user_ids=:userid or status=3)";
        $data[ ":id" ] = $_POST[ "fontid" ];
      } else {
        $q = "INSERT INTO styles (name, style, user, user_ids, status) VALUES (:fontname, :fontdata, :username, :userid, :status)";
        $data[":fontname"] = $_POST[ "fontname" ] ?? "";
        $data[":username"] = $_user[ "nick" ];
        $data[":status"] = $_POST[ "fontstatus" ] ?? "1";
        $response = 201;
      }
      if(doQuery($q, $data)) {
        exit(json_out(["status" => true], $response));
      }
      exit(json_out(["status" => true], 400));      
    }

  }

  function deleteFont($fontId) {
    global $_user;
    if (is_ajax() && is_logged_in()) {

      $q = "select count(*) as cnt from styles where id = :fontid and user_ids=:userid ";
      $data = [
        ":fontid" => $fontId,
        ":userid" => $_user[ "id" ]
      ];
      $count = fetchOne($q, $data);
      if (((int)$count->cnt)<1) {
        exit(json_out(["status" => true], 403));     
      }
      
      $status = doQuery("delete FROM styles WHERE id = :fontid and user_ids=:userid", [
        ":fontid" => $fontId,
        ":userid" => $_user[ "id" ]
      ]);
      $code = ($status) ? 200 : 400;
      exit(json_out([
        "status" => $status
      ], $code));

      exit(json_out(["status" => false], 400));
    }  
  }

  function saveRequest() {
    global $_user;
    if (is_ajax() && is_logged_in()) {

      $desc = $_POST[ "description" ] ?? "";

      $data = [
        ":title" => $_POST[ "title" ] ?? "",
        ":description" => $desc,
        ":requestedby" => $_user[ "id" ],
        ":time" => time()
      ];
      
      $q = "INSERT INTO requests (title, description,requestedby,timestamp) VALUES (:title, :description, :requestedby,:time)";
      $response = 201;
      if(!doQuery($q, $data)) {
        exit(json_out(["status" => true], 400));
      }
      
      exec("curl -H \"Content-Type: application/json\" -d '{\"username\": \"ASCII ARENA Requests\", \"content\": \"A new ascii request has just been created at [asciiarena.se](https://asciiarena.se) by ".$_user[ "nick" ]." titled ".addslashes($desc)."\"}' \"https://discord.com/api/webhooks/1034087774225178624/on_uHSDNg8cf4-M5EBB_NV_d_1i0Ne1N_grTwpZXy0Q6pvUo8G7Jbt6MIdCrBG4INqBx\"");

      exit(json_out(["status" => true], $response));
    }
  }

  function getCrews($page, $sort, $asc, $pagesize, $filter) {
    global $_user;
    if (is_ajax()) {
      $data = [];     

      $start = ($page-1) * $pagesize;
      $cnt = 0;

      if ($asc=="A") {
        $order = $sort; 
      } else {
        $order = $sort." DESC";
      }
      
      $sqlFilter = "";
      if ($filter != "") {
        $sqlFilter = "WHERE name like \"%$filter%\"";
      }
      
      $crews = fetchAll("SELECT *, (select count(id) from collys_crews cc where cc.crew_id = c.id) as releases_cnt,(select count(id) from member_of mo where mo.crew= c.name) as members_cnt  FROM crews c $sqlFilter order by $order LIMIT $start, $pagesize");
      $cnt= fetchOne("select count(distinct id) cnt FROM crews $sqlFilter");
      
      foreach($crews as $crew) {
        $data[] = [
          "url" => "/crew/".urlsafe($crew->name),
          "id" => (int)$crew->id,
          "name" =>$crew->name,
          "acronym" =>$crew->acronym,
          "members_cnt" =>$crew->members_cnt,
          "releases_cnt" =>$crew->releases_cnt,
          "rating" =>$crew->rating,
          "total_count" =>$cnt->cnt
        ];
      }
      exit(json_out($data));
    }  
  }

  function getArtists($page, $sort, $asc, $pagesize, $filter) {
    global $_user;
    if (is_ajax()) {
      $data = [];     

      $start = ($page-1) * $pagesize;
      $cnt = 0;

      if ($asc=="A") {
        $order = $sort; 
      } else {
        $order = $sort." DESC";
      }
      
      $sqlFilter = "";
      if ($filter != "") {
        $sqlFilter = "WHERE s.nick like \"%$filter%\" or s.crews like \"%$filter%\"";
      }
      
      $artists = fetchAll("SELECT s.id, s.nick, s.crews FROM (select a.id,a.nick, GROUP_CONCAT(m.crew) crews from artists a LEFT JOIN member_of m on a.nick=m.nick GROUP BY a.id) s $sqlFilter order by $order LIMIT $start, $pagesize");
      $cnt= fetchOne("select count(*) cnt FROM (select a.id,a.nick, GROUP_CONCAT(m.crew) crews from artists a LEFT JOIN member_of m on a.nick=m.nick GROUP BY a.id) s $sqlFilter");
      
      foreach($artists as $artist) {

        $crews = explode(',', $artist->crews);
        $crews = array_map(function($crew) { return '<a href="/crew/'.urlsafe($crew).'">'.$crew.'</a>'; }, $crews);
        
        $data[] = [
          "crews" => pluralize($crews),
          "url" => "/artist/".urlsafe($artist->nick),
          "id" => (int)$artist->id,
          "nick" =>$artist->nick,
          "total_count" =>$cnt->cnt
        ];
      }
      exit(json_out($data));
    }  
  }

  function getBBS($page, $sort, $asc, $pagesize, $filter) {
    global $_user;
    if (is_ajax()) {
      $data = [];     

      $start = ($page-1) * $pagesize;
      $cnt = 0;

      if ($asc=="A") {
        $order = $sort; 
      } else {
        $order = $sort." DESC";
      }
      
      $sqlFilter = "";
      if ($filter != "") {
        $sqlFilter = "WHERE name like \"%$filter%\" or sysop like \"%$filter%\" ";
      }
      
      $bbses = fetchAll("SELECT * FROM bbses $sqlFilter order by $order LIMIT $start, $pagesize");
      $cnt= fetchOne("select count(distinct id) cnt FROM bbses $sqlFilter");
      
      foreach($bbses as $bbs) {
        $data[] = [
          "url" => "/bbs/".urlsafe($bbs->id),
          "id" => (int)$bbs->id,
          "name" =>$bbs->name,
          "sysop" =>$bbs->sysop,
          "total_count" =>$cnt->cnt
        ];
      }
      exit(json_out($data));
    }  
  }

  function getApps($page, $sort, $asc, $pagesize, $filter) {
    global $_user;
    if (is_ajax()) {
      $data = [];     

      $start = ($page-1) * $pagesize;
      $cnt = 0;

      if ($asc=="A") {
        $order = $sort; 
      } else {
        $order = $sort." DESC";
      }
      
      $sqlFilter = "";
      if ($filter != "") {
        $sqlFilter = "WHERE name like \"%$filter%\" or filename like \"%$filter%\" or author like \"%$filter%\" ";
      }
      
      $apps = fetchAll("SELECT * FROM apps $sqlFilter order by $order LIMIT $start, $pagesize");
      $cnt= fetchOne("select count(distinct id) cnt FROM apps $sqlFilter");
      

      foreach($apps as $app) {
       $dizName = 'apps/'.preg_replace('/\\.[^.\\s]{3,4}$/', '', $app->filename).'.diz';
       if (file_exists($dizName)) { 
         $display_file_id = encodeFileText($dizName); 
       } else {
         $display_file_id = encodeFileText("collections/file_id.diz.txt");
       }

       $usersig= fetchOne("select upload_signature FROM users where id =:uploader_id",[":uploader_id" => $app->uploader_id]);
       $usersig = $usersig->upload_signature ?? "";

       $data[] = [
        "url" => "/application/".$app->filename,
        "id" => (int)$app->id,
        "name" =>$app->name,
        "filesize" =>$app->filesize ?? "",
        "fileid" => $display_file_id,
        "timestamp" =>date("d.m.y", $app->timestamp),
        "usersig" => $usersig,
        "filename" =>$app->filename,
        "author" =>$app->author,
        "total_count" =>$cnt->cnt
      ];
    }
    exit(json_out($data));
  }  
}

function getMags($page, $sort, $asc, $pagesize, $filter) {
  global $_user;
  if (is_ajax()) {
    $data = [];     
    
    $start = ($page-1) * $pagesize;
    $cnt = 0;

    if ($asc=="A") {
      $order = $sort; 
    } else {
      $order = $sort." DESC";
    }

    $sqlFilter = "";
    if ($filter != "") {
      $sqlFilter = "WHERE name like \"%$filter%\" or filename like \"%$filter%\" or author like \"%$filter%\" ";
    }

    $mags = fetchAll("SELECT * FROM mags $sqlFilter order by $order LIMIT $start, $pagesize");
    $cnt= fetchOne("select count(distinct id) cnt FROM mags $sqlFilter");

    foreach($mags as $mag) {
     $file_id = $mag->filename.'.diz';
     $dirname = @array_shift(explode(".", $mag->filename));
     if (file_exists('mags/'.$dirname.'/'.$file_id)) { 
       $display_file_id = encodeFileText('mags/'.$dirname.'/'.$file_id); 
     } else {
       $display_file_id = encodeFileText("collections/file_id.diz.txt");
     }

     $usersig= fetchOne("select upload_signature FROM users where nick =:uploader",[":uploader" => $mag->uploader]);
     $usersig = $usersig->upload_signature ?? "";

     $data[] = [
      "url" => "/magazine/".$mag->filename,
      "id" => (int)$mag->id,
      "name" =>$mag->name,
      "filesize" =>$mag->filesize ?? "",
      "fileid" => $display_file_id,
      "timestamp" =>date("d.m.y", $mag->timestamp),
      "filename" =>$mag->filename,
      "usersig" => $usersig,
      "author" =>$mag->author,
      "total_count" =>$cnt->cnt
    ];
  }
  exit(json_out($data));
}  
}

function getCollys($page, $sort, $asc, $pagesize, $filter) {
  global $_user;
  if (is_ajax()) {
    $data = [];     
    
    $start = ($page-1) * $pagesize;
    $cnt = 0;

    if ($asc=="A") {
      $order = $sort; 
    } else {
      $order = $sort." DESC";
    }

    $sqlFilter = "";
    if ($filter != "") {
      $sqlFilter = "having name like \"%$filter%\" or filename like \"%$filter%\" or crews like \"%$filter%\" or artists like \"%$filter%\"";
    }

    $collys = fetchAll("select *, concat(lpad(c.year,4,0),'-',lpad(c.month,2,0),'-',lpad(c.day,2,0)) cdate, (select coalesce(GROUP_CONCAT(a.nick),'') artists FROM artists_collys ac  LEFT JOIN artists a on a.id = ac.artist_id where ac.colly_id=c.id) artists, (select coalesce(GROUP_CONCAT(cr.name),'') crews FROM collys_crews cc  LEFT JOIN crews cr on cr.id = cc.crew_id where cc.colly_id=c.id) crews from collys c $sqlFilter order by $order LIMIT $start, $pagesize");
    $cnt= fetchOne("select count(c.id) cnt from (select *, (select coalesce(GROUP_CONCAT(a.nick),'') artists FROM artists_collys ac  LEFT JOIN artists a on a.id = ac.artist_id where ac.colly_id=c.id) artists, (select coalesce(GROUP_CONCAT(cr.name),'') crews FROM collys_crews cc  LEFT JOIN crews cr on cr.id = cc.crew_id where cc.colly_id=c.id) crews from collys c $sqlFilter) c");


    foreach($collys as $colly) {

     $file_id = $colly->filename.'.diz';
     $dirname = @array_shift(explode(".", $colly->filename));
     if (file_exists('collections/'.$dirname.'/'.$file_id)) { 
       $display_file_id = encodeFileText('collections/'.$dirname.'/'.$file_id); 
     } else {
       $display_file_id = encodeFileText("collections/file_id.diz.txt");
     }

     $usersig= fetchOne("select upload_signature FROM users where id=:uploader_id",[":uploader_id" => $colly->uploader_id]);
     $usersig = $usersig->upload_signature ?? "";

     $data[] = [
      "url" => "/release/".$colly->filename,
      "id" => (int)$colly->id,
      "name" =>$colly->name,
      "filename" => $colly->filename,
      "filesize" => $colly->filesize ?? "",
      "fileid" => $display_file_id,
      "artists" => combinize($colly->artists, $colly->artists, "/artist/", $colly->artists),
      "crews" => combinize($colly->crews, $colly->crews, "/crew/", $colly->crews),
      "cdate" => $colly->cdate,
      "usersig" => $usersig,
      "total_count" =>$cnt->cnt
    ];
  }

  exit(json_out($data));
}  
}

function getRequests($page, $sort, $asc, $pagesize, $viewmode, $filter) {
  global $_user;
  if (is_ajax()) {
    $data = [];     
    
    $start = ($page-1) * $pagesize;
    $cnt = 0;

    if ($asc=="A") {
      $order = $sort; 
    } else {
      $order = $sort." DESC";
    }     

    $viewsql="";
    switch ((int)$viewmode) {
      case 0:
      $viewsql="status=0";
      break;
      case 1:
      $viewsql="status=1";
      break;
      case 2:
      $viewsql="status=2";
      break;
      case 3:
      $viewsql="status in (1,2)";
      break;
      case 4:
      $viewsql="";
      break;
    }

    $sqlFilter = "";
    if ($filter != "") {
      if ($viewsql != "") {
        $sqlFilter = "WHERE (title like \"%$filter%\" or description like \"%$filter%\" or users.nick like \"%$filter%\") and $viewsql";
      } else {
        $sqlFilter = "WHERE title like \"%$filter%\" or description like \"%$filter%\" or users.nick like \"%$filter%\"";
      }
    } else if ($viewsql != "") {
      $sqlFilter = "WHERE $viewsql";
    }

    $requests = fetchAll("SELECT requests.*, users.nick as user FROM requests LEFT JOIN users on users.id = requests.requestedby $sqlFilter order by $order LIMIT $start, $pagesize");
    $cnt= fetchOne("select count(distinct requests.id) cnt FROM requests  LEFT JOIN users on users.id = requests.requestedby $sqlFilter");

    foreach($requests as $req) {
      $data[] = [
        "id" => (int)$req->id,
        "title" =>$req->title,
        "status" =>(int)$req->status,
        "time" => date("Y-m-d H:i",$req->timestamp),
        "user" =>$req->user,
        "url" => "info_requests.php?id=".$req->id,
        "total_count" =>$cnt->cnt
      ];
    }
    exit(json_out($data));
  }  
}

function getRequestComments($reqid) {
  $rows = fetchAll("select rc.*, u.nick user from request_comments rc LEFT JOIN users u on u.id = rc.user_id where rc.request_id=:reqid", ['reqid' => $reqid ]);

  $data = [];     

  foreach($rows as $comment) {
    $data[] = [
      "id" => (int)$comment->comment_id,
      "user" => $comment->user,
      "time" => date("Y-m-d H:i",$comment->timestamp),
      "comment" =>$comment->comment,
      "filename" =>$comment->attach_filename,
    ];
  }
  exit(json_out($data));
}

function delReqComment($commentid) {
  if (is_ajax() && is_logged_in() &&is_admin()) {
    $reqid = $_POST[ "req_id" ];
    if (($commentid > 0) && ($reqid>0)) {
      $status = doQuery("delete from request_comments where comment_id = :commentid and request_id = :request_id",[
        ":commentid" => (int)$commentid,
        ":request_id" => (int)$reqid
      ]);
      $code = ($status) ? 200 : 400;

      exit(json_out([
        "status" => $status
      ], $code));
    }
    exit(json_out(["status" => false], 40));
  }
}

function addReqComment($requestid) {
  global $_user;
  if (is_ajax() && is_logged_in()) {
    $reqid = $_POST[ "request_id" ] ?? $requestid ?? 0;
    $comment = $_POST[ 'comment' ] ?? "";
    $filename = $_POST[ 'filename' ] ?? "";
    $filedata = $_POST[ 'filedata' ] ?? "";

    if ($reqid> 0) {
      $status = doQuery("insert into request_comments (request_id, user_id, comment, attach_filename, attach_filedata, timestamp) 
        values (:request_id, :user_id, :comment, :filename, :filedata, :time)",[
          ":request_id" => (int)$reqid,
          ":user_id" => $_user[ "id" ],
          ":comment" => $comment,
          ":filename" => $filename,
          ":filedata" => $filedata,
          ":time" => time()
        ]);
      $code = ($status) ? 200 : 400;

      if ($status && $filename && $filedata)
      {

        $requser= fetchOne("select users.id, users.nick FROM requests LEFT JOIN users on users.id = requests.requestedby where requests.id = :reqid",["reqid" => (int)$reqid]);

        doQuery("insert into messages (thread,from_id,to_id,postedto,postername,timestamp,subject,message,new,unread,attach_filename, attach_filedata) 
          select ifnull(max(thread)+1,1),:fromuserid,:touserid,:tousername,:fromusername,UNIX_TIMESTAMP(),:subject,:msgtext,1,1,:filename,:filedata from messages",[
            ":fromusername" => $_user["nick"],
            ":fromuserid" => $_user["id"],
            ":subject" => "Your request has a new upload",
            ":tousername" => $requser->nick,
            ":touserid" => $requser->id,
            ":filename" => $filename,
            ":filedata" => $filedata,
            ":msgtext" => $_user[ "nick" ]." has added a comment to your request and attached a file."
          ]);
      }

      exit(json_out([
        "status" => $status
      ], $code));
    }
    exit(json_out(["status" => false], 400));
  }
}

function editReqComment($commentid) {
  global $_user;
  if (is_ajax() && is_logged_in()) {
    $id = $_POST[ "comment_id" ] ?? $commentid ?? 0;
    $comment = $_POST[ 'comment' ] ?? "";
    if ($id > 0) {
      if (is_admin()) {
        $admin=1;
      } else {
        $admin=0;
      }
      $status = doQuery("update request_comments set comment = :comment where (:admin = 1 or user_id = :user_id) and comment_id = :commentid",[
        ":commentid" => (int)$id,
        ":comment" => $comment,
        ":user_id" => $_user[ "id" ],
        ":admin" => $admin
      ]);
      $code = ($status) ? 200 : 400;
      exit(json_out([
        "status" => $status,
      ], $code));
    }
    exit(json_out(["status" => false], 400));
  }
}

function updateReqStatus($reqid) {
  global $_user;
  if (is_ajax() && is_logged_in()) {
    $id = $_POST[ "request_id" ] ?? $reqid ?? 0;
    $status = $_POST[ 'status' ] ?? 0;
    if ($id > 0) {
      if (is_admin()) {
        $admin=1;
      } else {
        $admin=0;
      }
      $status = doQuery("update requests set status = :status where (:admin = 1 or requestedby = :user_id) and id = :requestid",[
        ":requestid" => (int)$id,
        ":status" => (int)$status,
        ":user_id" => $_user[ "id" ],
        ":admin" => $admin
      ]);
      $code = ($status) ? 200 : 400;
      exit(json_out([
        "status" => $status,
      ], $code));
    }
    exit(json_out(["status" => false], 400));
  }
}

function getReqCommentAttachment($commentid) {
  $attachdata = fetchOne("SELECT attach_filename, attach_filedata FROM request_comments WHERE comment_id = :commentid", ['commentid' => $commentid ]);

  $data = [];     

  if ($attachdata) {

    $data = [
      "filename" => $attachdata->attach_filename,
      "filedata" => $attachdata->attach_filedata
    ];
  }
  exit(json_out($data));
}

function getMessageAttachment($msgid) {
  $attachdata = fetchOne("SELECT attach_filename, attach_filedata FROM messages WHERE id = :msgid", ['msgid' => $msgid ]);

  $data = [];     

  if ($attachdata) {

    $data = [
      "filename" => $attachdata->attach_filename,
      "filedata" => $attachdata->attach_filedata
    ];
  }
  exit(json_out($data));
}

$cmd = $_GET[ "cmd" ] ?? $_current[ 0 ] ?? "";
$reDir = "/";

switch ($cmd) {
  case "login":
  login();
  header("Location: {$reDir}");
  break;
  case "logout":
  logout();
  header("Location: {$reDir}");
  break;
		/*			case "register":
    break;*/
    case "tag":
    tag();
    break;
    case "countdl":
    countDownload($_current[1]);
    break;
    case "countview":
    countView($_current[1]);
    break;      
    case "broken":
    brokenColly($_current[1]);
    break;  
    case "getcomments":      
    getComments($_current[1]);
    break;  
    case "delcomment":
    deleteComment($_current[1]);
    break;         
    case "editcomment":
    editComment($_current[1]);
    break;         
    case "addcomment":
    addComment($_current[1]);
    break;         
    case "fave":
    faveColly($_current[1]);
    break;
    case "unfave":
    unfaveColly($_current[1]);
    break;
    case "save_artist":
    saveArtist();
    break;     
    case "save_crew":
    saveCrew();
    break;
    case "save_bbs":
    saveBBS();
    break;
    case "dupe_check":
    dupeCheckColly();
    break;
    case "save_colly":
    saveColly();
    break;
    case "save_app":
    saveApp();
    break;
    case "save_mag":
    saveMag();
    break;
    case "get_message":
    getMessage($_current[1]);
    break;      
    case "delete_message":
    deleteMessage($_current[1]);
    break;      
    case "get_messages":
    getMessages($_current[1],$_current[2]);
    break;      
    case "get_thread":
    getMessageThread($_current[1],$_current[2],$_current[3]);
    break;      
    case "new_message":
    newMessage();
    case "reply_thread":
    replyMessage();
    case "get_settings":
    getSettings();
    case "save_settings":
    saveSettings();
    case "get_font":
    loadFont();
    case "save_font":
    saveFont();
    case "delete_font":
    deleteFont($_current[1]);
    case "save_request":
    saveRequest();
    case "get_crews":
    getCrews($_current[1],$_current[2],$_current[3],$_current[4],$_current[5]);
    break;      
    case "get_artists":
    getArtists($_current[1],$_current[2],$_current[3],$_current[4],$_current[5]);
    break;      
    case "get_bbs":
    getBBS($_current[1],$_current[2],$_current[3],$_current[4],$_current[5]);
    break;      
    case "get_apps":
    getApps($_current[1],$_current[2],$_current[3],$_current[4],$_current[5]);
    break;      
    case "get_mags":
    getMags($_current[1],$_current[2],$_current[3],$_current[4],$_current[5]);
    break;      
    case "get_collys":
    getCollys($_current[1],$_current[2],$_current[3],$_current[4],$_current[5]);
    break;      
    case "get_reqs":
    getRequests($_current[1],$_current[2],$_current[3],$_current[4],$_current[5],$_current[6]);
    break;      
    case "get_req_comments":
    getRequestComments($_current[1]);
    break;      
    case "delreqcomment":
    delReqComment($_current[1]);
    break;         
    case "addreqcomment":
    addReqComment($_current[1]);
    break;         
    case "editreqcomment":
    editReqComment($_current[1]);
    break;         
    case "updatereqstatus":
    updateReqStatus($_current[1]);
    break;         
    case "get_req_comment_attach":
    getReqCommentAttachment($_current[1]);
    break;         
    case "get_message_attach":
    getMessageAttachment($_current[1]);
    break;         
    default:
    if (is_ajax()) {
      exit(json_out(["status" => false], 400));
    }
    else {
      header("Location: {$reDir}");
    }
    break;   
  }
  
