import React from 'react';
import { cn } from '../../lib/utils';
import SectionHeader from './SectionHeader';

interface ChartCardProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  /** chart area height in px — defaults to 300 */
  height?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  icon,
  title,
  subtitle,
  height = 300,
  actions,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm',
        className,
      )}
    >
      <SectionHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        actions={actions}
        className="mb-8"
      />
      <div style={{ height }} className="w-full">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
