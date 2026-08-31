// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  UserCheck,
  Package,
  Wrench,
  AlertTriangle,
  Users,
  DollarSign,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { Badge } from '../components/common/Badge.js';
import { useLanguage } from '../context/LanguageContext.js';
import { api } from '../services/api.js';
import { DashboardStats, AssetMovement } from '../types/index.js';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getStats(), api.getCharts()])
      .then(([s, c]) => {
        setStats(s);
        setCharts(c);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">جاري تحميل المؤشرات والبيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              {language === 'ar' ? 'نظام إدارة الأصول الميدانية' : 'Field Asset Management'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Damascus HQ</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            {t('app.title')}
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            {t('app.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="dash-quick-add-btn"
            onClick={() => onNavigate('assets')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition"
          >
            <span>{t('action.createAsset')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            id="dash-quick-audit-btn"
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/10"
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('nav.inventory')}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-total-assets"
          title={t('dash.totalAssets')}
          value={stats?.totalAssets || 0}
          subtitle="أصول معرفة برقم تسلسلي"
          icon={Box}
          color="blue"
        />
        <StatCard
          id="stat-assigned-custody"
          title={t('dash.assignedAssets')}
          value={stats?.assignedAssets || 0}
          subtitle="مسلمة كعهدة شخصية لموظف"
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          id="stat-in-stock"
          title={t('dash.inStock')}
          value={stats?.inStockAssets || 0}
          subtitle="جاهزة للتسليم في المستودعات"
          icon={Package}
          color="purple"
        />
        <StatCard
          id="stat-total-val"
          title={t('dash.totalValuation')}
          value={`$${(stats?.totalValuationUsd || 0).toLocaleString()}`}
          subtitle="القيمة الشرائية المقدرة بالدولار"
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Secondary Quick Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">أصول قيد الصيانة</span>
            <span className="text-lg font-bold text-amber-700">{stats?.underRepairAssets || 0}</span>
          </div>
          <Wrench className="w-5 h-5 text-amber-500" />
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">أصول مفقودة / عجز</span>
            <span className="text-lg font-bold text-rose-700">{stats?.missingAssets || 0}</span>
          </div>
          <AlertTriangle className="w-5 h-5 text-rose-500" />
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">الموظفون المسجلون</span>
            <span className="text-lg font-bold text-slate-900">{stats?.activeEmployees || 0}</span>
          </div>
          <Users className="w-5 h-5 text-blue-500" />
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">جلسات جرد نشطة</span>
            <span className="text-lg font-bold text-emerald-700">{stats?.activeInventoryAudits || 0}</span>
          </div>
          <ClipboardCheck className="w-5 h-5 text-emerald-500" />
        </div>
      </div>

      {/* Category Breakdown and Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">{t('dash.byCategory')}</h3>
            <span className="text-xs text-slate-400">حسب التصنيف</span>
          </div>
          <div className="space-y-3">
            {(charts?.categoryDistribution || []).map((cat: any, i: number) => {
              const total = stats?.totalAssets || 1;
              const pct = Math.round((cat.value / total) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{cat.label}</span>
                    <span className="font-mono text-slate-500">
                      {cat.value} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Condition Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">{t('dash.byCondition')}</h3>
            <span className="text-xs text-slate-400">الحالة الفنية</span>
          </div>
          <div className="space-y-3">
            {(charts?.conditionDistribution || []).map((cond: any, i: number) => {
              const total = stats?.totalAssets || 1;
              const pct = Math.round((cond.value / total) * 100);
              return (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Badge status={cond.label} type="condition" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {cond.value} أصل
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Movements Feed */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">{t('dash.recentMovements')}</h3>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              عرض الكل
            </button>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {(charts?.recentMovements || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">لا توجد حركات مسجلة مؤخراً.</p>
            ) : (
              (charts?.recentMovements || []).map((m: any) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-mono">
                      {m.full_asset_number}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(m.movement_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-1">{m.item_description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="font-semibold text-blue-700">{m.movement_type}</span>
                    <span>{m.to_employee_name || m.to_location_name || 'Warehouse'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
