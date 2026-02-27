import React from 'react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
  className?: string;
  /** When rendered inside a <tbody>, pass colSpan to wrap in <tr><td> */
  colSpan?: number;
}

const Inner: React.FC<Omit<EmptyStateProps, 'colSpan'>> = ({
  message = 'No hay registros disponibles',
  icon,
  className,
}) => (
  <div className={cn('flex flex-col items-center justify-center py-12 gap-3', className)}>
    {icon && (
      <span className="text-zinc-300">{icon}</span>
    )}
    <p className="text-sm text-zinc-400 font-medium italic">{message}</p>
  </div>
);

const EmptyState: React.FC<EmptyStateProps> = ({ colSpan, ...rest }) => {
  if (colSpan !== undefined) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-6 py-0">
          <Inner {...rest} />
        </td>
      </tr>
    );
  }
  return <Inner {...rest} />;
};

export default EmptyState;
