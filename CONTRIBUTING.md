
## QUICK SETUP

```bash
export DBUSER=
export DBNAME=
export DBHOST=localhost
export DBPW=
sudo mysqladmin create $DB_NAME
echo CREATE USER '$DBUSER'@'$DBHOST' IDENTIFIED BY '$DBPW' | sudo mysql
echo GRANT ALL PRIVILEGES ON $DBNAME '$DBUSER'@'localhost' | sudo mysql
echo FLUSH PRIVILEGES | sudo mysql
for a in `ls -1St database/`; echo "Applying $a"; cat $a | sudo mysql $DBNAME; done;
php -S localhost:8000
```
