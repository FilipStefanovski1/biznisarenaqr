-- Local development seed (applied by `supabase db reset`, never by `supabase db push`).
--
-- The contestants and the initial production round (status 'waiting', zero votes) are
-- created by the migration itself so that production gets them too. Production data is
-- never generated automatically: no votes are seeded here or anywhere else.
--
-- Admin accounts are provisioned with `npm run admin:provision` (see README), because
-- they must be created through Supabase Auth.
select 1;
