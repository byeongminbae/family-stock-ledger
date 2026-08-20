ALTER TABLE trades
    DROP CONSTRAINT trades_owner_id_fkey;

ALTER TABLE owners
    ALTER COLUMN id TYPE BIGINT;

ALTER TABLE trades
    ALTER COLUMN owner_id TYPE BIGINT;

ALTER TABLE trades
    ADD CONSTRAINT trades_owner_id_fkey
        FOREIGN KEY (owner_id) REFERENCES owners(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT;
