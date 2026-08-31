// src/components/layout/Navbar.tsx
import React from 'react';
import { Languages, LogOut, ShieldCheck, Database, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface NavbarProps {
  onDownloadZip?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onDownloadZip }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left / Start Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 via-blue-900 to-indigo-800 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-900">
                {language === 'ar' ? 'ريان للخدمات اللوجستية' : 'Rayan Logistics'}
              </h1>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                SYR-DAM
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {language === 'ar' ? 'منظومة إدارة الأصول والعهد والجرد' : 'Asset & Custody Logistics ERP'}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Download Project ZIP Button */}
          <a
            id="navbar-download-zip-btn"
            href="/rayan-logistics-initial.zip"
            download="rayan-logistics-initial.zip"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            title="Download full project source code as ZIP"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'ar' ? 'تحميل المشروع ZIP' : 'Download ZIP'}</span>
          </a>

          {/* Database indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>PostgreSQL Pool</span>
          </div>

          {/* Language Switcher */}
          <button
            id="navbar-lang-toggle-btn"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Languages className="w-4 h-4 text-slate-500" />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user.employee_name || user.username}
                </p>
                <span className="text-[10px] text-slate-500 uppercase font-medium">{user.role_code}</span>
              </div>
              <button
                id="navbar-logout-btn"
                onClick={logout}
                title={t('action.logout')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
