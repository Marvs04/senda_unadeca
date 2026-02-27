import React from 'react';
import { motion } from 'motion/react';
import { 
  LogOut, 
  ShieldCheck, 
  Lock, 
  Users, 
  GraduationCap, 
  Briefcase,
  Bell
} from 'lucide-react';
import { User, UserRole } from '../types';
import { cn } from '../lib/utils';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const roleConfig = {
  [UserRole.SUPER_ADMIN]: {
    bg: 'bg-zinc-950',
    text: 'Super Admin',
    icon: ShieldCheck,
    accent: 'border-zinc-800',
    theme: 'dark'
  },
  [UserRole.ADMIN]: {
    bg: 'bg-white',
    text: 'Administración',
    icon: Lock,
    accent: 'border-zinc-200',
    theme: 'light'
  },
  [UserRole.DEPT_HEAD]: {
    bg: 'bg-white',
    text: 'Jefatura',
    icon: Users,
    accent: 'border-zinc-200',
    theme: 'light'
  },
  [UserRole.STUDENT]: {
    bg: 'bg-slate-950',
    text: 'Estudiante',
    icon: GraduationCap,
    accent: 'border-white/10',
    theme: 'dark'
  },
  [UserRole.ACCOUNTING]: {
    bg: 'bg-white',
    text: 'Contabilidad',
    icon: Briefcase,
    accent: 'border-zinc-200',
    theme: 'light'
  },
};

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const config = roleConfig[user.role];
  const IconComponent = config.icon;
  const isDark = config.theme === 'dark';

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300",
        config.bg,
        config.accent,
        isDark ? "text-white" : "text-zinc-900"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300",
              isDark ? "bg-white/10 border-white/20" : "bg-zinc-100 border-zinc-200"
            )}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold tracking-tight font-display">UNADECA</h1>
              <p className={cn(
                "text-[10px] uppercase tracking-[0.2em] font-bold opacity-60",
                isDark ? "text-white/70" : "text-zinc-500"
              )}>
                {config.text}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className={cn(
              "p-2 rounded-full transition-colors",
              isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-zinc-100 text-zinc-500"
            )}>
              <Bell className="h-5 w-5" />
            </button>

            <div className={cn(
              "h-8 w-[1px]",
              isDark ? "bg-white/10" : "bg-zinc-200"
            )} />

            <div className="hidden md:flex flex-col items-end">
              <p className="text-sm font-semibold leading-none">{user.name}</p>
              <p className={cn(
                "text-[10px] uppercase tracking-wider font-bold mt-1 opacity-50",
                isDark ? "text-white/70" : "text-zinc-500"
              )}>
                {user.role.replace('_', ' ')}
              </p>
            </div>
            
            <button
              onClick={onLogout}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all active:scale-95 border",
                isDark 
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" 
                  : "bg-zinc-900 hover:bg-zinc-800 border-zinc-900 text-white"
              )}
            >
              <span className="text-xs hidden sm:inline">Salir</span>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
