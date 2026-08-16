ALTER TABLE owners
    DROP CONSTRAINT IF EXISTS owners_fixed_values;

ALTER TABLE owners
    DROP CONSTRAINT IF EXISTS owners_name_not_blank;

ALTER TABLE owners
    ADD CONSTRAINT owners_name_not_blank CHECK (btrim(name) <> '');
