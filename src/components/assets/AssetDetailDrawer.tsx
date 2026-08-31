// src/components/assets/AssetDetailDrawer.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Badge } from '../common/Badge.js';
import { Asset, AssetMovement, AssetAssignment } from '../../types/index.js';
import { api } from '../../services/api.js';
import { History, UserCheck, Wrench, Shield, FileText, ArrowRightLeft } from 'lucide-react';

interface AssetDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onAssign?: (asset: Asset) => void;
  onReturn?: (asset: Asset) => void;
}

export const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({
  isOpen,
  onClose,
  asset,
  onAssign,
  onReturn,
}) => {
  const [history, setHistory] = useState<{
    movements: AssetMovement[];
    assignments: AssetAssignment[];
    maintenance: any[];
  }>({ movements: [], assignments: [], maintenance: [] });
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'movements' | 'custody' | 'maintenance'>('info');

  useEffect(() => {
    if (isOpen && asset) {
      setLoading(true);
      api
        .getAssetHistory(asset.id)
        .then((res) => {
          setHistory(res);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, asset]);

  if (!asset) return null;

  return (
    <Modal
      id="asset-detail-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={`تفاصيل الأصل: ${asset.full_asset_number || asset.asset_number}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Header summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
              {asset.normalized_asset_number}
            </span>
            <h4 className="text-base font-bold text-slate-900">{asset.item_description}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {asset.brand_name} {asset.model} {asset.serial_number_1 ? `• S/N: ${asset.serial_number_1}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge status={asset.lifecycle_status} type="lifecycle" />
            <Badge status={asset.condition_status} type="condition" />
          </div>
        </div>

        {/* Action bar for custody */}
        <div className="flex items-center gap-2">
          {asset.current_custodian_employee_id ? (
            <button
              onClick={() => onReturn && onReturn(asset)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>استرجاع العهدة للمستودع</span>
            </button>
          ) : (
            <button
              onClick={() => onAssign && onAssign(asset)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>تسليم كعهدة لموظف</span>
            </button>
          )}
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveSubTab('info')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeSubTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            المعلومات الفنية والمالية
          </button>
          <button
            onClick={() => setActiveSubTab('movements')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeSubTab === 'movements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            سجل الحركات ({history.movements.length})
          </button>
          <button
            onClick={() => setActiveSubTab('custody')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeSubTab === 'custody'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            تاريخ العهد ({history.assignments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('maintenance')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeSubTab === 'maintenance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            طلبات الصيانة ({history.maintenance.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeSubTab === 'info' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block font-medium">التصنيف</span>
              <span className="font-semibold text-slate-800">{asset.category_name || 'غير محدد'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block font-medium">الموقع الحالي</span>
              <span className="font-semibold text-slate-800">{asset.current_location_name || 'غير محدد'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block font-medium">الموظف الحائز (العهدة)</span>
              <span className="font-semibold text-slate-800">
                {asset.custodian_name ? `${asset.custodian_name} (${asset.custodian_number})` : 'في المستودع'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block font-medium">القيمة المقدرة (USD)</span>
              <span className="font-semibold text-emerald-700 font-mono">
                {asset.invoice_cost_usd ? `$${asset.invoice_cost_usd.toLocaleString()}` : '-'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block font-medium">الجهة المانحة</span>
              <span className="font-semibold text-slate-800">{asset.donor_name || 'عام / تمويل ذاتي'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block font-medium">تاريخ الاستلام</span>
              <span className="font-semibold text-slate-800">{asset.date_received || '-'}</span>
            </div>
          </div>
        )}

        {activeSubTab === 'movements' && (
          <div className="space-y-3">
            {history.movements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لا توجد حركات مسجلة لهذا الأصل بعد.</p>
            ) : (
              history.movements.map((m) => (
                <div key={m.id} className="p-3 rounded-lg border border-slate-200 text-xs flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{m.movement_type}</span>
                      {m.reference_number && (
                        <span className="font-mono text-[10px] bg-slate-100 px-1 rounded">{m.reference_number}</span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-1">
                      {m.to_location_name && `إلى موقع: ${m.to_location_name}`}
                      {m.to_employee_name && ` • تسليم لـ: ${m.to_employee_name}`}
                    </p>
                    {m.notes && <p className="text-slate-500 italic mt-0.5">{m.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-400 block text-[10px]">{new Date(m.movement_date).toLocaleDateString()}</span>
                    <span className="text-slate-500 text-[10px]">بواسطة: {m.performed_by_username || 'Admin'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeSubTab === 'custody' && (
          <div className="space-y-3">
            {history.assignments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لم يتم تسليم هذا الأصل كعهدة بعد.</p>
            ) : (
              history.assignments.map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded-lg border text-xs flex items-start justify-between ${
                    a.is_current ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{a.employee_name} ({a.employee_number})</span>
                      {a.is_current ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          عهدة حالية
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                          تم الاسترجاع
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-1">
                      تاريخ الاستلام: {a.assignment_date} {a.returned_at ? `| تاريخ الإرجاع: ${new Date(a.returned_at).toLocaleDateString()}` : ''}
                    </p>
                    {a.assignment_notes && <p className="text-slate-500 italic mt-0.5">{a.assignment_notes}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeSubTab === 'maintenance' && (
          <div className="space-y-3">
            {history.maintenance.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لا توجد طلبات صيانة لهذا الأصل.</p>
            ) : (
              history.maintenance.map((m) => (
                <div key={m.id} className="p-3 rounded-lg border border-slate-200 text-xs flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{m.request_number}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">{m.status}</span>
                    </div>
                    <p className="text-slate-700 mt-1">{m.issue_description}</p>
                    {m.resolution_notes && <p className="text-emerald-700 font-medium mt-1">الحل: {m.resolution_notes}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">{new Date(m.opened_at).toLocaleDateString()}</span>
                    {m.actual_cost && <span className="font-mono text-emerald-700 font-bold">${m.actual_cost}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
