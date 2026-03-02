import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'light' | 'dark';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, variant = 'light' }) => {
  const isDark = variant === 'dark';

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={cn(
        "p-6 rounded-3xl transition-all duration-300 border",
        isDark 
          ? "bg-dark-hover border-border-dark text-primary-fg shadow-2xl shadow-dark/20" 
          : "bg-card border-border-faint text-foreground shadow-sm hover:shadow-xl hover:shadow-border/50"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-2.5 rounded-2xl",
          isDark ? "bg-white/10 text-primary-fg" : "bg-surface text-muted"
        )}>
          {icon}
        </div>
      </div>
      <div>
        <p className={cn(
          "text-[10px] uppercase tracking-widest font-bold mb-1",
          isDark ? "text-white/50" : "text-faint"
        )}>
          {title}
        </p>
        <p className="text-3xl font-bold tracking-tight font-display">{value}</p>
      </div>
    </motion.div>
  );
};

export default DashboardCard;
