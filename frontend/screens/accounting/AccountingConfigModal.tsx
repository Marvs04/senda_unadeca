import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Department } from '../../types';
import { Button, Input, Modal } from '../../components/ui';
import { cn } from '../../lib/utils';
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
  | 'closingDay'
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
  closingDay: 25,
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
  const [activeTab, setActiveTab] = useState<'global' | 'costcenters'>('global');
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
          closingDay: config.closingDay ?? 25,
        });
      })
      .catch(err => {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : 'No se pudo cargar la configuración contable', {
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

  const isAnyCostCenterInvalid = useMemo(
    () => departments.some(d => {
      const v = (deptCostCenters[d.id] ?? '').trim();
      return v.length > 0 && !COST_CENTER_REGEX.test(v);
    }),
    [departments, deptCostCenters],
  );

  const canSave = !isAnyAccountMissing && !isAnyCostCenterInvalid;

  const updateDraft = (key: keyof ConfigDraft, value: string | number) => {
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
        closingDay: draft.closingDay,
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
      title="Configuración de cuentas y centros"
      subtitle="Define códigos globales y centro de costo por departamento para la exportación de asientos."
      disableBackdropClose={saving}
    >
      {loading ? (
        <div className="py-8 text-sm text-muted">Cargando configuración...</div>
      ) : (
        <form onSubmit={handleSave}>
          {/* Tab bar */}
          <div className="flex space-x-1 bg-surface p-1 rounded-xl border border-border-faint mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('global')}
              className={cn(
                'flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                activeTab === 'global' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground',
              )}
            >
              Cuentas globales
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('costcenters')}
              className={cn(
                'flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                activeTab === 'costcenters' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground',
              )}
            >
              Centros de costo
              {missingCostCenterDepts.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[8px] font-black">
                  {missingCostCenterDepts.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'global' && (
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Código de becas"
                  value={draft.becasAccount}
                  onChange={e => updateDraft('becasAccount', e.target.value)}
                  placeholder="Ej. 5-01-001"
                  required
                />
                <Input
                  label="Nombre de cuenta becas"
                  value={draft.becasName}
                  onChange={e => updateDraft('becasName', e.target.value)}
                  required
                />

                <Input
                  label="Código de diezmo"
                  value={draft.diezmoAccount}
                  onChange={e => updateDraft('diezmoAccount', e.target.value)}
                  placeholder="Ej. 2-10-001"
                  required
                />
                <Input
                  label="Nombre de cuenta diezmo"
                  value={draft.diezmoName}
                  onChange={e => updateDraft('diezmoName', e.target.value)}
                  required
                />

                <Input
                  label="Código de cuentas por pagar"
                  value={draft.payableAccount}
                  onChange={e => updateDraft('payableAccount', e.target.value)}
                  placeholder="Ej. 2-20-001"
                  required
                />
                <Input
                  label="Nombre de cuenta por pagar"
                  value={draft.payableName}
                  onChange={e => updateDraft('payableName', e.target.value)}
                  required
                />

                <Input
                  label="Código de cuentas por cobrar"
                  value={draft.receivableAccount}
                  onChange={e => updateDraft('receivableAccount', e.target.value)}
                  placeholder="Ej. 1-20-001"
                  required
                />
                <Input
                  label="Nombre de cuenta por cobrar"
                  value={draft.receivableName}
                  onChange={e => updateDraft('receivableName', e.target.value)}
                  required
                />
              </div>

              {/* Closing day */}
              <div className="pt-2 border-t border-border-faint">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-faint mb-2">
                  Día de cierre del período
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={draft.closingDay}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (v >= 1 && v <= 28) updateDraft('closingDay', v);
                    }}
                    className="w-20 px-3 py-2 text-center font-mono text-sm bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                  <p className="text-xs text-faint">
                    Horas registradas después del día <strong>{draft.closingDay}</strong> de cada mes se contarán en el siguiente ciclo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'costcenters' && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-faint">
                  {deptCount} departamento{deptCount !== 1 ? 's' : ''} &mdash; formato requerido: <code className="font-mono">NN-NN-NN</code>
                </p>
                {missingCostCenterDepts.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                    <AlertTriangle className="w-3 h-3" />
                    {missingCostCenterDepts.length} sin configurar
                  </span>
                )}
              </div>

              {missingCostCenterDepts.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-500">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    Los departamentos sin centro de costo <strong>no aparecerán en la exportación TXT</strong> del asiento.
                    Formato requerido: <code className="font-mono">NN-NN-NN</code> (ej. <code className="font-mono">10-00-01</code>).
                  </p>
                </div>
              )}

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {departments.map(dept => {
                  const val = deptCostCenters[dept.id] ?? '';
                  const isInvalid = val.trim().length > 0 && !COST_CENTER_REGEX.test(val.trim());
                  return (
                    <div
                      key={dept.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 items-end rounded-2xl border border-border-faint p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{dept.name}</p>
                        {isInvalid && (
                          <p className="text-[10px] text-danger mt-0.5">Formato inválido — use NN-NN-NN</p>
                        )}
                      </div>
                      <Input
                        label="Centro de costo"
                        value={val}
                        onChange={e => updateDeptCostCenter(dept.id, e.target.value)}
                        placeholder="00-00-00"
                        maxLength={8}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-border-faint">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={saving} disabled={!canSave}>
              Guardar configuración
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default AccountingConfigModal;
