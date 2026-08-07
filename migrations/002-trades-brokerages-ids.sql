BEGIN;

ALTER TABLE securities
    ADD COLUMN IF NOT EXISTS id BIGINT GENERATED ALWAYS AS IDENTITY;

ALTER TABLE securities
    DROP CONSTRAINT IF EXISTS securities_pkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'securities_id_pkey'
      AND conrelid = 'securities'::regclass
  ) THEN
    ALTER TABLE securities ADD CONSTRAINT securities_id_pkey PRIMARY KEY (id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'securities_item_code_key'
      AND conrelid = 'securities'::regclass
  ) THEN
    ALTER TABLE securities ADD CONSTRAINT securities_item_code_key UNIQUE (item_code);
  END IF;
END;
$$;

ALTER TABLE brokerages
    ADD COLUMN IF NOT EXISTS id BIGINT GENERATED ALWAYS AS IDENTITY;

ALTER TABLE brokerages
    DROP CONSTRAINT IF EXISTS brokerages_pkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'brokerages_id_pkey'
      AND conrelid = 'brokerages'::regclass
  ) THEN
    ALTER TABLE brokerages ADD CONSTRAINT brokerages_id_pkey PRIMARY KEY (id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'brokerages_code_key'
      AND conrelid = 'brokerages'::regclass
  ) THEN
    ALTER TABLE brokerages ADD CONSTRAINT brokerages_code_key UNIQUE (code);
  END IF;
END;
$$;

ALTER TABLE trades
    ADD COLUMN IF NOT EXISTS security_id BIGINT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trades'
      AND column_name = 'security_code'
  ) THEN
    UPDATE trades t
    SET security_id = s.id
    FROM securities s
    WHERE t.security_id IS NULL
      AND t.security_code IS NOT NULL
      AND s.item_code = t.security_code;
  END IF;
END;
$$;

ALTER TABLE trades
    ADD COLUMN IF NOT EXISTS brokerage_id BIGINT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trades'
      AND column_name = 'brokerage_code'
  ) THEN
    UPDATE trades t
    SET brokerage_id = b.id
    FROM brokerages b
    WHERE t.brokerage_id IS NULL
      AND t.brokerage_code IS NOT NULL
      AND b.code = t.brokerage_code;
  END IF;
END;
$$;

ALTER TABLE trades
    ALTER COLUMN security_id SET NOT NULL;

ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_security_code_fkey;
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_brokerage_code_fkey;
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_security_id_fkey;
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_brokerage_id_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trades_security_id_fkey'
      AND conrelid = 'trades'::regclass
  ) THEN
    ALTER TABLE trades ADD CONSTRAINT trades_security_id_fkey
      FOREIGN KEY (security_id) REFERENCES securities(id)
      ON UPDATE RESTRICT ON DELETE RESTRICT;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trades_brokerage_id_fkey'
      AND conrelid = 'trades'::regclass
  ) THEN
    ALTER TABLE trades ADD CONSTRAINT trades_brokerage_id_fkey
      FOREIGN KEY (brokerage_id) REFERENCES brokerages(id)
      ON UPDATE RESTRICT ON DELETE RESTRICT;
  END IF;
END;
$$;

DROP INDEX IF EXISTS trades_brokerage_code_index;
DROP INDEX IF EXISTS trades_history_index;
DROP INDEX IF EXISTS trades_position_timeline_index;
DROP INDEX IF EXISTS trades_buy_average_index;
DROP INDEX IF EXISTS trades_brokerage_id_index;

CREATE INDEX IF NOT EXISTS trades_history_index
    ON trades (side, executed_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS trades_position_timeline_index
    ON trades (owner_id, security_id, executed_at, id);
CREATE INDEX IF NOT EXISTS trades_buy_average_index
    ON trades (owner_id, security_id)
    WHERE side = 'BUY';
CREATE INDEX IF NOT EXISTS trades_brokerage_id_index
    ON trades (brokerage_id);

ALTER TABLE trades
    DROP COLUMN IF EXISTS security_code;
ALTER TABLE trades
    DROP COLUMN IF EXISTS brokerage_code;

COMMIT;
