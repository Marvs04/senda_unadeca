import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Coins, Zap, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { getBillingCycle } from '../../lib/business';

interface Stats {
  totalHours: number;
  grossAmount: number;
  tithe: number;
  netAmount: number;
}

interface StudentFinancialsProps {
  stats: Stats;
}

const StudentFinancials: React.FC<StudentFinancialsProps> = ({ stats }) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-xl shadow-zinc-200/40 relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="p-3 bg-emerald-50 w-fit rounded-2xl mb-6">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
            Total Neto
          </p>
          <p className="text-3xl font-black font-display text-zinc-900 leading-none">
            {formatCurrency(stats.netAmount)}
          </p>
          <div className="mt-4 flex items-center space-x-1 text-[10px] font-bold text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>{stats.totalHours.toFixed(1)}h acumuladas</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-xl shadow-zinc-200/40 relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
          <div className="p-3 bg-amber-50 w-fit rounded-2xl mb-6">
            <Coins className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
            Diezmo (10%)
          </p>
          <p className="text-3xl font-black font-display text-amber-600 leading-none">
            {formatCurrency(stats.tithe)}
          </p>
          <p className="mt-4 text-[10px] font-bold text-zinc-400 italic">
            "Mis manos dan, Dios multiplica"
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="p-8 rounded-[3rem] bg-zinc-900 text-white relative overflow-hidden group min-h-[160px] flex items-center">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-start space-x-6">
            <div className="p-4 bg-white/10 rounded-2xl">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-2">Próximo Corte</h4>
              <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                Tu próximo pago se procesará el{' '}
                <span className="text-white font-bold">
                  25 de {getBillingCycle().label.split(' ')[0]}
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentFinancials;
