ALTER TABLE member_of ADD updated VARCHAR(1) NULL AFTER nick; 
ALTER TABLE artists_collys ADD updated VARCHAR(1) NULL AFTER sortorder; 
ALTER TABLE collys_crews ADD updated VARCHAR(1) NULL AFTER sortorder;