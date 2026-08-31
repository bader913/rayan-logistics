// src/pages/AuditLogsPage.tsx
import React, { useState, useEffect } from 'react';
import { History, Search, Shield, Eye, Filter, Calendar } from 'lucide-react';
import { Modal } from '../components/common/Modal.js';
import { useLanguage } from '../context/LanguageContext.js';
import { api } from '../services/api.js';
import { AuditLog } from '../types/index.js';

export const AuditLogsPage: React.FC = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({
        entity_type: entityType,
        action: action,
        limit: 100,
      });
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityType, action]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          {t('nav.audit')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          سجل التدقيق الأمني الشامل والرقابة على العمليات والتعديلات
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-3">
        <div className="w-full sm:w-48">
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع الكيانات (Entities)</option>
            <option value="ASSET">الأصول (ASSET)</option>
            <option value="CUSTODY">العهد (CUSTODY)</option>
            <option value="INVENTORY_AUDIT">الجرد (INVENTORY)</option>
            <option value="MAINTENANCE">الصيانة (MAINTENANCE)</option>
            <option value="EMPLOYEE">الموظفين (EMPLOYEE)</option>
            <option value="SYSTEM">النظام (SYSTEM)</option>
          </select>
        </div>

        <div className="w-full sm:w-48">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع الإجراءات (Actions)</option>
            <option value="CREATE">إنشاء (CREATE)</option>
            <option value="UPDATE">تعديل (UPDATE)</option>
            <option value="ASSIGN">تسليم عهدة (ASSIGN)</option>
            <option value="RETURN">استرجاع عهدة (RETURN)</option>
            <option value="IMPORT">استيراد (IMPORT)</option>
            <option value="SCAN">مسح جرد (SCAN)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 text-start">التاريخ والوقت</th>
                <th className="px-4 py-3 text-start">المستخدم (المسؤول)</th>
                <th className="px-4 py-3 text-start">الكيان</th>
                <th className="px-4 py-3 text-start">نوع الإجراء</th>
                <th className="px-4 py-3 text-start">عنوان / رقم السجل</th>
                <th className="px-4 py-3 text-start">IP Address</th>
                <th className="px-4 py-3 text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    جاري تحميل سجل التدقيق...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    لا توجد سجلات تدقيق مطابقة.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {log.username || 'System'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'CREATE' || log.action === 'ASSIGN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.action === 'UPDATE' || log.action === 'RETURN'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {log.entity_id ? log.entity_id.slice(0, 8) + '...' : '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      <Modal
        id="audit-details-modal"
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="تفاصيل سجل التدقيق وتغيير البيانات"
        maxWidth="lg"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block">المستخدم:</span>
                <span className="font-bold text-slate-800">{selectedLog.username || 'System'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">الكيان والإجراء:</span>
                <span className="font-mono font-bold text-blue-700">
                  {selectedLog.entity_type} / {selectedLog.action}
                </span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">البيانات الجديدة (New Values):</span>
              <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-48">
                {JSON.stringify(selectedLog.new_values || {}, null, 2)}
              </pre>
            </div>

            {selectedLog.old_values && (
              <div>
                <span className="font-bold text-slate-700 block mb-1">البيانات السابقة (Old Values):</span>
                <pre className="p-3 rounded-lg bg-slate-900 text-rose-300 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.old_values || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
