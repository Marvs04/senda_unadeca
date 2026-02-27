import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, trailing, error, hint, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 px-5',
              'text-sm font-medium placeholder:text-zinc-400',
              'focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all',
              icon && 'pl-12',
              trailing && 'pr-12',
              error && 'border-rose-300 focus:ring-rose-500/10',
              className,
            )}
            {...props}
          />
          {trailing && (
            <span className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center">
              {trailing}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-rose-500 ml-1">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-zinc-400 ml-1">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
