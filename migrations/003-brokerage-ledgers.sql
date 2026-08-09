BEGIN;

LOCK TABLE trades IN SHARE ROW EXCLUSIVE MODE;

DO $$
DECLARE
    invalid_prefix RECORD;
BEGIN
    SELECT
        owner_id,
        security_id,
        brokerage_id,
        id,
        executed_at,
        running_quantity
    INTO invalid_prefix
    FROM (
        SELECT
            owner_id,
            security_id,
            brokerage_id,
            id,
            executed_at,
            SUM(CASE WHEN side = 'BUY' THEN quantity ELSE -quantity END) OVER (
                PARTITION BY owner_id, security_id, brokerage_id
                ORDER BY executed_at, id
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS running_quantity
        FROM trades
    ) AS prefixes
    WHERE running_quantity < 0
    ORDER BY executed_at, id
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'brokerage ledger has a negative quantity prefix: owner_id=%s security_id=%s brokerage_id=%s trade_id=%s executed_at=%s running_quantity=%s',
                invalid_prefix.owner_id,
                invalid_prefix.security_id,
                COALESCE(invalid_prefix.brokerage_id::text, 'NULL'),
                invalid_prefix.id,
                invalid_prefix.executed_at,
                invalid_prefix.running_quantity
            );
    END IF;
END
$$;

WITH RECURSIVE
ordered_trades AS (
    SELECT
        id,
        owner_id,
        security_id,
        brokerage_id,
        side,
        quantity,
        unit_price,
        ROW_NUMBER() OVER (
            PARTITION BY owner_id, security_id, brokerage_id
            ORDER BY executed_at, id
        ) AS ledger_row
    FROM trades
),
ledger_replay AS (
    SELECT
        ledger.owner_id,
        ledger.security_id,
        ledger.brokerage_id,
        0::bigint AS ledger_row,
        NULL::bigint AS trade_id,
        0::numeric AS held_quantity,
        0::numeric AS remaining_cost,
        NULL::numeric AS computed_profit
    FROM (
        SELECT DISTINCT owner_id, security_id, brokerage_id
        FROM ordered_trades
    ) AS ledger

    UNION ALL

    SELECT
        replay.owner_id,
        replay.security_id,
        replay.brokerage_id,
        trade.ledger_row,
        trade.id,
        CASE
            WHEN trade.side = 'BUY' THEN replay.held_quantity + trade.quantity::numeric
            ELSE replay.held_quantity - trade.quantity::numeric
        END,
        CASE
            WHEN trade.side = 'BUY' THEN
                replay.remaining_cost + trade.quantity::numeric * trade.unit_price::numeric
            WHEN replay.held_quantity = trade.quantity::numeric THEN 0::numeric
            ELSE replay.remaining_cost - sold.sold_cost
        END,
        CASE
            WHEN trade.side = 'SELL' THEN
                trade.quantity::numeric * trade.unit_price::numeric - sold.sold_cost
            ELSE NULL::numeric
        END
    FROM ledger_replay AS replay
    JOIN ordered_trades AS trade
      ON trade.owner_id = replay.owner_id
     AND trade.security_id = replay.security_id
     AND trade.brokerage_id IS NOT DISTINCT FROM replay.brokerage_id
     AND trade.ledger_row = replay.ledger_row + 1
    CROSS JOIN LATERAL (
        SELECT CASE
            WHEN trade.side = 'SELL' THEN floor(
                replay.remaining_cost * trade.quantity::numeric / replay.held_quantity + 0.5
            )
            ELSE NULL::numeric
        END AS sold_cost
    ) AS sold
),
sell_profits AS (
    SELECT trade_id, computed_profit
    FROM ledger_replay
    WHERE computed_profit IS NOT NULL
)
UPDATE trades
SET realized_profit = sell_profits.computed_profit
FROM sell_profits
WHERE trades.id = sell_profits.trade_id
  AND trades.realized_profit IS DISTINCT FROM sell_profits.computed_profit;

DO $$
BEGIN
    IF pg_get_indexdef(to_regclass('public.trades_position_timeline_index'))
        IS DISTINCT FROM
        'CREATE INDEX trades_position_timeline_index ON public.trades USING btree (owner_id, security_id, brokerage_id, executed_at, id)'
    THEN
        DROP INDEX IF EXISTS trades_position_timeline_index;
        CREATE INDEX trades_position_timeline_index
            ON trades (owner_id, security_id, brokerage_id, executed_at, id);
    END IF;

    IF pg_get_indexdef(to_regclass('public.trades_buy_average_index'))
        IS DISTINCT FROM
        'CREATE INDEX trades_buy_average_index ON public.trades USING btree (owner_id, security_id, brokerage_id) WHERE (side = ''BUY''::text)'
    THEN
        DROP INDEX IF EXISTS trades_buy_average_index;
        CREATE INDEX trades_buy_average_index
            ON trades (owner_id, security_id, brokerage_id)
            WHERE side = 'BUY';
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS trades_history_index
    ON trades (side, executed_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS trades_brokerage_id_index
    ON trades (brokerage_id);

COMMIT;
