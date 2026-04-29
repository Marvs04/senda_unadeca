import React from 'react';
import { motion } from 'motion/react';
import { LogOut, Bell } from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { ROLE_CONFIG } from '../lib/uiConfig';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const config = ROLE_CONFIG[user.role];
  const isDark = config.theme === 'dark';

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300",
        config.bg,
        config.accent,
        isDark ? "text-white" : "text-foreground"
      )}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <img 
              src={`${import.meta.env.BASE_URL}senda_logo_blue.png`}
              alt="SENDA Logo"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <div className="flex flex-col">
              <h1 className="text-base font-bold tracking-tight font-display">SENDA</h1>
              <p className={cn(
                "text-[10px] uppercase tracking-[0.2em] font-bold opacity-60",
                isDark ? "text-white/70" : "text-muted"
              )}>
                {config.text}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className={cn(
              "p-2 rounded-full transition-colors",
              isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-surface text-muted"
            )}>
              <Bell className="h-5 w-5" />
            </button>

            <div className={cn(
              "h-8 w-[1px]",
              isDark ? "bg-white/10" : "bg-border"
            )} />

            <div className="hidden md:flex flex-col items-end">
              <p className="text-sm font-semibold leading-none">{user.name}</p>
              <p className={cn(
                "text-[10px] uppercase tracking-wider font-bold mt-1 opacity-50",
                isDark ? "text-white/70" : "text-muted"
              )}>
                {config.text}
              </p>
            </div>
            
            <button
              onClick={onLogout}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all active:scale-95 border",
                isDark 
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" 
                  : "bg-primary hover:bg-primary-hover border-primary text-primary-fg"
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
