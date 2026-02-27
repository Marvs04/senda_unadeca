import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  Key, 
  Plus, 
  RefreshCw, 
  UserPlus,
  ArrowRight,
  ShieldAlert,
  Search,
  Lock,
  Briefcase,
  HelpCircle
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Header from '../components/Header';
import { User, UserRole } from '../types';
import { cn } from '../lib/utils';

interface SuperAdminPortalProps {
  user: User;
  onLogout: () => void;
  allUsers: User[];
  addUser: (newUser: Omit<User, 'id'>) => void;
}

const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({ user, onLogout, allUsers, addUser }) => {
    const [adminName, setAdminName] = useState('');
    const [adminRole, setAdminRole] = useState<UserRole>(UserRole.ADMIN);
    const [adminPassword, setAdminPassword] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [adminSearch, setAdminSearch] = useState('');

    const adminUsers = useMemo(() => 
        (allUsers || []).filter(u => u.role === UserRole.ADMIN || u.role === UserRole.ACCOUNTING || u.role === UserRole.DEPT_HEAD), 
    [allUsers]);

    const filteredAdmins = useMemo(() => 
        adminUsers.filter(a => 
            (a.name || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
            a.employeeNumber?.toLowerCase().includes(adminSearch.toLowerCase())
        ),
    [adminUsers, adminSearch]);

    const students = useMemo(() => 
        (allUsers || []).filter(u => u.role === UserRole.STUDENT), 
    [allUsers]);

    const filteredStudents = useMemo(() => 
        students.filter(s => 
            (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) || 
            s.carnet?.includes(studentSearch)
        ), 
    [students, studentSearch]);

    const handleAddAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminName) {
            toast.error('Por favor ingrese el nombre.');
            return;
        }
        addUser({
            name: adminName,
            role: adminRole,
        });
        setAdminName('');
        setAdminPassword('');
        toast.success(`Cuenta de ${adminRole.replace('_', ' ')} creada exitosamente.`);
    };

    const handleResetPassword = (userName: string) => {
        if (window.confirm(`¿Confirmas que deseas resetear la contraseña de ${userName}?`)) {
            toast.success(`Se ha enviado un enlace de recuperación a ${userName}`);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 selection:bg-zinc-900 selection:text-white">
            <Toaster position="top-right" richColors />
            <Header user={user} onLogout={onLogout} />
            
            <main className="page-container py-10">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-zinc-900 text-white rounded-lg">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 font-display">Super Administración</h2>
                    </div>
                    <p className="text-zinc-500 text-sm">Control total del sistema y gestión de privilegios administrativos.</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Admin Users & Student Help */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Admin List */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-zinc-100 rounded-2xl">
                                        <Users className="w-5 h-5 text-zinc-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold tracking-tight">Cuentas Administrativas</h3>
                                        <p className="text-xs text-zinc-500">Usuarios con acceso de gestión, contabilidad y jefaturas</p>
                                    </div>
                                </div>
                                <div className="relative w-64">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar cuenta..." 
                                        value={adminSearch}
                                        onChange={(e) => setAdminSearch(e.target.value)}
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
                                        {filteredAdmins.map((admin) => (
                                            <tr key={admin.id} className="hover:bg-zinc-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                                                            <span className="text-xs font-bold text-zinc-400">{admin.name.charAt(0)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{admin.name}</p>
                                                            {admin.employeeNumber && <p className="text-[10px] text-zinc-400 font-mono">{admin.employeeNumber}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                                                        admin.role === UserRole.ADMIN ? "bg-indigo-50 text-indigo-600" : 
                                                        admin.role === UserRole.DEPT_HEAD ? "bg-emerald-50 text-emerald-600" :
                                                        "bg-zinc-100 text-zinc-600"
                                                    )}>
                                                        {admin.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        className="inline-flex items-center space-x-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors" 
                                                        onClick={() => handleResetPassword(admin.name)}
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

                        {/* Student Help Section */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                            <div className="flex items-center space-x-4 mb-8">
                                <div className="p-3 bg-indigo-50 rounded-2xl">
                                    <HelpCircle className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight">Ayuda a Estudiantes</h3>
                                    <p className="text-xs text-zinc-500">Gestión de recuperación de contraseñas para alumnos</p>
                                </div>
                            </div>

                            <div className="relative mb-6">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar estudiante por nombre o carnet..." 
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                {filteredStudents.map(student => (
                                    <div key={student.id} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-50 hover:border-zinc-200 transition-all group">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{student.name}</p>
                                                <p className="text-[10px] font-mono text-zinc-400">{student.carnet || '---'}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleResetPassword(student.name)}
                                            className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all flex items-center space-x-2"
                                        >
                                            <Lock className="w-3 h-3" />
                                            <span>Resetear Clave</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Create Account */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                             <div className="flex items-center space-x-3 mb-8">
                                <div className="p-2 bg-zinc-100 rounded-xl">
                                    <UserPlus className="w-4 h-4 text-zinc-600" />
                                </div>
                                <h3 className="text-lg font-bold tracking-tight">Nueva Cuenta</h3>
                            </div>
                            <form onSubmit={handleAddAdmin} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Tipo de Cuenta</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setAdminRole(UserRole.ADMIN)}
                                            className={cn(
                                                "py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center space-x-2",
                                                adminRole === UserRole.ADMIN ? "bg-zinc-900 border-zinc-900 text-white" : "bg-zinc-50 border-zinc-100 text-zinc-400 hover:bg-zinc-100"
                                            )}
                                        >
                                            <ShieldCheck className="w-3 h-3" />
                                            <span>Admin</span>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setAdminRole(UserRole.ACCOUNTING)}
                                            className={cn(
                                                "py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center space-x-2",
                                                adminRole === UserRole.ACCOUNTING ? "bg-zinc-900 border-zinc-900 text-white" : "bg-zinc-50 border-zinc-100 text-zinc-400 hover:bg-zinc-100"
                                            )}
                                        >
                                            <Briefcase className="w-3 h-3" />
                                            <span>Conta</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={adminName}
                                        onChange={(e) => setAdminName(e.target.value)}
                                        className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Contraseña Temporal</label>
                                    <div className="relative">
                                        <Key className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="password"
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 pl-12 pr-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-zinc-900 text-white font-bold py-4 px-6 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 flex items-center justify-center space-x-3 active:scale-95">
                                    <Plus className="h-4 w-4"/>
                                    <span>Crear Cuenta</span>
                                    <ArrowRight className="w-4 h-4 opacity-50" />
                                </button>
                            </form>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-rose-50 border border-rose-100 text-rose-900">
                            <div className="flex items-center space-x-3 mb-4">
                                <ShieldAlert className="w-5 h-5 text-rose-600" />
                                <h4 className="text-sm font-bold uppercase tracking-widest">Seguridad</h4>
                            </div>
                            <p className="text-xs leading-relaxed opacity-70">
                                Como Super Admin, eres responsable de la integridad de las cuentas. Asegúrate de verificar la identidad antes de resetear claves.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SuperAdminPortal;
