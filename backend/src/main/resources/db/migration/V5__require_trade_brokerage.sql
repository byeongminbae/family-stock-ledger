DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM trades WHERE brokerage_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot require trades.brokerage_id: existing trades without a brokerage must be corrected first';
    END IF;
END
$$;

ALTER TABLE trades
    ALTER COLUMN brokerage_id SET NOT NULL;
