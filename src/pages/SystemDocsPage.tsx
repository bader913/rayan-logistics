// src/pages/SystemDocsPage.tsx
import React from 'react';
import {
  Download,
  Terminal,
  Database,
  ShieldCheck,
  Server,
  FolderTree,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

export const SystemDocsPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Technical Documentation & Source Delivery
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            {language === 'ar' ? 'توثيق النظام وتسليم الكود المصدري' : 'System Documentation & Source Delivery'}
          </h2>
          <p className="text-xs text-blue-200 max-w-2xl">
            {language === 'ar'
              ? 'مشروع ريان للخدمات اللوجستية (Rayan Logistics) مبني وفق أعلى المعايير الهندسية، مع توفير ملف ZIP كامل وقابل للتشغيل الفوري محلياً.'
              : 'Enterprise-grade Asset, Custody, and Inventory Logistics System.'}
          </p>
        </div>

        <a
          id="docs-download-zip-btn"
          href="/rayan-logistics-initial.zip"
          download="rayan-logistics-initial.zip"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xs font-black shadow-md transition shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{language === 'ar' ? 'تحميل ملف المشروع (ZIP)' : 'Download Source ZIP'}</span>
        </a>
      </div>

      {/* Grid of Docs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Run Guide */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <Terminal className="w-5 h-5 text-blue-600" />
            <span>{language === 'ar' ? 'خطوات التشغيل المحلي (Quickstart)' : 'Local Setup Guide'}</span>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              {language === 'ar'
                ? 'بعد فك ضغط ملف ZIP، قم بتنفيذ الأوامر التالية بالترتيب:'
                : 'After extracting the ZIP archive, run the following commands:'}
            </p>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-2 overflow-x-auto">
              <p className="text-slate-400"># 1. تثبيت الاعتماديات</p>
              <p className="text-emerald-400">npm install</p>

              <p className="text-slate-400 mt-2"># 2. تهيئة ملف البيئة</p>
              <p className="text-emerald-400">cp .env.example .env</p>

              <p className="text-slate-400 mt-2"># 3. تشغيل ملفات الترحيل والتغذية الأولية لقاعدة البيانات</p>
              <p className="text-emerald-400">npm run db:migrate</p>
              <p className="text-emerald-400">npm run db:seed</p>

              <p className="text-slate-400 mt-2"># 4. تشغيل المنظومة محلياً (Backend + Frontend)</p>
              <p className="text-emerald-400">npm run dev</p>

              <p className="text-slate-400 mt-2"># 5. تشغيل الفحوصات الآلية</p>
              <p className="text-emerald-400">npm run test</p>
            </div>
          </div>
        </div>

        {/* Database Architecture */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>{language === 'ar' ? 'هيكلية قاعدة البيانات (18 Migrations)' : 'Database Architecture'}</span>
          </div>

          <p className="text-xs text-slate-600">
            {language === 'ar'
              ? 'تعتمد المنظومة على PostgreSQL مع 18 ملف ترحيل SQL مستقل مع مفاتيح UUID وفهارس أداء:'
              : 'PostgreSQL schema with 18 pure SQL migration files and UUID keys:'}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-800 block">001_roles_permissions</span>
              <span className="text-[10px] text-slate-500">RBAC security matrix</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-800 block">004_assets</span>
              <span className="text-[10px] text-slate-500">Core asset repository</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-800 block">005_asset_assignments</span>
              <span className="text-[10px] text-slate-500">Handover & custody state</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-800 block">007_inventory_audits</span>
              <span className="text-[10px] text-slate-500">Fast physical scanning</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-800 block">009_maintenance</span>
              <span className="text-[10px] text-slate-500">Repair tickets & costs</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-800 block">010_audit_logs</span>
              <span className="text-[10px] text-slate-500">Tamper-evident audit trail</span>
            </div>
          </div>
        </div>

        {/* Monorepo Architecture */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <FolderTree className="w-5 h-5 text-purple-600" />
            <span>{language === 'ar' ? 'هيكل المشروع النظيف (Clean Monorepo)' : 'Project Structure'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-700 space-y-1">
            <p className="font-bold text-blue-700">rayan-logistics/</p>
            <p className="pl-4">├── database/migrations/ <span className="text-slate-400"># 18 Pure SQL files</span></p>
            <p className="pl-4">├── database/seeds/ <span className="text-slate-400"># Initial seed data</span></p>
            <p className="pl-4">├── server/ <span className="text-slate-400"># Express TypeScript REST API</span></p>
            <p className="pl-4">│   ├── routes/ <span className="text-slate-400"># Domain REST routers</span></p>
            <p className="pl-4">│   ├── services/ <span className="text-slate-400"># Assets, Custody, Excel Import</span></p>
            <p className="pl-4">│   └── middleware/ <span className="text-slate-400"># JWT, RBAC, Validation</span></p>
            <p className="pl-4">├── src/ <span className="text-slate-400"># Modern React + Vite Frontend</span></p>
            <p className="pl-4">├── scripts/ <span className="text-slate-400"># CLI migration runner & zip packager</span></p>
            <p className="pl-4">└── package.json <span className="text-slate-400"># Scripts for dev, test, build</span></p>
          </div>
        </div>

        {/* Security & Credentials */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>{language === 'ar' ? 'بيانات الدخول الافتراضية (Seeded Accounts)' : 'Default Test Accounts'}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Super Admin (مدير النظام العام)</span>
                <span className="text-slate-500 block font-mono text-[11px]">username: admin</span>
              </div>
              <span className="font-mono bg-white px-2 py-1 rounded border text-slate-700 font-bold">
                Admin@123456
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Logistics Officer (مسؤول لوجستيات)</span>
                <span className="text-slate-500 block font-mono text-[11px]">username: logistics.officer</span>
              </div>
              <span className="font-mono bg-white px-2 py-1 rounded border text-slate-700 font-bold">
                Officer@123456
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
