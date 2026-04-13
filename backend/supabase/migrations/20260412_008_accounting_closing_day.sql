-- Migration: add closing_day to accounting_config
-- closing_day: day of month (1-28) on which the accounting period closes.
-- Hours submitted after this day are counted in the NEXT cycle's report.

BEGIN;

ALTER TABLE public.accounting_config
  ADD COLUMN IF NOT EXISTS closing_day INTEGER NOT NULL DEFAULT 25
    CONSTRAINT closing_day_range CHECK (closing_day BETWEEN 1 AND 28);

COMMIT;
