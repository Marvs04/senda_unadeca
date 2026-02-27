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
          ? "bg-zinc-900 border-white/10 text-white shadow-2xl shadow-black/20" 
          : "bg-white border-zinc-100 text-zinc-900 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-2.5 rounded-2xl",
          isDark ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-600"
        )}>
          {icon}
        </div>
      </div>
      <div>
        <p className={cn(
          "text-[10px] uppercase tracking-widest font-bold mb-1",
          isDark ? "text-white/50" : "text-zinc-400"
        )}>
          {title}
        </p>
        <p className="text-3xl font-bold tracking-tight font-display">{value}</p>
      </div>
    </motion.div>
  );
};

export default DashboardCard;
