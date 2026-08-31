/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LanguageProvider, useLanguage } from './context/LanguageContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar, NavTab } from './components/layout/Sidebar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { AssetsPage } from './pages/AssetsPage.js';
import { EmployeesPage } from './pages/EmployeesPage.js';
import { InventoryPage } from './pages/InventoryPage.js';
import { MaintenancePage } from './pages/MaintenancePage.js';
import { ImportPage } from './pages/ImportPage.js';
import { AuditLogsPage } from './pages/AuditLogsPage.js';
import { SystemDocsPage } from './pages/SystemDocsPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SystemResetPage } from './pages/SystemResetPage.js';
import { FirstRunSetupPage } from './pages/FirstRunSetupPage.js';
import { api } from './services/api.js';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { direction } = useLanguage();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-300 font-semibold">جاري تهيئة منظومة ريان اللوجستية...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800" dir={direction}>
      {/* Sticky Top Navigation */}
      <Navbar />

      {/* App Body: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
            {activeTab === 'assets' && <AssetsPage />}
            {activeTab === 'employees' && <EmployeesPage />}
            {activeTab === 'inventory' && <InventoryPage />}
            {activeTab === 'maintenance' && <MaintenancePage />}
            {activeTab === 'import' && <ImportPage />}
            {activeTab === 'audit' && <AuditLogsPage />}
            {activeTab === 'docs' && <SystemDocsPage />}
            {activeTab === 'settings' && (
              <SystemResetPage
                onComplete={() => {
                  setActiveTab('dashboard');
                  window.location.reload();
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [setupStatus, setSetupStatus] = useState<
    'loading' | 'required' | 'completed' | 'error'
  >('loading');

  useEffect(() => {
    api
      .getSetupStatus()
      .then((status) => {
        setSetupStatus(
          status.setupCompleted
            ? 'completed'
            : 'required'
        );
      })
      .catch(() => {
        setSetupStatus('error');
      });
  }, []);

  if (setupStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-300 font-semibold">
            جاري التحقق من جاهزية النظام...
          </p>
        </div>
      </div>
    );
  }

  if (setupStatus === 'error') {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-100 flex items-center justify-center p-4"
      >
        <div className="max-w-md w-full bg-white rounded-xl border border-rose-200 p-6 text-center">
          <h1 className="text-lg font-black text-slate-900">
            تعذر بدء النظام
          </h1>

          <p className="text-sm text-slate-600 mt-2">
            تعذر التحقق من حالة إعداد النظام.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (setupStatus === 'required') {
    return (
      <FirstRunSetupPage
        onSetupCompleted={() => {
          setSetupStatus('completed');
        }}
      />
    );
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </LanguageProvider>
  );
}
