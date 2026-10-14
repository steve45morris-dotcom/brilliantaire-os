-- Migration: 29_security_tidy.sql
-- Purpose: Clear three warnings from Supabase's security advisor.
--          1. handle_new_auth_user() is the signup trigger, but anyone could
--             also call it through the API (/rest/v1/rpc/handle_new_auth_user).
--             Only the trigger needs it: Postgres checks EXECUTE when a
--             trigger is created, not when it fires.
--          2. update_updated_at_column() had no fixed search_path.
--          3. pg_trgm sat in the public schema, which the API exposes. It moves
--             to Supabase's extensions schema, next to pgcrypto and uuid-ossp.
-- Dependencies: 01_extensions.sql, 11_triggers_functions.sql, 19_billing.sql.
-- Safety Notes: No tables, columns or data change. The two trigram indexes
--          (10_indexes.sql) follow the extension, and no function calls
--          pg_trgm directly, so nothing else needs it on its search_path.

REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;

-- Its body only calls NOW(), which is in pg_catalog and always found.
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
