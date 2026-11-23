-- The organisation's name a buyer typed on a provider's page (the design's 10.8: Stripe's optional custom field "org" on the team
-- links), bound with the binding and naming the team's new licence at its first payment; NULL where none was typed, or one outside
-- the bound was.
ALTER TABLE pay_binds ADD COLUMN org TEXT;
