// src/components/layout/Sidebar.tsx
import React from 'react';
import {
  LayoutDashboard,
  Box,
  Users,
  ClipboardCheck,
  Wrench,
  FileSpreadsheet,
  History,
  FileCode,
  Settings,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

export type NavTab =
  | 'dashboard'
  | 'assets'
  | 'employees'
  | 'inventory'
  | 'maintenance'
  | 'import'
  | 'audit'
  | 'docs'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { t } = useLanguage();

  const navItems: { id: NavTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'assets', label: t('nav.assets'), icon: Box },
    { id: 'employees', label: t('nav.employees'), icon: Users },
    { id: 'inventory', label: t('nav.inventory'), icon: ClipboardCheck },
    { id: 'maintenance', label: t('nav.maintenance'), icon: Wrench },
    { id: 'import', label: t('nav.import'), icon: FileSpreadsheet },
    { id: 'audit', label: t('nav.audit'), icon: History },
    { id: 'docs', label: t('nav.docs'), icon: FileCode },
    { id: 'settings', label: 'إدارة البيانات', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between py-5">
      <div className="px-3 space-y-1">
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          {t('app.title')}
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-5 text-xs text-slate-400">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
          <p className="font-semibold text-slate-700">Rayan Logistics ERP</p>
          <p className="text-[11px] text-slate-500">v1.0.0 (Production Core)</p>
          <p className="text-[11px] text-slate-400">PostgreSQL Schema: 18 Migrations</p>
        </div>
      </div>
    </aside>
  );
};
