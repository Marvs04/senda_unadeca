import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

type ModalWidth = 'sm' | 'md' | 'lg';

const WIDTH_STYLES: Record<ModalWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  width?: ModalWidth;
  children: React.ReactNode;
  className?: string;
  /** Prevent closing when clicking the backdrop */
  disableBackdropClose?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  width = 'md',
  children,
  className,
  disableBackdropClose = false,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/40 backdrop-blur-sm"
          onClick={!disableBackdropClose && onClose ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative bg-card rounded-[2.5rem] p-8 w-full shadow-2xl',
              WIDTH_STYLES[width],
              className,
            )}
            onClick={e => e.stopPropagation()}
          >
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute top-6 right-6 p-2 text-faint hover:text-foreground hover:bg-surface rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {(title || subtitle) && (
              <div className="mb-6">
                {title && (
                  <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                )}
                {subtitle && (
                  <p className="text-sm text-muted mt-1 leading-relaxed">{subtitle}</p>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
