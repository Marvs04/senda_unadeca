export const INSTITUTIONAL_EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const COST_CENTER_REGEX = /^\d{2}-\d{4}$/;
export const WORK_LOG_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED']);
export const WORK_LOG_ENTRY_SOURCES = new Set(['MANUAL', 'KIOSK']);
