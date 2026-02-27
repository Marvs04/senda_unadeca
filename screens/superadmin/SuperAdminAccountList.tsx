import React from 'react';
import { Users, Search, RefreshCw } from 'lucide-react';
import { User, UserRole } from '../../types';
import { cn } from '../../lib/utils';

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
    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-zinc-100 rounded-2xl">
            <Users className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Cuentas Administrativas</h3>
            <p className="text-xs text-zinc-500">
              Usuarios con acceso de gestión, contabilidad y jefaturas
            </p>
          </div>
        </div>
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar cuenta..."
            value={adminSearch}
            onChange={e => setAdminSearch(e.target.value)}
            className="w-full bg-zinc-50 border-zinc-200 rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-[10px]"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredAdmins.map(admin => (
              <tr key={admin.id} className="hover:bg-zinc-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-zinc-400">
                        {admin.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{admin.name}</p>
                      {admin.employeeNumber && (
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {admin.employeeNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                      admin.role === UserRole.ADMIN
                        ? 'bg-indigo-50 text-indigo-600'
                        : admin.role === UserRole.DEPT_HEAD
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-zinc-100 text-zinc-600',
                    )}
                  >
                    {admin.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    className="inline-flex items-center space-x-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
                    onClick={() => onResetPassword(admin.name)}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resetear</span>
                  </button>
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
