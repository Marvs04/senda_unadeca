import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon, options, placeholder, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <select
            ref={ref}
            className={cn(
              'w-full appearance-none bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 px-5 pr-10',
              'text-sm font-medium text-zinc-900',
              'focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all',
              icon && 'pl-12',
              error && 'border-rose-300 focus:ring-rose-500/10',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
        </div>
        {error && <p className="text-xs text-rose-500 ml-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
