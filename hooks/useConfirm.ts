import { useState, useCallback, useRef } from 'react';

interface ConfirmOptions {
  title?: string;
  variant?: 'default' | 'danger';
  confirmLabel?: string;
}

interface DialogState {
  open: boolean;
  message: string;
  title: string;
  variant: 'default' | 'danger';
  confirmLabel: string;
}

/**
 * useConfirm – reemplaza window.confirm con un modal accesible.
 *
 * @example
 * const { confirm, dialogProps } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const ok = await confirm('¿Eliminar este registro?', { variant: 'danger' });
 *   if (!ok) return;
 *   deleteItem();
 * };
 *
 * // En el JSX del componente:
 * <ConfirmDialog {...dialogProps} />
 */
export function useConfirm() {
  const [state, setState] = useState<DialogState>({
    open: false,
    message: '',
    title: 'Confirmar acción',
    variant: 'default',
    confirmLabel: 'Confirmar',
  });

  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback((message: string, options?: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      resolveRef.current = resolve;
      setState({
        open: true,
        message,
        title: options?.title ?? 'Confirmar acción',
        variant: options?.variant ?? 'default',
        confirmLabel: options?.confirmLabel ?? 'Confirmar',
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
    resolveRef.current(true);
  }, []);

  const handleCancel = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
    resolveRef.current(false);
  }, []);

  return {
    confirm,
    dialogProps: {
      open: state.open,
      message: state.message,
      title: state.title,
      variant: state.variant,
      confirmLabel: state.confirmLabel,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
