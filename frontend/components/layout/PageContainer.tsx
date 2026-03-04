import React from 'react';
import { cn } from '../../lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  /** Vertical padding applied to the main tag — defaults to "py-10" */
  padding?: string;
  className?: string;
  as?: 'main' | 'div' | 'section';
}

/**
 * Applies the global `.page-container` width + horizontal padding
 * (max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12).
 */
const PageContainer: React.FC<PageContainerProps> = ({
  children,
  padding = 'py-10',
  className,
  as: Tag = 'main',
}) => {
  return (
    <Tag className={cn('page-container', padding, className)}>
      {children}
    </Tag>
  );
};

export default PageContainer;
