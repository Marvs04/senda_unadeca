import React from 'react';
import { cn } from '../../lib/utils';

interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  subtitle,
  actions,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center space-x-3">
        {icon && (
          <div className="p-2.5 bg-surface rounded-xl flex items-center justify-center text-muted shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-faint">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-faint mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center space-x-2">{actions}</div>
      )}
    </div>
  );
};

export default SectionHeader;
