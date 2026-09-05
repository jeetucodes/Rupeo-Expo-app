-- ============================================================
-- Migration: 001_subscriptions
-- Description: Rupeo Premium Subscription table
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- user_id is TEXT to support Firebase Auth UIDs (alphanumeric string, e.g. "xK82la...")
  -- If using Supabase Auth, UUID values are also safely stored as text.
  user_id          TEXT        NOT NULL,

  -- Google Play product identifiers
  product_id       TEXT        NOT NULL,
  base_plan_id     TEXT        NOT NULL,

  -- Google Play purchase token (unique per purchase)
  purchase_token   TEXT        UNIQUE NOT NULL,

  -- Subscription lifecycle status
  status           TEXT        NOT NULL DEFAULT 'active'
                               CHECK (status IN (
                                 'active', 'cancelled', 'expired',
                                 'on_hold', 'grace_period', 'paused'
                               )),

  -- Dates
  purchase_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiry_date      TIMESTAMPTZ,

  -- Audit
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_purchase_token
  ON public.subscriptions (purchase_token);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions (user_id, status);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- ============================================================
-- GRANT permissions
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT SELECT ON public.subscriptions TO anon;

-- ============================================================
-- HELPFUL VIEW: active_subscriptions
-- ============================================================
CREATE OR REPLACE VIEW public.active_subscriptions AS
SELECT DISTINCT ON (user_id)
  id,
  user_id,
  product_id,
  base_plan_id,
  purchase_token,
  status,
  purchase_date,
  expiry_date,
  updated_at
FROM public.subscriptions
WHERE status = 'active'
  AND (expiry_date IS NULL OR expiry_date > now())
ORDER BY user_id, purchase_date DESC;

GRANT SELECT ON public.active_subscriptions TO authenticated;
