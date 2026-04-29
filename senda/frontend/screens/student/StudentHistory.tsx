import React from 'react';
import { History, Download, ChevronDown } from 'lucide-react';
import WorkLogTable from '../../components/WorkLogTable';
import { User, WorkLog } from '../../types';
import { TabBar, Button } from '../../components/ui';
import { getBillingCycle, getTrimester } from '../../lib/business';

interface StudentHistoryProps {
  filteredLogs: WorkLog[];
  user: User;
  historyView: 'cycle' | 'trimester';
  setHistoryView: (v: 'cycle' | 'trimester') => void;
  selectedCycle: string;
  setSelectedCycle: (v: string) => void;
  selectedTrimester: number;
  setSelectedTrimester: (v: number) => void;
  selectedYear: number;
  setSelectedYear: (v: number) => void;
  onExport: (type: 'csv' | 'pdf') => void;
}

const StudentHistory: React.FC<StudentHistoryProps> = ({
  filteredLogs,
  user,
  historyView,
  setHistoryView,
  selectedCycle,
  setSelectedCycle,
  selectedTrimester,
  setSelectedTrimester,
  selectedYear,
  setSelectedYear,
  onExport,
}) => {
  return (
    <div className="bg-card rounded-[3rem] border border-border-faint shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-10 py-8 border-b border-border-faint flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary text-primary-fg rounded-2xl shadow-lg">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">Mis Registros</h3>
            <p className="text-xs text-faint font-medium">Historial detallado de tus horas</p>
          </div>
        </div>

        <TabBar
          tabs={[
            { id: 'cycle' as const, label: 'Mes' },
            { id: 'trimester' as const, label: 'Cuatri' },
          ]}
          activeTab={historyView}
          onTabChange={setHistoryView}
        />
      </div>

      {/* Controls + Table */}
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            {historyView === 'cycle' ? (
              <div className="relative">
                <select
                  value={selectedCycle}
                  onChange={e => setSelectedCycle(e.target.value)}
                  className="select-custom pr-10"
                >
                  {Array.from({ length: 6 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const cycle = getBillingCycle(d);
                    return (
                      <option key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <select
                    value={selectedTrimester}
                    onChange={e => setSelectedTrimester(Number(e.target.value))}
                    className="select-custom pr-10"
                  >
                    {[1, 2, 3]
                      .filter(t => {
                        const currentT = getTrimester();
                        if (selectedYear < currentT.year) return true;
                        return t <= currentT.num;
                      })
                      .map(t => (
                        <option key={t} value={t}>
                          {t === 1 ? '1er' : t === 2 ? '2do' : '3er'} Cuatrimestre
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="select-custom pr-10"
                  >
                    {Array.from(
                        { length: getTrimester().year - 2024 + 1 },
                        (_, i) => 2024 + i,
                      ).map(y => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                </div>
              </div>
            )}
          </div>
          {filteredLogs.length > 0 && (
            <Button variant="icon-action" onClick={() => onExport('pdf')} title="Exportar PDF">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-bold text-foreground mb-1">No hay registros disponibles</p>
            <p className="text-xs text-faint">Inicia el cronómetro para registrar tus primeras horas</p>
          </div>
        ) : (
          <WorkLogTable logs={filteredLogs} users={[user]} departments={[]} title="" enableFilters />
        )}
      </div>
    </div>
  );
};

export default StudentHistory;
