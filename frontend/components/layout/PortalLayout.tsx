import React from 'react';
import { Toaster } from 'sonner';
import { cn } from '../../lib/utils';
import Header from '../Header';
import PageContainer from './PageContainer';
import { User } from '../../types';

interface PortalLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  /** Background + selection color classes for the portal — e.g. "bg-zinc-50 selection:bg-indigo-100" */
  bg?: string;
  /** Override page-container vertical padding — defaults to "py-10" */
  pagePadding?: string;
  className?: string;
}

/**
 * Standard portal shell: Toaster + Header + PageContainer.
 * Every role-portal uses this instead of repeating the same structure.
 *
 * Usage:
 * ```tsx
 * <PortalLayout user={user} onLogout={onLogout} bg="bg-zinc-50 selection:bg-indigo-100">
 *   {content}
 * </PortalLayout>
 * ```
 */
const PortalLayout: React.FC<PortalLayoutProps> = ({
  user,
  onLogout,
  children,
  bg = 'bg-background',
  pagePadding = 'py-10',
  className,
}) => {
  return (
    <div className={cn('min-h-screen', bg, className)}>
      <Toaster position="top-center" richColors />
      <Header user={user} onLogout={onLogout} />
      <PageContainer padding={pagePadding}>
        {children}
      </PageContainer>
    </div>
  );
};

export default PortalLayout;
