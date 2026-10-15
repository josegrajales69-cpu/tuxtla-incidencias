DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'jose') THEN
        CREATE ROLE jose WITH LOGIN SUPERUSER PASSWORD 'postgres';
    ELSE
        ALTER ROLE jose WITH PASSWORD 'postgres';
    END IF;
END $$;
