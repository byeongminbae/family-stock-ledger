DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM trades WHERE quantity > 2147483647) THEN
        RAISE EXCEPTION 'Cannot limit trades.quantity to int: existing quantities above 2147483647 must be corrected first';
    END IF;
END
$$;

ALTER TABLE trades
    ADD CONSTRAINT trades_quantity_max_int CHECK (quantity <= 2147483647);
