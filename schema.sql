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

CREATE TABLE brokerages (
    code CHAR(3) PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    CONSTRAINT brokerages_code_format CHECK (code ~ '^[0-9]{3}$')
);

INSERT INTO brokerages (code, name)
VALUES
    ('209', '유안타증권'),
    ('218', 'KB증권'),
    ('227', 'KTB투자증권(다올투자증권)'),
    ('238', '미래에셋증권'),
    ('240', '삼성증권'),
    ('243', '한국투자증권'),
    ('247', 'NH투자증권'),
    ('261', '교보증권'),
    ('262', '아이엠증권'),
    ('263', '현대차증권'),
    ('264', '키움증권'),
    ('266', 'SK증권'),
    ('267', '대신증권'),
    ('269', '한화투자증권'),
    ('270', '하나금융투자'),
    ('271', '토스증권'),
    ('278', '신한금융투자'),
    ('279', 'DB금융투자'),
    ('280', '유진투자증권'),
    ('287', '메리츠증권'),
    ('288', '카카오페이증권'),
    ('290', '부국증권'),
    ('291', '신영증권'),
    ('292', 'LIG투자증권'),
    ('294', '펀드온라인코리아(한국포스증권)');

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
    brokerage_code CHAR(3) REFERENCES brokerages(code) ON UPDATE RESTRICT ON DELETE RESTRICT,
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
CREATE INDEX trades_brokerage_code_index
    ON trades (brokerage_code);

COMMIT;
