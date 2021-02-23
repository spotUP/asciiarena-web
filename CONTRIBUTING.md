
## QUICK SETUP

```bash
DB_USER=
DB_NAME=
DB_PASSWORD=
sudo mysqladmin create $DB_NAME
echo CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD' | sudo mysql
echo GRANT ALL PRIVILEGES ON $DB_NAME '$DB_USER'@'localhost' | sudo mysql
echo FLUSH PRIVILEGES | sudo mysql
for a in `ls -1St database/`; echo "Applying $a"; cat $a | sudo mysql $DB_NAME; done;
php -S localhost:8000
```
