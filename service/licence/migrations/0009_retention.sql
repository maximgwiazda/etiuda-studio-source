-- Retention: keep the timestamp when a licence was refunded so seat, sign-in and
-- trial records linked to it stay twelve months past the refund, not indefinitely.

ALTER TABLE licences ADD COLUMN refunded_at INTEGER;
