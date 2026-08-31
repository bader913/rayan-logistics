// src/pages/ImportPage.tsx
import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { api } from '../services/api.js';
import { ImportPreviewResult, ImportPreviewRow } from '../../server/services/excel-import.service.js';

export const ImportPage: React.FC = () => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<any | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    setLoading(true);
    setCommitResult(null);
    try {
      const data = await api.previewImport(file);
      setPreview(data);
    } catch (err: any) {
      alert(err.message || 'Failed to parse Excel file');
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleCommit = async () => {
    if (!selectedFile) return;
    setCommitting(true);
    try {
      const res = await api.commitImport(selectedFile);
      setCommitResult(res);
      setPreview(null);
    } catch (err: any) {
      alert(err.message || 'Import commit failed');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          {t('nav.import')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          محرك استيراد وتدقيق ومعالجة ملفات Excel الذكي لبيانات الأصول والموظفين
        </p>
      </div>

      {/* Upload Dropzone */}
      {!preview && !commitResult && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
            dragOver
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            اسحب وأفلت ملف إكسل هنا، أو انقر للاختيار
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            يدعم ملفات (.xlsx / .xls) التي تحتوي على أوراق Assets و Employees
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>معاينة حية ومطابقة ذكية قبل الحفظ في قاعدة البيانات</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">جاري فحص وتدقيق أوراق وسجلات الملف...</p>
        </div>
      )}

      {/* Success Commitment Report */}
      {commitResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">تم استيراد وحفظ الدفعة بنجاح!</h3>
          <div className="max-w-md mx-auto grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 font-bold">
              <span>تم بنجاح</span>
              <p className="text-xl font-mono mt-1">{commitResult.successful}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 font-bold">
              <span>تنبيهات وملاحظات</span>
              <p className="text-xl font-mono mt-1">{commitResult.warnings}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 font-bold">
              <span>سجلات مستبعدة</span>
              <p className="text-xl font-mono mt-1">{commitResult.failed}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setCommitResult(null);
              setSelectedFile(null);
            }}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
          >
            استيراد ملف آخر
          </button>
        </div>
      )}

      {/* Preview Table */}
      {preview && (
        <div className="space-y-4">
          {/* Summary KPI Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{preview.fileName}</h4>
                <p className="text-xs text-slate-500">
                  إجمالي السجلات: <span className="font-mono font-bold text-slate-800">{preview.totalRows}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                ✓ {preview.validRows} صالح
              </span>
              <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                ⚠ {preview.warningRows} بحاجة مراجعة
              </span>
              <span className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                ✕ {preview.invalidRows} غير صالح
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                إلغاء
              </button>
              <button
                id="commit-import-btn"
                onClick={handleCommit}
                disabled={committing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                <span>{committing ? 'جاري الاستيراد والتسجيل...' : 'اعتماد وحفظ السجلات'}</span>
              </button>
            </div>
          </div>

          {/* Rows Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-start">السطر</th>
                    <th className="px-3 py-2 text-start">رقم الأصل</th>
                    <th className="px-3 py-2 text-start">الوصف</th>
                    <th className="px-3 py-2 text-start">الموظف المقترن</th>
                    <th className="px-3 py-2 text-start">التصنيف</th>
                    <th className="px-3 py-2 text-start">الحالة</th>
                    <th className="px-3 py-2 text-start">الملاحظات والتنبيهات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.rows.map((row: ImportPreviewRow) => (
                    <tr
                      key={row.rowNumber}
                      className={`hover:bg-slate-50/80 transition ${
                        row.status === 'INVALID'
                          ? 'bg-rose-50/40'
                          : row.status === 'WARNING'
                          ? 'bg-amber-50/30'
                          : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-slate-400">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {row.fullAssetNumber}
                      </td>
                      <td className="px-3 py-2 text-slate-800">{row.description}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {row.matchedEmployeeName ? (
                          <span className="font-semibold text-emerald-700">
                            {row.matchedEmployeeName}
                          </span>
                        ) : row.employeeNumber ? (
                          <span className="text-amber-600">{row.employeeNumber} (غير مسجل)</span>
                        ) : (
                          <span className="text-slate-400">في المستودع</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                        {row.categoryCode || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'VALID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : row.status === 'WARNING'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {row.issues.map((iss, idx) => (
                          <span
                            key={idx}
                            className={`block text-[11px] ${
                              iss.type === 'ERROR'
                                ? 'text-rose-600 font-semibold'
                                : 'text-amber-700'
                            }`}
                          >
                            • {iss.message}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
