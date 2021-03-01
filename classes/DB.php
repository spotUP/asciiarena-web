<?php
/*
 * Handles everything that has to do with database 
 */
class DB {
  private $dbh;

  /**
   * Gets a DB handle
   *
   * @param string $user Username
   * @param string $password Password
   * @param string $db Database name
   * @param string $host Hostname
   * @param string $driver What driver to use
   */
  public function __construct(
    string $user,
    string $password,
    string $db,
    string $host = "localhost",
    string $driver = "mysql"
  ) {
    $dsn = sprintf("%s:dbname=%s;host=%s", $driver, $db, $host);
    try {
      $this->dbh = new PDO($dsn, $user, $password);
    }
    catch (PDOException $e) {
      // @todo: log this somewhere?
      echo "Database error: " . $e->getMessage();
      die();
    }
  }

  /**
   * Get a DB Handler
   * 
   * @todo Set up dotenv or similar to put credentials 
   *       and other sensitive material outside of
   *       both the repo and the webroot.
   */
  public static function getDbh() {
    // FIXME! Replace with secure and reasonable dotenv or similar, outside of webroot
    // Until that's fixed this'll have to be manually edited both locally and in production

    $user     = getenv('DBUSER') ?: 'root';
    $password = getenv('DBPW')   ?: '';
    $host     = getenv('DBHOST') ?: 'localhost';
    $db       = getenv('DBNAME') ?: 'uprough_ascii';

    $driver = "mysql";

    $dbh = new DB($user, $password, $db, $host, $driver);
    return $dbh;
  }

  /**
   * Perform a (prepared) query, return only status
   * 
   * @param string $query SQL
   * @param array $binds Any binds to prepare
   * 
   * @return boolean
   */
  public function query(
    string $query,
    array $binds = []
  ): ?bool {
    if ($statement = $this->dbh->prepare($query)) {
      return $statement->execute($binds);
    }
    return false;
  }

  /**
   * Shorthand for query()
   */
  public function q($query, $binds) {
    return $this->query($query, $binds);
  }

  /**
   * Fetch a single row
   *
   * @param string $query SQL
   * @param array $binds Any binds to prepare
   * @param array $unset Any properties to remove from the row before returning
   *
   * @return object|false
   */
  public function fetch(
    string $query = "",
    array $binds = [],
    array $unset = []
  ) {
    // If the query does not have a limit, impose a LIMIT 1 for optimization
    $hasLimit = stripos($query, "LIMIT");
    if ($hasLimit === false) {
      $query .= " LIMIT 1";
    }
    if ($statement = $this->dbh->prepare($query)) {
      $statement->execute($binds);
      $obj = $statement->fetch(PDO::FETCH_OBJ);
      // remove unwanted properties
      if (!empty($unset)) {
        foreach ($unset as $prop) {
          unset($obj->$prop);
        }
      }
      return $obj;
    }
    return false;
  }

  /**
   * Fetch multiple rows
   *
   * @param string $query SQL
   * @param array $binds Any binds to prepare
   *
   * @return object|false
   */
  public function fetchAll(
    string $query = "",
    array $binds = []
  ) {
    if ($statement = $this->dbh->prepare($query)) {
      $statement->execute($binds);
      return $statement->fetchAll(PDO::FETCH_OBJ);
    }
    return false;
  }

}

