ALTER TABLE `apps` CHANGE `downloads` `downloads` INT(11) NULL DEFAULT '0'; 
UPDATE `apps` set `downloads`=0;
