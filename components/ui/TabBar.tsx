import React from 'react';
import { cn } from '../../lib/utils';

export interface Tab<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ElementType;
}

interface TabBarProps<T extends string = string> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (id: T) => void;
  className?: string;
}

function TabBar<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabBarProps<T>) {
  return (
    <div
      className={cn(
        'flex items-center space-x-1 bg-zinc-100 p-1 rounded-2xl w-fit',
        className,
      )}
    >
      {tabs.map(tab => {
        const IconComponent = tab.icon;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all',
              isActive
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50',
            )}
          >
            {IconComponent && <IconComponent className="w-4 h-4" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default TabBar;
