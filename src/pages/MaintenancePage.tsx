// src/pages/MaintenancePage.tsx
import React, { useState, useEffect } from 'react';
import { Wrench, Plus, CheckCircle2, Clock, AlertTriangle, FileText, Search } from 'lucide-react';
import { Modal } from '../components/common/Modal.js';
import { Badge } from '../components/common/Badge.js';
import { useLanguage } from '../context/LanguageContext.js';
import { api } from '../services/api.js';
import { MaintenanceRequest } from '../types/index.js';

export const MaintenancePage: React.FC = () => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Ticket Modal
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    asset_id: '',
    issue_description: '',
    priority: 'MEDIUM',
    sent_to: '',
    estimated_cost: '',
  });

  // Update Status Modal
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceRequest | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'SENT_TO_VENDOR' | 'RESOLVED' | 'CANCELLED' | 'CANNOT_BE_REPAIRED'>('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actualCost, setActualCost] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getMaintenanceRequests();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    api.getAssets({ limit: 100 }).then((res) => setAssets(res.data));
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMaintenanceRequest({
        ...newTicket,
        estimated_cost: newTicket.estimated_cost ? parseFloat(newTicket.estimated_cost) : null,
      });
      setIsNewOpen(false);
      setNewTicket({ asset_id: '', issue_description: '', priority: 'MEDIUM', sent_to: '', estimated_cost: '' });
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to create maintenance ticket');
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      await api.updateMaintenanceRequest(selectedTicket.id, {
        status: updateStatus,
        resolution_notes: resolutionNotes || undefined,
        actual_cost: actualCost ? parseFloat(actualCost) : undefined,
      });
      setSelectedTicket(null);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {t('nav.maintenance')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة تذاكر الصيانة والورش والإصلاح الفني وتتبع التكاليف
          </p>
        </div>

        <button
          id="open-create-maintenance-btn"
          onClick={() => setIsNewOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>فتح تذكرة صيانة جديدة</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">جاري تحميل تذاكر الصيانة...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">لا توجد تذاكر صيانة حالية.</div>
          ) : (
            requests.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{ticket.request_number}</span>
                    <Badge status={ticket.priority} type="priority" />
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ticket.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ticket.status === 'IN_PROGRESS' || ticket.status === 'OPEN'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <p className="font-bold text-slate-800 text-sm">
                    {ticket.full_asset_number} • {ticket.item_description}
                  </p>
                  <p className="text-slate-600">{ticket.issue_description}</p>
                  {ticket.resolution_notes && (
                    <p className="text-emerald-700 font-medium bg-emerald-50/50 p-2 rounded border border-emerald-100 mt-1">
                      تقرير الإصلاح: {ticket.resolution_notes}
                    </p>
                  )}
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                  <div className="text-end">
                    <span className="text-[10px] text-slate-400 block">
                      بتاريخ: {new Date(ticket.opened_at).toLocaleDateString()}
                    </span>
                    {ticket.actual_cost !== null && (
                      <span className="font-mono text-emerald-700 font-bold text-xs">
                        التكلفة الفعلية: ${ticket.actual_cost}
                      </span>
                    )}
                  </div>

                  {ticket.status !== 'RESOLVED' && ticket.status !== 'CANCELLED' && (
                    <button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setUpdateStatus('RESOLVED');
                        setResolutionNotes('');
                        setActualCost(String(ticket.estimated_cost || ''));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition border border-blue-200"
                    >
                      تحديث الحالة / إنهاء
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      <Modal
        id="create-maintenance-modal"
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        title="فتح طلب صيانة / إصلاح أصل"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">اختر الأصل المتعطل *</label>
            <select
              required
              value={newTicket.asset_id}
              onChange={(e) => setNewTicket({ ...newTicket, asset_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- اختر الأصل --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_asset_number || a.asset_number} - {a.item_description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">وصف العطل أو المشكلة الفنية *</label>
            <textarea
              required
              rows={3}
              placeholder="مثال: الشاشة مكسورة، الجهاز لا يعمل، بطارية تالفة..."
              value={newTicket.issue_description}
              onChange={(e) => setNewTicket({ ...newTicket, issue_description: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">درجة الأهمية</label>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">منخفضة (Low)</option>
                <option value="MEDIUM">متوسطة (Medium)</option>
                <option value="HIGH">عالية (High)</option>
                <option value="CRITICAL">حرجة / طارئة (Critical)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">جهة الصيانة / الورشة</label>
              <input
                type="text"
                placeholder="مثال: ورشة دمشق التقنية"
                value={newTicket.sent_to}
                onChange={(e) => setNewTicket({ ...newTicket, sent_to: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">التكلفة التقديرية ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newTicket.estimated_cost}
                onChange={(e) => setNewTicket({ ...newTicket, estimated_cost: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
            >
              فتح التذكرة
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Ticket Modal */}
      <Modal
        id="update-maintenance-modal"
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`تحديث تذكرة الصيانة: ${selectedTicket?.request_number || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">تحديث الحالة</label>
            <select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="IN_PROGRESS">قيد العمل والفحص (In Progress)</option>
              <option value="SENT_TO_VENDOR">تم الإرسال لورشة خارجية (Sent to Vendor)</option>
              <option value="RESOLVED">تم الإصلاح بنجاح (Resolved & Ready)</option>
              <option value="CANNOT_BE_REPAIRED">غير قابل للإصلاح - مقترح تخريد (Cannot Repair)</option>
              <option value="CANCELLED">إلغاء الطلب (Cancelled)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">التكلفة الفعلية للإصلاح ($)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">تقرير الصيانة وقطع الغيار المستبدلة</label>
            <textarea
              rows={3}
              placeholder="تفاصيل ما تم تنفيذه في الصيانة..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedTicket(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs"
            >
              حفظ التحديث
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
