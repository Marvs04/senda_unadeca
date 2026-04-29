-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 009: add must_change_password to profiles
-- Date: 2026-04-29
--
-- Purpose: force a password change on first login (or after an admin reset).
--   - Defaults to false for existing users.
--   - Set to true by the backend when creating a user or resetting their password.
--   - Cleared to false by the backend when the user completes the change.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.must_change_password IS
  'When true the user must change their password before accessing the system.
   Set by the backend on createUser and resetPassword; cleared on changePassword.';
