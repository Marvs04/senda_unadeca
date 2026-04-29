import React, { useEffect, useMemo, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { motion } from 'motion/react';
import { Plus, Edit2, Power, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { User, Department, UserRole } from '../../types';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminUsersData } from '../../hooks/useAdminUsersData';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Toolbar, Button, Badge, Modal, EmptyState, Input, Select } from '../../components/ui';
import type { SelectOption } from '../../components/ui';

const INSTITUTIONAL_EMAIL_REGEX = /^[A-Z0-9._%+-]+@unadeca\.net$/i;

interface AdminStudentsTabProps {
  allUsers: User[];
  allDepartments: Department[];
  addUser: (newUser: Omit<User, 'id'>, password?: string) => Promise<void> | void;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void> | void;
  deleteUser: (userId: string) => Promise<void> | void;
}

const AdminStudentsTab: React.FC<AdminStudentsTabProps> = ({
  allUsers,
  allDepartments,
  addUser,
  updateUser,
  deleteUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCarnet, setNewStudentCarnet] = useState('');
  const [newStudentInstitutionalEmail, setNewStudentInstitutionalEmail] = useState('');
  const [newStudentDepartmentId, setNewStudentDepartmentId] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editCarnet, setEditCarnet] = useState('');
  const [editInstitutionalEmail, setEditInstitutionalEmail] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const { confirm, dialogProps } = useConfirm();

  const { filteredStudents } = useAdminUsersData({ allUsers, studentSearch: debouncedSearch, deptHeadSearch: '' });

  // ── Filters & sort ──────────────────────────────────────────────────────────
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortMode, setSortMode] = useState<'NAME_ASC' | 'NAME_DESC' | 'DEPT_ASC' | 'STATUS'>('NAME_ASC');

  const processedStudents = useMemo(() => {
    let list = filteredStudents.filter(s => {
      if (departmentFilter === '__none__' && s.departmentId) return false;
      if (departmentFilter !== 'ALL' && departmentFilter !== '__none__' && s.departmentId !== departmentFilter) return false;
      if (statusFilter === 'ACTIVE' && s.isActive === false) return false;
      if (statusFilter === 'INACTIVE' && s.isActive !== false) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortMode) {
        case 'NAME_ASC':  return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
        case 'NAME_DESC': return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
        case 'DEPT_ASC': {
          const da = allDepartments.find(d => d.id === a.departmentId)?.name ?? 'zzz';
          const db = allDepartments.find(d => d.id === b.departmentId)?.name ?? 'zzz';
          return da.localeCompare(db, 'es', { sensitivity: 'base' });
        }
        case 'STATUS': return (a.isActive === false ? 1 : 0) - (b.isActive === false ? 1 : 0);
        default: return 0;
      }
    });
    return list;
  }, [filteredStudents, departmentFilter, statusFilter, sortMode, allDepartments]);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(processedStudents.length / PAGE_SIZE));
  const paginatedStudents = useMemo(
    () => processedStudents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [processedStudents, page],
  );
  useEffect(() => { setPage(0); }, [debouncedSearch, departmentFilter, statusFilter, sortMode]);

  const resetStudentForm = () => {
    setNewStudentName('');
    setNewStudentCarnet('');
    setNewStudentInstitutionalEmail('');
    setNewStudentDepartmentId('');
    setNewStudentPassword('');
  };

  const handleCreateStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = newStudentName.trim();
    const carnet = newStudentCarnet.trim();

    if (!name || !carnet) {
      toast.error('Nombre y carnet son requeridos.');
      return;
    }
    if (!newStudentInstitutionalEmail.trim()) {
      toast.error('El correo institucional es requerido.');
      return;
    }
    if (!INSTITUTIONAL_EMAIL_REGEX.test(newStudentInstitutionalEmail.trim())) {
      toast.error('El correo institucional debe tener el formato usuario@unadeca.net');
      return;
    }

    try {
      await addUser(
        {
          name,
          carnet,
          institutionalEmail: newStudentInstitutionalEmail.trim(),
          role: UserRole.STUDENT,
          isActive: true,
          departmentId: newStudentDepartmentId || undefined,
        },
        newStudentPassword.trim() || undefined,
      );

      toast.success('Estudiante creado exitosamente', { position: 'top-center' });
      setIsAddingStudent(false);
      resetStudentForm();
    } catch {
      return;
    }
  };

  const openEditStudent = (student: User) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditCarnet(student.carnet ?? '');
    setEditInstitutionalEmail(student.institutionalEmail ?? '');
    setEditDepartmentId(student.departmentId ?? '');
  };

  const handleEditStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStudent) return;

    const name = editName.trim();
    const carnet = editCarnet.trim();
    if (!name || !carnet) {
      toast.error('Nombre y carnet son requeridos.');
      return;
    }
    if (editInstitutionalEmail.trim() && !INSTITUTIONAL_EMAIL_REGEX.test(editInstitutionalEmail.trim())) {
      toast.error('El correo institucional debe tener el formato usuario@unadeca.net');
      return;
    }

    try {
      await updateUser(editingStudent.id, {
        name,
        carnet,
        institutionalEmail: editInstitutionalEmail.trim() || undefined,
        departmentId: editDepartmentId || undefined,
      });
      toast.success('Estudiante actualizado correctamente', { position: 'top-center' });
      setEditingStudent(null);
    } catch {
      return;
    }
  };

  const handleToggleActive = async (student: User) => {
    const nextActive = student.isActive === false;
    const actionLabel = nextActive ? 'activar' : 'desactivar';
    const ok = await confirm(`¿Deseas ${actionLabel} la cuenta de ${student.name}?`, {
      title: `${nextActive ? 'Activar' : 'Desactivar'} cuenta`,
      variant: nextActive ? 'default' : 'danger',
    });
    if (!ok) return;

    try {
      await updateUser(student.id, { isActive: nextActive });
      toast.success(`Cuenta ${nextActive ? 'activada' : 'desactivada'} correctamente`, { position: 'top-center' });
    } catch {
      return;
    }
  };

  const handleDeleteStudent = async (student: User) => {
    const ok = await confirm(`¿Eliminar la cuenta de ${student.name}?`, {
      title: 'Eliminar cuenta',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteUser(student.id);
      toast.success('Cuenta eliminada correctamente', { position: 'top-center' });
    } catch {
      return;
    }
  };

  const departmentOptions: SelectOption[] = [
    { value: '', label: 'Sin Asignar' },
    ...allDepartments.map(d => ({ value: d.id, label: d.name })),
  ];

  return (
    <motion.div
      key="students"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <Toolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por nombre o carnet..."
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsAddingStudent(true)}>
            Nuevo Estudiante
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-faint">Departamento</label>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="select-custom text-sm"
          >
            <option value="ALL">Todos los departamentos</option>
            {allDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            <option value="__none__">Sin Asignar</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-faint">Estado</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            className="select-custom text-sm"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Solo activos</option>
            <option value="INACTIVE">Solo inactivos</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-faint">Ordenar por</label>
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as 'NAME_ASC' | 'NAME_DESC' | 'DEPT_ASC' | 'STATUS')}
            className="select-custom text-sm"
          >
            <option value="NAME_ASC">Nombre A-Z</option>
            <option value="NAME_DESC">Nombre Z-A</option>
            <option value="DEPT_ASC">Departamento A-Z</option>
            <option value="STATUS">Activos primero</option>
          </select>
        </div>
        {(departmentFilter !== 'ALL' || statusFilter !== 'ALL' || sortMode !== 'NAME_ASC') && (
          <button
            type="button"
            onClick={() => { setDepartmentFilter('ALL'); setStatusFilter('ALL'); setSortMode('NAME_ASC'); }}
            className="text-xs text-[#1d3261] hover:underline font-medium pb-1"
          >
            Restablecer
          </button>
        )}
        <p className="text-xs text-faint pb-1 ml-auto">
          <span className="font-bold text-foreground">{processedStudents.length}</span> estudiante{processedStudents.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="bg-card rounded-[2.5rem] border border-border-faint shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface text-[10px] uppercase tracking-widest font-bold text-faint">
            <tr>
              <th className="px-8 py-5">Estudiante</th>
              <th className="px-8 py-5">Carnet</th>
              <th className="px-8 py-5">Correo Institucional</th>
              <th className="px-8 py-5">Departamento</th>
              <th className="px-8 py-5">Estado</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-faint">
            {paginatedStudents.map(student => (
              <tr key={student.id} className="hover:bg-surface transition-colors group">
                <td className="px-8 py-5 font-medium text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    {student.name}
                  </div>
                </td>
                <td className="px-8 py-5 text-sm text-muted font-mono">{student.carnet || '---'}</td>
                <td className="px-8 py-5 text-sm text-muted">{student.institutionalEmail || <span className="italic text-faint">Sin correo</span>}</td>
                <td className="px-8 py-5">
                  <Badge variant={allDepartments.find(d => d.id === student.departmentId) ? 'neutral' : 'warning'}>
                    {allDepartments.find(d => d.id === student.departmentId)?.name || 'Sin Asignar'}
                  </Badge>
                </td>
                <td className="px-8 py-5">
                  <Badge variant={student.isActive === false ? 'danger' : 'success'}>
                    {student.isActive === false ? 'Inactiva' : 'Activa'}
                  </Badge>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button variant="icon-action" onClick={() => openEditStudent(student)} title="Editar Estudiante">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="icon-action"
                      onClick={() => handleToggleActive(student)}
                      title={student.isActive === false ? 'Activar cuenta' : 'Desactivar cuenta'}
                      className={student.isActive === false ? 'hover:text-emerald-600 hover:bg-emerald-50' : 'hover:text-amber-600 hover:bg-amber-50'}
                    >
                      <Power className="w-4 h-4" />
                    </Button>
                    <Button variant="icon-action" onClick={() => handleDeleteStudent(student)} title="Eliminar Cuenta" className="hover:text-rose-600 hover:bg-rose-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedStudents.length === 0 && (
              <EmptyState colSpan={6} message="No se encontraron estudiantes" />
            )}
          </tbody>
        </table>
        {/* Pagination footer */}
        {processedStudents.length > PAGE_SIZE && (
          <div className="px-8 py-4 border-t border-border-faint flex items-center justify-between">
            <p className="text-xs text-faint">
              Mostrando <span className="font-bold text-foreground">{paginatedStudents.length}</span> de{' '}
              <span className="font-bold text-foreground">{filteredStudents.length}</span> estudiantes
            </p>
            <div className="flex items-center gap-1">
              <Button variant="icon-action" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium text-faint min-w-[60px] text-center">{page + 1} / {totalPages}</span>
              <Button variant="icon-action" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Change Dept Modal */}
      <Modal
        open={isAddingStudent}
        onClose={() => {
          setIsAddingStudent(false);
          resetStudentForm();
        }}
        title="Nuevo Estudiante"
      >
        <form onSubmit={handleCreateStudent} className="space-y-5">
          <Input
            label="Nombre Completo"
            value={newStudentName}
            onChange={e => setNewStudentName(e.target.value)}
            placeholder="Ej. María Gómez"
            autoFocus
            required
          />
          <Input
            label="Carnet"
            value={newStudentCarnet}
            onChange={e => setNewStudentCarnet(e.target.value)}
            placeholder="Ej. 20240001"
            required
          />
          <Input
            label="Correo Institucional *"
            type="email"
            value={newStudentInstitutionalEmail}
            onChange={e => setNewStudentInstitutionalEmail(e.target.value)}
            placeholder="usuario@unadeca.net"
            required
          />
          <Select
            label="Departamento"
            value={newStudentDepartmentId}
            onChange={e => setNewStudentDepartmentId(e.target.value)}
            options={departmentOptions}
          />
          <Input
            label="Contraseña Temporal (opcional)"
            type="password"
            value={newStudentPassword}
            onChange={e => setNewStudentPassword(e.target.value)}
            placeholder="Si se deja vacío, se usa el carnet"
          />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddingStudent(false);
                resetStudentForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Crear Cuenta
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Editar Estudiante"
        subtitle={editingStudent ? `Actualiza la información de ${editingStudent.name}` : ''}
      >
        <form onSubmit={handleEditStudent} className="space-y-5">
          <Input
            label="Nombre Completo"
            value={editName}
            onChange={e => setEditName(e.target.value)}
          />
          <Input
            label="Carnet"
            value={editCarnet}
            onChange={e => setEditCarnet(e.target.value)}
          />
          <Input
            label="Correo Institucional (opcional)"
            type="email"
            value={editInstitutionalEmail}
            onChange={e => setEditInstitutionalEmail(e.target.value)}
            placeholder="ejemplo@unadeca.ac.cr"
          />
          <Select
            label="Departamento"
            value={editDepartmentId}
            onChange={e => setEditDepartmentId(e.target.value)}
            options={departmentOptions}
          />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setEditingStudent(null)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog {...dialogProps} />
    </motion.div>
  );
};

export default AdminStudentsTab;
