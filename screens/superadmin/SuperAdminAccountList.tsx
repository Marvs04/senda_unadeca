import React from 'react';
import { Users, Search, RefreshCw } from 'lucide-react';
import { User, UserRole } from '../../types';
import { Badge, Button } from '../../components/ui';

interface SuperAdminAccountListProps {
  filteredAdmins: User[];
  adminSearch: string;
  setAdminSearch: (v: string) => void;
  onResetPassword: (name: string) => void;
}

const SuperAdminAccountList: React.FC<SuperAdminAccountListProps> = ({
  filteredAdmins,
  adminSearch,
  setAdminSearch,
  onResetPassword,
}) => {
  return (
    <div className="bg-card p-8 rounded-[2.5rem] border border-border-faint shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="icon-box-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Cuentas Administrativas</h3>
            <p className="text-xs text-muted">
              Usuarios con acceso de gestión, contabilidad y jefaturas
            </p>
          </div>
        </div>
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            placeholder="Buscar cuenta..."
            value={adminSearch}
            onChange={e => setAdminSearch(e.target.value)}
            className="w-full bg-surface border-border rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/5 transition-all text-[10px]"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-faint">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface text-[10px] uppercase tracking-widest font-bold text-faint">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-faint">
            {filteredAdmins.map(admin => (
              <tr key={admin.id} className="hover:bg-surface transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                      <span className="text-xs font-bold text-faint">
                        {admin.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{admin.name}</p>
                      {admin.employeeNumber && (
                        <p className="text-[10px] text-faint font-mono">
                          {admin.employeeNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant={
                      admin.role === UserRole.ADMIN ? 'indigo'
                      : admin.role === UserRole.DEPT_HEAD ? 'success'
                      : 'neutral'
                    }
                  >
                    {admin.role.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RefreshCw className="w-3 h-3" />}
                    onClick={() => onResetPassword(admin.name)}
                  >
                    Resetear
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminAccountList;
