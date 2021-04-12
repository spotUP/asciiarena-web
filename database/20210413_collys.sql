ALTER TABLE `collys`
  DROP `artists`,
  DROP `artist_ids`,
  DROP `crews`,
  DROP `crew_ids`;
ALTER TABLE `uprough_ascii`.`artists` ADD FULLTEXT `fts_nick` (`nick`); 
ALTER TABLE `uprough_ascii`.`crews` ADD FULLTEXT `fts_crewname` (`name`);
