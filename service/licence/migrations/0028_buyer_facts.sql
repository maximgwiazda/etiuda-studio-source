-- WHAT A BUYER'S OWN PROGRAMS ARE TOLD OF THEIR PAYMENTS (board 1020; the lead engineer's cut of 2026-11-22, "a held-payment flag for the
-- buyer": held() wrote a row keyed by event alone, so no answer could tell the buyer). Three columns on pay_events, NULL on every row
-- before this migration, which therefore shows no buyer anything:
--   act     what the route did with the event (pay.mjs classify: payment, bind, status, cancel or refund), so a hold is told apart from
--           the refund or cancel that settles it
--   sub     the provider's subscription the event named, where the route learned it
--   person  on a held payment's row only, the person whose sign-in code it carried (pay.mjs buyerFacts reads it at their sign-in and
--           quiet check); NULL on every other row, at their erasure (erase.mjs), and once HELD_SHOWN_DAYS have passed (core.mjs
--           purgeRetention)
-- Its undo, applied by hand only, is service/licence/undo/0028_buyer_facts.sql.
ALTER TABLE pay_events ADD COLUMN act TEXT;
ALTER TABLE pay_events ADD COLUMN sub TEXT;
ALTER TABLE pay_events ADD COLUMN person TEXT;
CREATE INDEX IF NOT EXISTS pay_events_by_person ON pay_events (person, at);
CREATE INDEX IF NOT EXISTS pay_events_by_sub ON pay_events (provider, sub);
