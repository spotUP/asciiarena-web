ALTER TABLE `member_of` DROP INDEX `crew`;
ALTER TABLE `uprough_ascii`.`member_of` ADD FULLTEXT `fts_membernick` (`nick`); 
ALTER TABLE `uprough_ascii`.`member_of` ADD FULLTEXT `fts_membercrew` (`crew`); 
