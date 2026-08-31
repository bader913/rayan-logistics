// src/pages/InventoryPage.tsx
import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Scan,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Check,
  X,
  RotateCw,
} from 'lucide-react';
import { Modal } from '../components/common/Modal.js';
import { Badge } from '../components/common/Badge.js';
import { useLanguage } from '../context/LanguageContext.js';
import { api } from '../services/api.js';
import { InventorySession, InventoryItem } from '../types/index.js';

export const InventoryPage: React.FC = () => {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Start Session Modal
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locations, setLocations] = useState<any[]>([]);

  // Scanning state
  const [scanCode, setScanCode] = useState('');
  const [scanCondition, setScanCondition] = useState('GOOD');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await api.getInventorySessions();
      setSessions(data);
      if (data.length > 0 && !activeSession) {
        loadSessionDetails(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (id: string) => {
    try {
      const det = await api.getInventorySessionById(id);
      setActiveSession(det);
    } catch (err) {
      console.error('Failed to load session', err);
    }
  };

  useEffect(() => {
    fetchSessions();
    api.getLocations().then(setLocations);
  }, []);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createInventorySession({
        session_name: sessionName,
        location_id: locationId || undefined,
      });
      setIsStartOpen(false);
      setSessionName('');
      setLocationId('');
      await fetchSessions();
      loadSessionDetails(res.session_id);
    } catch (err: any) {
      alert(err.message || 'Failed to start inventory audit');
    }
  };

  const handleScanItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCode.trim() || !activeSession) return;

    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await api.scanInventoryItem(activeSession.session.id, {
        scanned_asset_number: scanCode.trim(),
        condition_status: scanCondition,
      });
      setScanResult(res);
      setScanCode('');
      loadSessionDetails(activeSession.session.id);
    } catch (err: any) {
      alert(err.message || 'Scan error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCompleteAudit = async () => {
    if (!activeSession) return;
    if (!window.confirm('هل أنت متأكد من إنهاء جلسة الجرد واعتماد النتائج؟ سيتم اعتبار كافة الأصول غير الممسوحة مفقودة (Missing).')) {
      return;
    }

    try {
      await api.completeInventorySession(activeSession.session.id);
      await fetchSessions();
      loadSessionDetails(activeSession.session.id);
    } catch (err: any) {
      alert(err.message || 'Failed to complete session');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {t('nav.inventory')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            غرفة عمليات الجرد الميداني والمطابقة ومسح الباركود والفروقات
          </p>
        </div>

        <button
          id="open-start-inventory-btn"
          onClick={() => setIsStartOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>بدء جلسة جرد جديدة</span>
        </button>
      </div>

      {/* Main Grid: Sessions List on Left, Active Scanner & Reconciliation on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            جلسات الجرد السابقة والنشطة
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {sessions.map((s) => {
              const isActive = activeSession?.session?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => loadSessionDetails(s.id)}
                  className={`w-full text-start p-3 rounded-xl border transition ${
                    isActive
                      ? 'bg-blue-50 border-blue-200 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{s.session_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'IN_PROGRESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{s.location_name || 'كافة المواقع'}</span>
                    <span className="font-mono">{new Date(s.started_at).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Audit Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {activeSession ? (
            <>
              {/* Active Session Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                        {activeSession.session.session_number}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {activeSession.session.session_name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      الموقع: {activeSession.session.location_name || 'عام'} • بواسطة:{' '}
                      {activeSession.session.created_by_username || 'Admin'}
                    </p>
                  </div>

                  {activeSession.session.status === 'IN_PROGRESS' && (
                    <button
                      onClick={handleCompleteAudit}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>إنهاء الجرد واعتماد المطابقة</span>
                    </button>
                  )}
                </div>

                {/* Live Fast Barcode Scanner Form */}
                {activeSession.session.status === 'IN_PROGRESS' && (
                  <form onSubmit={handleScanItem} className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                    <div className="flex items-center gap-2">
                      <Scan className="w-5 h-5 text-blue-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                        ماسح الباركود السريع (Live Asset Scanner)
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        id="barcode-scanner-input"
                        type="text"
                        required
                        placeholder="امسح الباركود أو أدخل رقم الأصل (مثال: SYR/DAM/001)..."
                        value={scanCode}
                        onChange={(e) => setScanCode(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-slate-800 text-white text-sm rounded-lg border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                        autoFocus
                      />

                      <select
                        value={scanCondition}
                        onChange={(e) => setScanCondition(e.target.value)}
                        className="px-3 py-2 bg-slate-800 text-white text-xs rounded-lg border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="GOOD">حالة جيدة (Good)</option>
                        <option value="OK">مقبول ويعمل (OK)</option>
                        <option value="NEEDS_REPAIR">بحاجة صيانة (Needs Repair)</option>
                        <option value="DAMAGED">تالف (Damaged)</option>
                      </select>

                      <button
                        type="submit"
                        disabled={isScanning || !scanCode.trim()}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                      >
                        {isScanning ? 'جاري المسح...' : 'تسجيل المسح'}
                      </button>
                    </div>

                    {scanResult && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>
                            تم توثيق الأصل: {scanResult.asset?.full_asset_number || scanResult.asset?.item_description} ({scanResult.result_status})
                          </span>
                        </div>
                      </div>
                    )}
                  </form>
                )}

                {/* Audit Reconciliation List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    تقرير المطابقة وسجل الفحص الميداني ({activeSession.items?.length || 0})
                  </h4>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {activeSession.items?.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        لم يتم مسح أية أصول في هذه الجلسة بعد.
                      </div>
                    ) : (
                      activeSession.items.map((item: InventoryItem) => (
                        <div
                          key={item.id}
                          className="p-3.5 bg-white hover:bg-slate-50 transition flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">
                                {item.full_asset_number || item.scanned_asset_number}
                              </span>
                              <Badge status={item.result_status} type="inventory" />
                            </div>
                            <p className="text-slate-700 mt-1">{item.item_description || 'أصل غير مسجل مسبقاً'}</p>
                            <p className="text-[11px] text-slate-400">
                              الموقع الفعلي: {item.actual_location_name || 'غير محدد'} • الحائز:{' '}
                              {item.actual_custodian_name || 'في المستودع'}
                            </p>
                          </div>

                          <div className="text-right">
                            <Badge status={item.condition_status} type="condition" />
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString() : 'بانتظار المسح'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              اختر أو أنشئ جلسة جرد لبدء العمل.
            </div>
          )}
        </div>
      </div>

      {/* Start Session Modal */}
      <Modal
        id="start-inventory-session-modal"
        isOpen={isStartOpen}
        onClose={() => setIsStartOpen(false)}
        title="بدء دورة جرد ميداني جديدة"
        maxWidth="md"
      >
        <form onSubmit={handleStartSession} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم جلسة الجرد *</label>
            <input
              type="text"
              required
              placeholder="مثال: جرد مستودع دمشق الربع الأول 2024"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">الموقع المستهدف للجرد</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- كافة المواقع --</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.location_name} ({l.location_code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStartOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
            >
              بدء الجرد الفعلي
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
