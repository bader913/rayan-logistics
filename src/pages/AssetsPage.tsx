// src/pages/AssetsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  UserCheck,
  ArrowRightLeft,
  Wrench,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '../components/common/Badge.js';
import { AssetModal } from '../components/assets/AssetModal.js';
import { AssignModal } from '../components/assets/AssignModal.js';
import { ReturnModal } from '../components/assets/ReturnModal.js';
import { AssetDetailDrawer } from '../components/assets/AssetDetailDrawer.js';
import { useLanguage } from '../context/LanguageContext.js';
import { api } from '../services/api.js';
import { Asset } from '../types/index.js';

export const AssetsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<any>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [lifecycleStatus, setLifecycleStatus] = useState('');
  const [conditionStatus, setConditionStatus] = useState('');

  // Lookups
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const fetchAssets = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.getAssets({
        search,
        category_id: categoryId,
        location_id: locationId,
        lifecycle_status: lifecycleStatus,
        condition_status: conditionStatus,
        page,
        limit: 20,
      });
      setAssets(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to fetch assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([api.getCategories(), api.getLocations()]).then(([cats, locs]) => {
      setCategories(cats);
      setLocations(locs);
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAssets(1);
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, categoryId, locationId, lifecycleStatus, conditionStatus]);

  const handleExportCsv = () => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (categoryId) query.append('category_id', categoryId);
    if (locationId) query.append('location_id', locationId);
    if (lifecycleStatus) query.append('lifecycle_status', lifecycleStatus);
    if (conditionStatus) query.append('condition_status', conditionStatus);

    window.open(`/api/v1/assets/export/csv?${query.toString()}`, '_blank');
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategoryId('');
    setLocationId('');
    setLifecycleStatus('');
    setConditionStatus('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {t('nav.assets')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            سجل الأصول والمعدات وتتبع الحيازة والحالة الفنية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-assets-csv-btn"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{t('action.exportCsv')}</span>
          </button>
          <button
            id="open-create-asset-btn"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('action.createAsset')}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
            <input
              id="asset-search-input"
              type="text"
              placeholder="بحث برقم الأصل، الوصف، السيريال، أو الماركة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع المواقع</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.location_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={lifecycleStatus}
              onChange={(e) => setLifecycleStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات التشغيلية</option>
              <option value="CURRENTLY_HELD">قيد الاستخدام / بحوزة المنظمة</option>
              <option value="UNDER_MAINTENANCE">قيد الصيانة</option>
              <option value="MISSING">مفقود</option>
              <option value="DISPOSED">تم التخريد / الإتلاف</option>
            </select>
          </div>
        </div>

        {(search || categoryId || locationId || lifecycleStatus || conditionStatus) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">تم تطبيق تصفيات خاصة</span>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط التصفيات</span>
            </button>
          </div>
        )}
      </div>

      {/* Asset Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 text-start">رقم الأصل (ID)</th>
                <th className="px-4 py-3 text-start">الوصف والمواصفات</th>
                <th className="px-4 py-3 text-start">التصنيف</th>
                <th className="px-4 py-3 text-start">الموقع الحالي</th>
                <th className="px-4 py-3 text-start">الموظف الحائز (العهدة)</th>
                <th className="px-4 py-3 text-center">الحالة الفنية</th>
                <th className="px-4 py-3 text-center">الحالة التشغيلية</th>
                <th className="px-4 py-3 text-end">التكلفة ($)</th>
                <th className="px-4 py-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    جاري تحميل سجل الأصول...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    لا توجد أصول مطابقة لمعايير البحث.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {asset.full_asset_number || asset.asset_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{asset.item_description}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {asset.brand_name} {asset.model} {asset.serial_number_1 ? `• S/N: ${asset.serial_number_1}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {asset.category_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {asset.current_location_name || 'مستودع دمشق'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {asset.custodian_name ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-semibold text-slate-900">{asset.custodian_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">في المستودع</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <Badge status={asset.condition_status} type="condition" />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <Badge status={asset.lifecycle_status} type="lifecycle" />
                    </td>
                    <td className="px-4 py-3 text-end font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {asset.invoice_cost_usd ? `$${asset.invoice_cost_usd.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setIsDetailOpen(true);
                          }}
                          title="عرض التفاصيل والسجل الكامل"
                          className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {asset.current_custodian_employee_id ? (
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setIsReturnOpen(true);
                            }}
                            title="استرجاع العهدة للمستودع"
                            className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setIsAssignOpen(true);
                            }}
                            title="تسليم كعهدة لموظف"
                            className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            عرض {assets.length} من إجمالي {pagination.total} أصل
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchAssets(pagination.page - 1)}
              className="px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition font-semibold"
            >
              السابق
            </button>
            <span className="font-bold text-slate-700">
              صفحة {pagination.page} من {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchAssets(pagination.page + 1)}
              className="px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition font-semibold"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssetModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchAssets(pagination.page)}
      />

      <AssignModal
        isOpen={isAssignOpen}
        onClose={() => {
          setIsAssignOpen(false);
          setSelectedAsset(null);
        }}
        asset={selectedAsset}
        onSuccess={() => fetchAssets(pagination.page)}
      />

      <ReturnModal
        isOpen={isReturnOpen}
        onClose={() => {
          setIsReturnOpen(false);
          setSelectedAsset(null);
        }}
        asset={selectedAsset}
        onSuccess={() => fetchAssets(pagination.page)}
      />

      <AssetDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedAsset(null);
        }}
        asset={selectedAsset}
        onAssign={(a) => {
          setIsDetailOpen(false);
          setSelectedAsset(a);
          setIsAssignOpen(true);
        }}
        onReturn={(a) => {
          setIsDetailOpen(false);
          setSelectedAsset(a);
          setIsReturnOpen(true);
        }}
      />
    </div>
  );
};
