<?php

/*
 * Crew stuff. This is a prototype class
 */
class Crew {
  public int $id;
  public string $name;
  public string $acronym;
  public string $www;
  public string $contact;
  public bool $active;
  public float $rating;
  public int $total_members = 0; // number of members

  public static function getById(int $id) {
    $dbh = DB::getDbh();
    $result = $dbh->fetch("SELECT * FROM crews WHERE id=:id", ["id" => $id]);
    if ($result) {
      $crew = new Crew;
      foreach($result as $key=>$val) {
        $crew->{$key} = $val;
      }
      // count members
      $crew->total_members = $crew->getTotalMembers();
      return $crew;
    }
    return false;
  }

  public static function getByName(string $name) {
    $dbh = DB::getDbh();
    $result = $dbh->fetch("SELECT * FROM crews WHERE name LIKE :name", ["name" => $name]);
    if ($result) {
      return Crew::getById($result->id);
    }
  }

  public function getTotalMembers() {
    $dbh = DB::getDbh();
    $result = $dbh->fetch("SELECT COUNT(nick) AS total FROM member_of WHERE crew LIKE :name", ["name" => $this->name]);
    return $result->total;
  }

}