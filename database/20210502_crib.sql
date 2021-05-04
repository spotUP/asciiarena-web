ALTER TABLE users ADD `crt_effect` ENUM('Y','N') NOT NULL DEFAULT 'N' AFTER `nickurl`; 
UPDATE users SET country=-1 WHERE country is NULL or country = ''
UPDATE users SET country = 165 WHERE country='Sweden';
UPDATE users SET country = 45 WHERE country='Denmark';
ALTER TABLE users CHANGE `country` `country` SMALLINT NULL DEFAULT '0'; 
UPDATE users SET country=country+1;
