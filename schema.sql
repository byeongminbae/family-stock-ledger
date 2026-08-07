BEGIN;

CREATE TABLE owners (
    id SMALLINT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    CONSTRAINT owners_fixed_values CHECK (
        (id = 1 AND name = '병민') OR
        (id = 2 AND name = '할머니') OR
        (id = 3 AND name = '아빠')
    )
);

INSERT INTO owners (id, name)
VALUES (1, '병민'), (2, '할머니'), (3, '아빠');

CREATE TABLE securities (
    item_code TEXT PRIMARY KEY,
    stock_name TEXT NOT NULL,
    market TEXT NOT NULL,
    is_etf BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT securities_item_code_format CHECK (item_code ~ '^[0-9A-Z]{6}$'),
    CONSTRAINT securities_stock_name_not_blank CHECK (btrim(stock_name) <> ''),
    CONSTRAINT securities_market_not_blank CHECK (btrim(market) <> '')
);

CREATE TABLE trades (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id SMALLINT NOT NULL REFERENCES owners(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    security_code TEXT NOT NULL REFERENCES securities(item_code) ON UPDATE RESTRICT ON DELETE RESTRICT,
    side TEXT NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL,
    quantity BIGINT NOT NULL,
    unit_price BIGINT NOT NULL,
    realized_profit NUMERIC(38, 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT trades_side_values CHECK (side IN ('BUY', 'SELL')),
    CONSTRAINT trades_quantity_positive CHECK (quantity > 0),
    CONSTRAINT trades_unit_price_positive CHECK (unit_price > 0),
    CONSTRAINT trades_realized_profit_by_side CHECK (
        (side = 'BUY' AND realized_profit IS NULL) OR
        (side = 'SELL' AND realized_profit IS NOT NULL)
    )
);

CREATE INDEX trades_history_index
    ON trades (side, executed_at DESC, id DESC);
CREATE INDEX trades_position_timeline_index
    ON trades (owner_id, security_code, executed_at, id);
CREATE INDEX trades_buy_average_index
    ON trades (owner_id, security_code)
    WHERE side = 'BUY';

COMMIT;
