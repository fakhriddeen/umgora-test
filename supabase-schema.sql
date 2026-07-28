-- ==========================================
-- UMGORA Database Schema
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Members table
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_number VARCHAR(10) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  social_handle TEXT,
  stripe_payment_id TEXT,
  payment_status TEXT DEFAULT 'paid',
  passcode TEXT,                          -- bcrypt hash, stored server-side only
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);

-- Index for membership number uniqueness checks
CREATE INDEX IF NOT EXISTS idx_members_membership_number ON public.members(membership_number);

-- Row-Level Security (RLS)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can read/write (used by webhook + admin)
CREATE POLICY "Service role only" ON public.members
  USING (false)
  WITH CHECK (false);

-- Note: All DB operations in this app use the service role key server-side,
-- so RLS blocks public anon access while service role bypasses RLS.

-- ==========================================
-- MIGRATION: Add passcode column
-- Run this if the members table already exists
-- ==========================================
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS passcode TEXT;
