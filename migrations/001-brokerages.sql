BEGIN;

CREATE TABLE IF NOT EXISTS brokerages (
    code CHAR(3) PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    CONSTRAINT brokerages_code_format CHECK (code ~ '^[0-9]{3}$')
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'brokerages_code_format'
    ) THEN
        ALTER TABLE brokerages
            ADD CONSTRAINT brokerages_code_format CHECK (code ~ '^[0-9]{3}$');
    END IF;
END
$$;

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
    ('294', '펀드온라인코리아(한국포스증권)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

ALTER TABLE trades
    ADD COLUMN IF NOT EXISTS brokerage_code CHAR(3)
    REFERENCES brokerages(code) ON UPDATE RESTRICT ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS trades_brokerage_code_index
    ON trades (brokerage_code);

COMMIT;
