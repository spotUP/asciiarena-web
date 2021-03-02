<?php

/*
 * User stuff. This is a prototype class
 */
class User {
/*
+-------------------+--------------+------+-----+----------------------------------------------+----------------+
| Field             | Type         | Null | Key | Default                                      | Extra          |
+-------------------+--------------+------+-----+----------------------------------------------+----------------+
| id                | int unsigned | NO   | PRI | NULL                                         | auto_increment |
| nick              | char(60)     | NO   | UNI | NULL                                         |                |
| crew              | char(60)     | YES  |     | NULL                                         |                |
| password          | char(60)     | YES  |     | NULL                                         |                |
| pwhash            | char(128)    | YES  |     | NULL                                         |                |
| lastactive        | int          | YES  |     | NULL                                         |                |
| current           | varchar(255) | NO   |     | NULL                                         |                |
| byear             | int          | YES  |     | NULL                                         |                |
| bmonth            | int          | YES  |     | NULL                                         |                |
| bday              | int          | YES  |     | NULL                                         |                |
| country           | char(60)     | YES  |     | NULL                                         |                |
| avatar            | char(60)     | YES  |     | NULL                                         |                |
| messenger         | char(60)     | YES  |     | NULL                                         |                |
| mail              | char(60)     | YES  |     | NULL                                         |                |
| webpage           | char(60)     | YES  |     | NULL                                         |                |
| uploaded          | int          | NO   |     | NULL                                         |                |
| rank              | char(16)     | YES  |     | NULL                                         |                |
| signature         | char(60)     | YES  |     | NULL                                         |                |
| sigdata           | text         | YES  |     | NULL                                         |                |
| joined            | char(11)     | YES  |     | NULL                                         |                |
| def_bg_col        | char(15)     | YES  |     | NULL                                         |                |
| def_fg_col        | char(15)     | YES  |     | NULL                                         |                |
| upload_signature  | varchar(80)  | NO   |     | - -- - aSCIIaRENa - ---- - aSCIIaRENa - -- - |                |
| list_view_mode    | char(8)      | YES  |     | standard                                     |                |
| display_mail      | char(3)      | YES  |     | NULL                                         |                |
| display_messenger | char(3)      | YES  |     | NULL                                         |                |
| forum_sig_font    | char(16)     | YES  |     | NULL                                         |                |
| forum_sig_color   | char(15)     | YES  |     | NULL                                         |                |
| temp_pw_hash      | char(60)     | YES  |     | NULL                                         |                |
| def_font          | char(32)     | YES  |     | NULL                                         |                |
| sigbase64         | int          | YES  |     | NULL                                         |                |
+-------------------+--------------+------+-----+----------------------------------------------+----------------+
*/

  public int $id;
  public int $lastactive;
  public int $byear;
  public int $bmonth;
  public int $bday;
  public int $uploaded;
  public bool $sigbase64;
  public string $nick;
  public string $crew;
  public string $password;
  public string $pwhash;
  public string $current;
  public string $country;
  public string $avatar;
  public string $messenger;
  public string $mail;
  public string $webpage;
  public string $rank;
  public string $signature;
  public string $sigdata;
  public ?string $joined;
  public string $def_bg_col;
  public string $def_fg_col;
  public string $upload_signature;
  public string $list_view_mode;
  public string $display_mail;
  public string $display_messenger;
  public string $forum_sig_font;
  public string $forum_sig_color;
  public string $templ_pw_hash;
  public string $def_font;

  public static function getById(int $id) {
    return DB::getDbh()->fetch("SELECT * FROM users WHERE id=:id", ["id" => $id],[],'User');
  }

  public static function getByName(string $name) {
    return DB::getDbh()->fetch("SELECT * FROM users WHERE name LIKE :nick", ["nick" => $name], [], 'User');
  }

  public static function register(
      string $nick,
      string $password,
      string $mail,
      string $rank = 'Inactive'
  ) {
    $pwhash = md5($password);
    $now    = time();
    $dbh    = DB::getDbh();
    return $dbh->query(
      "INSERT INTO users (id, nick, crew, password, pwhash, lastactive, current, avatar, mail,  uploaded, `rank`, upload_signature, list_view_mode, display_mail, display_messenger)
                  VALUES (0, :nick,'Independent','SECRET',:pwhash, :now, '', 'AvatarDefault.jpg', :mail, 0, :rank, '- -- - aSCIIaRENa - ---- - aSCIIaRENa - -- -', 'Standard', 'No', 'No' )", [
      'nick'   => $nick,
      'now'    => $now,
      'pwhash' => $pwhash,
      'mail'   => $mail,
      'rank'   => $rank
    ]) ? $dbh->lastInsertId() : false;
  }

  public static function update(
    array $where,
    array $binds
  ) {
    $dbh    = DB::getDbh();

    $update_pairs = [];
    foreach ($binds as $k => $v) {
      array_push($update_pairs, "`$k` = :$k");
    }
    $update_string = implode(', ', $update_pairs);

    $where_binds = [];
    $where_conds = [];
    foreach ($where as $k => $v) {
      $where_binds['_where_' . $k] = $v;
      array_push($where_conds, "`$k` = :_where_$k");
    }
    $where_string = implode(', ', $where_conds);

    $sql = "UPDATE users SET $update_string WHERE $where_string";
    return $dbh->query($sql, array_merge($binds, $where_binds));
  }
}
