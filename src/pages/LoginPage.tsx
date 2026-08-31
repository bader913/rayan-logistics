// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-tr from-slate-900 via-blue-950 to-indigo-900 p-8 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-blue-300" />
          </div>
          <h1 className="text-xl font-black tracking-tight">
            {language === 'ar' ? 'ريان للخدمات اللوجستية' : 'Rayan Logistics'}
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            {language === 'ar'
              ? 'نظام إدارة الأصول والعهد والجرد والمطابقة'
              : 'Asset, Custody & Inventory Management System'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                اسم المستخدم أو البريد (Username / Email)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
                <input
                  id="login-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full ps-9 pe-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                كلمة المرور (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
                <input
                  id="login-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full ps-9 pe-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition disabled:opacity-50"
            >
              <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول للنظام'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              حسابات تجريبية سريعة (Demo Quick Login)
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Admin@123456')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 font-semibold transition text-start"
              >
                <span className="block font-bold text-slate-900">مدير النظام</span>
                <span className="text-[10px] text-slate-400 font-mono">admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('logistics.officer', 'Officer@123456')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 font-semibold transition text-start"
              >
                <span className="block font-bold text-slate-900">مسؤول لوجستيات</span>
                <span className="text-[10px] text-slate-400 font-mono">logistics.officer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
