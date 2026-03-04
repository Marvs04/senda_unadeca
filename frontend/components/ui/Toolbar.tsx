import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToolbarProps {
  searchValue?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  /** Extra buttons / controls rendered to the right */
  actions?: React.ReactNode;
  className?: string;
}

const Toolbar: React.FC<ToolbarProps> = ({
  searchValue,
  onSearch,
  searchPlaceholder = 'Buscar...',
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
        className,
      )}
    >
      {onSearch !== undefined && (
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={e => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-surface border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/5 transition-all"
          />
        </div>
      )}
      {actions && (
        <div className="flex items-center space-x-3">{actions}</div>
      )}
    </div>
  );
};

export default Toolbar;
