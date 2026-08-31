/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </LanguageProvider>
  );
}
