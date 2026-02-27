import React from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'success' | 'icon-action';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-900 shadow-xl shadow-zinc-900/10',
  outline:
    'bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200',
  ghost:
    'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border border-zinc-100',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 shadow-lg shadow-rose-600/10',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 shadow-lg shadow-emerald-600/10',
  'icon-action':
    'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 border-none rounded-lg',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3.5 text-sm',
  lg: 'px-8 py-4 text-base',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const isIconOnly = !children;

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-bold rounded-2xl transition-all active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_STYLES[variant],
        isIconOnly ? 'p-2 rounded-xl' : SIZE_STYLES[size],
        icon && children && 'space-x-2',
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0 flex items-center">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {iconRight && !loading && (
        <span className="shrink-0 flex items-center">{iconRight}</span>
      )}
    </button>
  );
};

export default Button;
