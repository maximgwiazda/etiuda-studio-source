-- WHAT EACH PAYMENT PAID FOR (Grok alpha's review of licence payments, 2026-11-22, A2 and B4; Claudius's brief: "a refund removes exactly
-- the seats it paid for"): before it, a subscription kept one payment, the period's, so a refund of a rise inside the period was held and
-- its seats stayed, and a refund of the period's payment took off the seats a rise still paid for. Six columns on orders, NULL on every
-- row before this migration, so a refund of a payment made before it is judged as before:
--   sub         the provider's subscription the payment paid
--   part_of     on a provider payment's order, the payment that began the subscription's period it is a part of: its own id where it
--               began one (a first payment, a renewal of the same or a later end, a rise that moves the date), the period's payment
--               where it is a rise paid inside that period
--   lead_added  the lead seats it paid for: a period's payment its whole count, a rise inside a period what it added, never less than none
--   desk_added  the same for desk seats
--   ends        the end, grace included, the payment paid to (pay.mjs refund falls back to the latest end still paid for)
--   given_back  1 once the payment's money went back whole (a refund or a chargeback lost), so it goes back once
-- Orders keep their own retention (core.mjs purgeRetention, by revenue year); none of the six names a person.
-- Its undo, applied by hand only, is service/licence/undo/0029_pay_parts.sql.
ALTER TABLE orders ADD COLUMN sub TEXT;
ALTER TABLE orders ADD COLUMN part_of TEXT;
ALTER TABLE orders ADD COLUMN lead_added INTEGER;
ALTER TABLE orders ADD COLUMN desk_added INTEGER;
ALTER TABLE orders ADD COLUMN ends INTEGER;
ALTER TABLE orders ADD COLUMN given_back INTEGER;
