-- Migration: 19_billing.sql
-- Purpose: Per-user Stripe subscriptions with a no-card free trial.
-- Dependencies: 15_fix_role_resolution.sql (current_app_user_id()), 14_auth_roles.sql (signup trigger)
-- Safety Notes: Idempotent. Adds tables and replaces the signup trigger function;
--               existing users are backfilled with a trial starting now.
--
-- One row per user. Signup creates it in 'trialing' with no Stripe ids; the
-- Stripe webhook (service role) fills in customer/subscription ids and keeps
-- plan, status and period dates in sync. Users can read their own row only;
-- all writes go through the service role, never through a user session.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_plan') THEN
        CREATE TYPE billing_plan AS ENUM ('starter', 'pro', 'team');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan billing_plan,
    -- Mirrors Stripe's subscription status: trialing, active, past_due, canceled,
    -- unpaid, incomplete, incomplete_expired, paused.
    status VARCHAR(32) NOT NULL DEFAULT 'trialing',
    seats INT NOT NULL DEFAULT 1 CHECK (seats >= 1),
    trial_ends_at TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stripe delivers webhooks at least once; the event id makes processing idempotent.
CREATE TABLE IF NOT EXISTS billing_events (
    stripe_event_id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_owner_select ON subscriptions;
CREATE POLICY subscriptions_owner_select ON subscriptions FOR SELECT TO authenticated
    USING (user_id = (SELECT current_app_user_id()));
-- billing_events: no policies; only the service role touches it.

-- New users start a 14-day trial. Recreates 14's trigger function with the
-- subscription row added, and pins search_path for the SECURITY DEFINER body.
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO users (auth_id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
    RETURNING id INTO new_user_id;

    INSERT INTO user_roles (user_id, role) VALUES (new_user_id, 'viewer');

    INSERT INTO subscriptions (user_id, status, trial_ends_at)
    VALUES (new_user_id, 'trialing', NOW() + INTERVAL '14 days');

    RETURN NEW;
END;
$$;

-- Existing auth users get the same trial, starting now.
INSERT INTO subscriptions (user_id, status, trial_ends_at)
SELECT u.id, 'trialing', NOW() + INTERVAL '14 days'
FROM users u
WHERE u.auth_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;
