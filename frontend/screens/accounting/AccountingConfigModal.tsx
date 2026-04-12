import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Department } from '../../types';
import { Button, Input, Modal } from '../../components/ui';
import {
  getAccountingConfig,
  updateAccountingConfig,
  type AccountingConfig,
} from '../../services/accountingService';
import { patchDepartment } from '../../services/departmentService';

// Accepts either empty string (not yet configured) or the exact NN-NN-NN format
const COST_CENTER_REGEX = /^\d{2}-\d{2}-\d{2}$/;

type ConfigDraft = Pick<
  AccountingConfig,
  | 'becasAccount'
  | 'becasName'
  | 'diezmoAccount'
  | 'diezmoName'
  | 'payableAccount'
  | 'payableName'
  | 'receivableAccount'
  | 'receivableName'
>;

const DEFAULT_DRAFT: ConfigDraft = {
  becasAccount: '',
  becasName: 'Becas Estudiantiles',
  diezmoAccount: '',
  diezmoName: 'Diezmos',
  payableAccount: '',
  payableName: 'Cuentas por Pagar',
  receivableAccount: '',
  receivableName: 'Cuentas por Cobrar',
};

function normalizeCostCenterInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

interface AccountingConfigModalProps {
  open: boolean;
  onClose: () => void;
  departments: Department[];
}

const AccountingConfigModal: React.FC<AccountingConfigModalProps> = ({
  open,
  onClose,
  departments,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ConfigDraft>(DEFAULT_DRAFT);
  const [deptCostCenters, setDeptCostCenters] = useState<Record<string, string>>({});

  const deptCount = departments.length;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    getAccountingConfig()
      .then(config => {
        if (cancelled) return;

        setDraft({
          becasAccount: config.becasAccount ?? '',
          becasName: config.becasName ?? 'Becas Estudiantiles',
          diezmoAccount: config.diezmoAccount ?? '',
          diezmoName: config.diezmoName ?? 'Diezmos',
          payableAccount: config.payableAccount ?? '',
          payableName: config.payableName ?? 'Cuentas por Pagar',
          receivableAccount: config.receivableAccount ?? '',
          receivableName: config.receivableName ?? 'Cuentas por Cobrar',
        });
      })
      .catch(err => {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : 'No se pudo cargar la configuracion contable', {
          position: 'top-center',
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const initialCostCenters = departments.reduce<Record<string, string>>((acc, dept) => {
      acc[dept.id] = dept.costCenter ?? '';
      return acc;
    }, {});
    setDeptCostCenters(initialCostCenters);

    return () => {
      cancelled = true;
    };
  }, [open, departments]);

  const isAnyAccountMissing = useMemo(
    () => [
      draft.becasAccount,
      draft.becasName,
      draft.diezmoAccount,
      draft.diezmoName,
      draft.payableAccount,
      draft.payableName,
      draft.receivableAccount,
      draft.receivableName,
    ].some(value => !String(value).trim()),
    [draft],
  );

  const updateDraft = (key: keyof ConfigDraft, value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const updateDeptCostCenter = (deptId: string, value: string) => {
    setDeptCostCenters(prev => ({ ...prev, [deptId]: normalizeCostCenterInput(value) }));
  };

  const missingCostCenterDepts = useMemo(
    () => departments.filter(d => !(deptCostCenters[d.id] ?? '').trim()),
    [departments, deptCostCenters],
  );

  const validateCostCenters = (): boolean => {
    for (const dept of departments) {
      const value = (deptCostCenters[dept.id] ?? '').trim();
      // Empty is allowed (warning shown), but a non-empty value MUST match the format
      if (value && !COST_CENTER_REGEX.test(value)) {
        toast.error(`Centro de costo invalido para "${dept.name}". Use formato NN-NN-NN (ej. 10-00-01).`, {
          position: 'top-center',
        });
        return false;
      }
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAnyAccountMissing) {
      toast.error('Completa todos los codigos y nombres de cuentas contables.', {
        position: 'top-center',
      });
      return;
    }

    if (!validateCostCenters()) return;

    // Only PATCH departments where the cost center actually changed AND the new value is valid (non-empty or same as before)
    const changedDepartments = departments.filter(dept => {
      const previousValue = String(dept.costCenter ?? '').trim();
      const nextValue = String(deptCostCenters[dept.id] ?? '').trim();
      // Skip if unchanged
      if (previousValue === nextValue) return false;
      // Skip if new value is empty — we don't actively clear cost centers via this flow
      if (!nextValue) return false;
      return true;
    });

    setSaving(true);
    try {
      await updateAccountingConfig({
        becasAccount: draft.becasAccount.trim(),
        becasName: draft.becasName.trim(),
        diezmoAccount: draft.diezmoAccount.trim(),
        diezmoName: draft.diezmoName.trim(),
        payableAccount: draft.payableAccount.trim(),
        payableName: draft.payableName.trim(),
        receivableAccount: draft.receivableAccount.trim(),
        receivableName: draft.receivableName.trim(),
      });

      if (changedDepartments.length > 0) {
        await Promise.all(
          changedDepartments.map(dept =>
            patchDepartment(dept.id, {
              costCenter: String(deptCostCenters[dept.id] ?? '').trim(),
            }),
          ),
        );
      }

      toast.success('Configuracion contable guardada correctamente.', { position: 'top-center' });
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No fue posible guardar la configuracion contable.', {
        position: 'top-center',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="lg"
      title="Configuracion de Cuentas y Centros"
      subtitle="Define codigos globales y centro de costo por departamento para la exportacion de asientos."
      disableBackdropClose={saving}
      className="max-h-[90vh] overflow-y-auto"
    >
      {loading ? (
        <div className="py-8 text-sm text-muted">Cargando configuracion...</div>
      ) : (
        <form className="space-y-8" onSubmit={handleSave}>
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-faint">
              Cuentas Globales
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Codigo Becas"
                value={draft.becasAccount}
                onChange={e => updateDraft('becasAccount', e.target.value)}
                placeholder="Ej. 5-01-001"
                required
              />
              <Input
                label="Nombre Becas"
                value={draft.becasName}
                onChange={e => updateDraft('becasName', e.target.value)}
                required
              />

              <Input
                label="Codigo Diezmo"
                value={draft.diezmoAccount}
                onChange={e => updateDraft('diezmoAccount', e.target.value)}
                placeholder="Ej. 2-10-001"
                required
              />
              <Input
                label="Nombre Diezmo"
                value={draft.diezmoName}
                onChange={e => updateDraft('diezmoName', e.target.value)}
                required
              />

              <Input
                label="Codigo Cuentas por Pagar"
                value={draft.payableAccount}
                onChange={e => updateDraft('payableAccount', e.target.value)}
                placeholder="Ej. 2-20-001"
                required
              />
              <Input
                label="Nombre Cuentas por Pagar"
                value={draft.payableName}
                onChange={e => updateDraft('payableName', e.target.value)}
                required
              />

              <Input
                label="Codigo Cuentas por Cobrar"
                value={draft.receivableAccount}
                onChange={e => updateDraft('receivableAccount', e.target.value)}
                placeholder="Ej. 1-20-001"
                required
              />
              <Input
                label="Nombre Cuentas por Cobrar"
                value={draft.receivableName}
                onChange={e => updateDraft('receivableName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-widest text-faint">
                Centros de Costo por Departamento ({deptCount})
              </h4>
              {missingCostCenterDepts.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                  <AlertTriangle className="w-3 h-3" />
                  {missingCostCenterDepts.length} sin configurar
                </span>
              )}
            </div>

            {missingCostCenterDepts.length > 0 && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-500">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Los departamentos sin centro de costo <strong>no apareceran en la exportacion TXT</strong> del asiento.
                  Formato requerido: <code className="font-mono">NN-NN-NN</code> (ej. <code className="font-mono">10-00-01</code>).
                </p>
              </div>
            )}

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {departments.map(dept => (
                <div
                  key={dept.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 items-end rounded-2xl border border-border-faint p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{dept.name}</p>
                    <p className="text-xs text-faint">Formato requerido: NN-NN-NN</p>
                  </div>
                  <Input
                    label="Centro de costo"
                    value={deptCostCenters[dept.id] ?? ''}
                    onChange={e => updateDeptCostCenter(dept.id, e.target.value)}
                    placeholder="Ej. 10-00-01"
                    maxLength={8}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Guardar Configuracion
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default AccountingConfigModal;
