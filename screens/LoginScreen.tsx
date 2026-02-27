import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  Users, 
  GraduationCap, 
  Briefcase,
  ChevronRight,
  ArrowRight,
  User as UserIcon,
  Key,
  Eye,
  EyeOff,
  Info,
  Beaker,
  TrendingUp
} from 'lucide-react';
import { User, UserRole, Department } from '../types';
import { cn } from '../lib/utils';

interface LoginScreenProps {
  onLogin: (userId: string) => void;
  users: User[];
  departments: Department[];
}

const roleInfo = {
  [UserRole.SUPER_ADMIN]: { title: 'Super Admin', icon: ShieldCheck, color: 'text-zinc-900' },
  [UserRole.ADMIN]: { title: 'Administración', icon: Lock, color: 'text-indigo-600' },
  [UserRole.DEPT_HEAD]: { title: 'Jefe de Depto.', icon: Users, color: 'text-emerald-600' },
  [UserRole.STUDENT]: { title: 'Estudiante', icon: GraduationCap, color: 'text-zinc-900' },
  [UserRole.ACCOUNTING]: { title: 'Contabilidad', icon: Briefcase, color: 'text-zinc-600' },
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, users, departments }) => {
  const [showDemo, setShowDemo] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just show a message or redirect to demo if valid-ish
    if (username && password) {
        // Find a matching user or just show demo
        const found = (users || []).find(u => u.carnet === username || u.employeeNumber === username || (u.name || '').toLowerCase().includes(username.toLowerCase()));
        if (found) {
            onLogin(found.id);
        } else {
            setShowDemo(true);
        }
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-6 selection:bg-zinc-900 selection:text-white">
      <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        
        {/* Left Side: Branding & Info */}
        <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block space-y-12"
        >
            <div className="space-y-6">
                <div className="inline-flex items-center space-x-3 px-4 py-2 bg-zinc-900 text-white rounded-2xl shadow-xl shadow-zinc-900/20">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-widest">Portal Oficial</span>
                </div>
                <h1 className="text-8xl font-black tracking-tighter text-zinc-900 font-display leading-[0.9]">
                    SENDA
                </h1>
                <p className="text-zinc-500 text-xl font-medium max-w-md leading-relaxed">
                    Sistema Estratégico de Normalización y Desarrollo Académico.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="p-8 bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm">
                    <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center mb-6">
                        <Lock className="w-5 h-5 text-zinc-400" />
                    </div>
                    <h4 className="font-bold mb-2">Seguridad</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">Acceso encriptado y validación institucional de credenciales.</p>
                </div>
                <div className="p-8 bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm">
                    <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center mb-6">
                        <TrendingUp className="w-5 h-5 text-zinc-400" />
                    </div>
                    <h4 className="font-bold mb-2">Eficiencia</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">Automatización de procesos administrativos y financieros.</p>
                </div>
            </div>
        </motion.div>

        {/* Right Side: Login Form / Demo Mode */}
        <div className="relative">
            <AnimatePresence mode="wait">
                {!showDemo ? (
                    <motion.div 
                        key="login-form"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white p-12 rounded-[3.5rem] border border-zinc-100 shadow-2xl shadow-zinc-200/50 w-full max-w-md mx-auto"
                    >
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-black tracking-tight mb-2">Iniciar Sesión</h2>
                            <p className="text-sm text-zinc-400 font-medium">Ingresa tus credenciales institucionales</p>
                        </div>

                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Usuario / Carnet</label>
                                <div className="relative">
                                    <UserIcon className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input 
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Ej. 20240101"
                                        className="w-full bg-zinc-50 border-none rounded-[2rem] py-5 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-zinc-900/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Contraseña</label>
                                <div className="relative">
                                    <Key className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-zinc-50 border-none rounded-[2rem] py-5 pl-14 pr-14 text-sm font-bold focus:ring-2 focus:ring-zinc-900/5 transition-all"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-2">
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                    <input type="checkbox" className="w-4 h-4 rounded border-zinc-200 text-zinc-900 focus:ring-zinc-900/10" />
                                    <span className="text-xs text-zinc-400 font-bold group-hover:text-zinc-600 transition-colors">Recordarme</span>
                                </label>
                                <button type="button" className="text-xs text-zinc-900 font-bold hover:underline">¿Olvidaste tu contraseña?</button>
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-zinc-900 text-white font-black py-6 rounded-[2rem] shadow-xl shadow-zinc-900/20 hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center space-x-3"
                            >
                                <span>Entrar al Sistema</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>

                        <div className="mt-12 pt-8 border-t border-zinc-50 flex flex-col items-center space-y-6">
                            <div className="flex items-center space-x-2 text-zinc-300">
                                <Beaker className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Entorno de Desarrollo</span>
                            </div>
                            <button 
                                onClick={() => setShowDemo(true)}
                                className="px-6 py-3 bg-zinc-50 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 hover:text-zinc-900 transition-all flex items-center space-x-2"
                            >
                                <span>Activar Modo Demo</span>
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="demo-grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="w-full max-w-4xl mx-auto"
                    >
                        <div className="flex items-center justify-between mb-10 px-6">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight">Modo Demo</h2>
                                <p className="text-sm text-zinc-400 font-medium">Selecciona un perfil para probar el sistema</p>
                            </div>
                            <button 
                                onClick={() => setShowDemo(false)}
                                className="text-xs font-bold text-zinc-900 hover:underline"
                            >
                                Volver al Login
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(users || []).map((user, idx) => {
                                const info = roleInfo[user.role];
                                const Icon = info.icon;
                                const department = user.departmentId ? (departments || []).find(d => d.id === user.departmentId)?.name : info.title;
                                const isStudent = user.role === UserRole.STUDENT;
                                
                                return (
                                    <motion.button
                                        key={user.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => onLogin(user.id)}
                                        className={cn(
                                            "group p-6 text-left rounded-[2rem] border transition-all duration-300 flex items-center space-x-4",
                                            isStudent 
                                                ? "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800" 
                                                : "bg-white border-zinc-100 text-zinc-900 hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-200/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                            isStudent ? "bg-white/10" : "bg-zinc-50"
                                        )}>
                                            <Icon className={cn("h-5 w-5", isStudent ? "text-white" : info.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold truncate">{user.name}</h3>
                                            <p className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest truncate",
                                                isStudent ? "text-zinc-500" : "text-zinc-400"
                                            )}>
                                                {department}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
      
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-24 flex flex-col items-center space-y-4"
      >
        <div className="h-px w-12 bg-zinc-200" />
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} SENDA &bull; UNADECA
        </p>
      </motion.footer>
    </div>
  );
};

export default LoginScreen;
