import React from 'react';
import { WorkLogStatus } from '../../types';
import { cn, truncate } from '../../lib/utils';
import { STATUS_CONFIG } from '../../lib/uiConfig';

interface StatusBadgeProps {
  status: WorkLogStatus;
  rejectionReason?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, rejectionReason }) => {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={cn(
          'px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border',
          config.className,
        )}
      >
        {config.label}
      </span>
      {status === WorkLogStatus.REJECTED && rejectionReason && (
        <span
          className="text-[9px] text-rose-500/70 font-medium italic max-w-[120px]"
          title={rejectionReason}
        >
          &ldquo;{truncate(rejectionReason, 40)}&rdquo;
        </span>
      )}
    </div>
  );
};

export default StatusBadge;
