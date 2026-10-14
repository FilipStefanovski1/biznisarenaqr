-- Display name follows the brand's own logo ("BOOBOO pet's cosmetics"). The id stays
-- 'bubu-kosmetik' so existing votes and results keep pointing at the same contestant.
update voting.contestants set name = 'BOOBOO' where id = 'bubu-kosmetik';
