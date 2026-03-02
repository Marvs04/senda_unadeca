import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'indigo';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  neutral: 'bg-surface text-muted border-border',
  success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  danger:  'bg-rose-500/10 text-rose-600 border-rose-500/20',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  info:    'bg-sky-500/10 text-sky-600 border-sky-500/20',
  indigo:  'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
