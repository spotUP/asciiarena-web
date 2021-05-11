<?php
	define("NO_PING", true);
	require_once "session.php";
 
  function extractFileDiz($filename) {
    $ext = substr($filename, strrpos($filename,'.'), strlen($filename)-1); 	// extract extension 
    $tempDiz="temp.diz";
    $contents="";
    
    if (($ext == ".dms") || ($ext == ".DMS")) {		
      exec("./bin/xdms d $filename >$tempDiz");
      if (file_exists($tempDiz))
      {
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
        unlink ($tempDiz);
      }

    }
      
    if (($ext == ".lha") || ($ext == ".LHA") || ($ext == ".lzh") || ($ext == ".LZH")) {

      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("/usr/bin/lha pq ./$filename file_id.diz >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check>0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }

      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("/usr/bin/lha pq ./$filename FILE_ID.DIZ >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }				
      
      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("/usr/bin/lha pq ./$filename File_Id.Diz >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }
      
      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("/usr/bin/lha pq ./$filename File_Id.Diz >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }				
      
      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("/usr/bin/lha pq ./$filename *.DiZ >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }				
      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("/usr/bin/lha pq ./$filename *.dIZ >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }
      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("/usr/bin/lha pq $filename *.diZ >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }
      unlink ($tempDiz);
    }			
    
    if (($ext == ".txt") || ($ext == ".TXT")) 
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

    if (($ext == ".zip") || ($ext == ".ZiP")) 
    {
      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("./bin/unzip -p -ca ./$filename \*.diz >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }

      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("./bin/unzip -p -ca ./$filename \*.DIZ >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }				
      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("./bin/unzip -p -ca ./$filename \*.Diz >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }
      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("./bin/unzip -p -ca ./$filename \*.DiZ >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }				
      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("./bin/unzip -p -ca ./$filename \*.dIZ >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }
      $contents_check=strlen($contents);
      if ($contents_check <1)
      {
        exec("./bin/unzip -p -ca ./$filename \*.diZ >$tempDiz");
        $size_check = filesize($tempDiz);
        if ($size_check > 0)
        {
          $handle = fopen($tempDiz, "r");
          $contents = fread($handle, filesize($tempDiz));
          fclose($handle);
        }
      }
      unlink ($tempDiz);
    }
      
    return $contents;
  }
  
 
  function login() {
    $login = false;
    $pw = $_POST[ "password" ] ?? "";
    $ni = $_POST[ "nick" ] ?? "";
    $loc = $_POST[ "location" ] ?? "/";
    $spw = fetchOne("SELECT pwhash FROM users WHERE (nick = :nick OR mail = :nick)", [ ":nick" => $ni ])->pwhash;
    if (preg_match('/^[a-f0-9]{32}$/i', $spw)) {
      $login = fetchOne("SELECT id,nick,crew,rank,crt_effect FROM users WHERE pwhash = :pwhash AND (nick = :nick OR mail = :nick)", [
        ":pwhash" => md5($pw),
        ":nick" => $ni
      ]);
      if ($login) {
        $pwhash = password_hash($pw, PASSWORD_BCRYPT, array('cost' => 13));
        doQuery("UPDATE users SET pwhash=:pwhash WHERE id=:id", [ ":pwhash" => $pwhash, ":id" => $login->id ]);
      }
    } else {
      if (password_verify($pw, $spw)) {
        $login = fetchOne("SELECT id,nick,crew,rank,crt_effect FROM users WHERE (nick = :nick OR mail = :nick)", [ ":nick" => $ni ]);
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
        <div class="col-lg-12 d-flex justify-content-between">
          <span class="cyan text-truncate" style="white-space: pre"><?=$row->tag?></span>
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
          "status" => $status,
          "id" => (int)$colly
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
          "status" => $status,
          "id" => (int)$colly
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
          "status" => $status,
          "id" => (int)$colly
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
            "time" => date("Y-m-d H:i:s",$comment->timestamp),
            "nick" => $comment->nick,
            "rating" => $comment->rating,
            "comment" => $comment->comment
          ];
        }
        if(!empty($data)) {
          exit(json_out($data));
        }
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
          "status" => $status,
          "id" => (int)$id
        ], $code));
      }
      exit(json_out(["status" => false], 400));
    }
  }
    
  function editComment($collyid) {
    $_user = $_SESSION[ "_user" ];
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
          "status" => $status,
          "id" => (int)$id
        ], $code));
      }
      exit(json_out(["status" => false], 400));
    }
  }
  
  function addComment($collyid) {
    $_user = $_SESSION[ "_user" ];
    if (is_ajax() && is_logged_in()) {
      $colly = $_POST[ "colly_id" ] ?? $collyid ?? 0;
      $comment = $_POST[ 'comment' ] ?? "";
      $rating = $_POST[ 'rating' ] ?? "";
      if (empty($rating)) $rating = null;
      if ($colly > 0) {
        $status = doQuery("insert into comments (colly_id, filename, crew, artist, comment, rating, nick, timestamp,user_id) 
          values (:colly_id,:filename,(select w.name from collys_crews cc LEFT JOIN crews w ON w.id=cc.crew_id where cc.colly_id=:colly_id),(select group_concat(a.nick) from artists_collys ac LEFT JOIN artists a ON a.id=ac.artist_id where ac.colly_id=:colly_id GROUP BY ac.colly_id),:comment, :rating, :nick, :time, :user_id)",[
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
          "status" => $status,
          "id" => (int)$colly
        ], $code));
      }
      exit(json_out(["status" => false], 400));
    }
  }
  
  function faveColly($collyid) {
    $_user = $_SESSION[ "_user" ];
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
          "status" => $status,
          "id" => (int)$colly
        ], $code));
      }
      exit(json_out(["status" => false], 400));
    }  
  }

  function unfaveColly($collyid) {
    $_user = $_SESSION[ "_user" ];
    if (is_ajax() && is_logged_in()) {
      $colly = $_POST[ "colly_id" ] ?? $collyid ?? 0;
      if ($colly > 0) {
        $status = doQuery("DELETE FROM favourites WHERE user_id = :user AND colly_id = :colly", [
          ":user" => $_user[ "id" ],
          ":colly" => (int)$colly
        ]);
        $code = ($status) ? 200 : 400;
        exit(json_out([
          "status" => $status,
          "id" => (int)$colly
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
      ];
      $q = "INSERT INTO bbses (name, address, sysop, number) VALUES (:name, :address, :sysop, :number)";
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
    $_user = $_SESSION[ "_user" ];
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

      $allowed_filetypes = array('.txt','.TXT','.asc','.ASC','.ans','.ANS','.diz','.DIZ','.lha','.LHA'); 	// allowed extensions
      $ext = substr($filename, strrpos($filename,'.'), strlen($filename)-1); 	// extract extension 
      if(!in_array($ext,$allowed_filetypes)) {									// filetype allowed?		
        exit(json_out(["status" => false, "data" =>$filename, "result" => "This filetype is not allowed here! Only LHA, LZH, DMS, ZIP and TXT can do it!"], 400));     
      }
      
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
      if (in_array(strtolower($ext), array('lha', 'zip'))) $type = 'Archive';

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

      doQuery("update users set uploaded=uploaded+:pumped where id=:userid", [ 'pumped' => $filesize, 'userid' => $_user['id'] ]);
      exit(json_out(["status" => true], $response));
    }
  }
    
  function saveapp() {
    $_user = $_SESSION[ "_user" ];
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

      $data = [
        ":name" =>$name,
        ":author" =>$author,
        ":filename" => $filename ?? "",
        ":filesize" => $filesize,
        ":uploaderid" => $_user[ "id" ]
      ];
    
      $q = "INSERT INTO apps (name, filename, filedate, timestamp, author, filesize, uploader_id) VALUES (:name, :filename, null, UNIX_TIMESTAMP(), :author, :filesize, :uploaderid)";
      $response = 201;

      if(!doQuery($q, $data)) {
        exit(json_out(["status" => true], 400));        
      }

      doQuery("update users set uploaded=uploaded+:pumped where id=:userid", [ 'pumped' => $filesize, 'userid' => $_user['id'] ]);
      exit(json_out(["status" => true], $response));
    }
  }
  
  function saveMag() {
    $_user = $_SESSION[ "_user" ];
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
      ];
    
      $q = "INSERT INTO mags (name, filename, filedate, timestamp, author, filesize, file_id, view_counter, downloads, uploader) VALUES (:name, :filename, null, UNIX_TIMESTAMP(), :author, :filesize, :file_id, 0, 0, :uploader)";
      $response = 201;

      if(!doQuery($q, $data)) {
        exit(json_out(["status" => true], 400));        
      }
      
      doQuery("update users set uploaded=uploaded+:pumped where id=:userid", [ 'pumped' => $filesize, 'userid' => $_user['id'] ]);
      exit(json_out(["status" => true], $response));

    }
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
		default:
			if ($is_ajax) {
				exit(json_out(["status" => false], 400));
			}
      else {
        header("Location: {$reDir}");
      }
			break;   
	}
  