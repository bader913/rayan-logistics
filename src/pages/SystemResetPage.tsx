// src/pages/SystemResetPage.tsx
import React, { useState } from 'react';
import {
  AlertTriangle,
  Database,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface SystemResetPageProps {
  onComplete: () => void;
}

export const SystemResetPage: React.FC<SystemResetPageProps> = ({
  onComplete,
}) => {
  const { user } = useAuth();
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (user?.role_code !== 'ADMIN') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h2 className="font-bold text-slate-900">غير مصرح</h2>
        <p className="text-sm text-slate-500 mt-2">
          هذه الصفحة متاحة لمدير النظام فقط.
        </p>
      </div>
    );
  }

  const isReady =
    confirmation === 'DELETE ALL DATA' &&
    password.length > 0 &&
    !submitting;

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isReady) return;

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const result = await api.resetOperationalData({
        confirmation: 'DELETE ALL DATA',
        password,
      });

      setMessage(
        `تم مسح جميع البيانات التشغيلية بنجاح. تم الحفاظ على حساب المدير: ${result.preservedAdministrator}`
      );

      setConfirmation('');
      setPassword('');

      window.setTimeout(() => {
        onComplete();
      }, 1200);
    } catch (resetError: any) {
      setError(
        resetError?.message ||
          'فشل مسح البيانات. لم يتم حفظ أي حذف جزئي.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">
          إدارة ومسح بيانات النظام
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          تنظيف قاعدة البيانات قبل استيراد بيانات المنظمة الفعلية.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <h3 className="font-bold text-amber-900">
              عملية نهائية لا يمكن التراجع عنها
            </h3>
            <p className="text-sm text-amber-800 mt-1 leading-6">
              ستُحذف الأصول والموظفون والعهد والحركات والجرد والصيانة
              والمواقع والمكاتب والتصنيفات وبيانات الاستيراد.
              سيبقى حساب المدير الحالي والأدوار والجداول وملفات الترحيل.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleReset}
        className="bg-white border border-rose-200 rounded-xl p-6 space-y-5 shadow-sm"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-black text-slate-900">
              مسح جميع البيانات التشغيلية
            </h3>
            <p className="text-xs text-slate-500">
              قاعدة البيانات والجداول لن تُحذف.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            اكتب العبارة التالية حرفيًا:
          </label>

          <code className="block mb-2 px-3 py-2 bg-slate-900 text-rose-300 rounded-lg text-sm text-left">
            DELETE ALL DATA
          </code>

          <input
            type="text"
            value={confirmation}
            onChange={(event) =>
              setConfirmation(event.target.value)
            }
            autoComplete="off"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="DELETE ALL DATA"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            كلمة مرور المدير الحالية
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="أدخل كلمة مرور المدير"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={!isReady}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold transition"
        >
          <Trash2 className="w-5 h-5" />
          <span>
            {submitting
              ? 'جاري مسح البيانات...'
              : 'مسح جميع البيانات التشغيلية'}
          </span>
        </button>
      </form>
    </div>
  );
};
