import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  Loader2,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api.js';

interface FirstRunSetupPageProps {
  onSetupCompleted: () => void;
}

type SetupStep =
  | 'welcome'
  | 'database'
  | 'administrator'
  | 'installing'
  | 'completed';

const initialDatabase = {
  host: 'localhost',
  port: 5432,
  database: 'rayan_logistics',
  user: 'postgres',
  password: '',
  ssl: false,
};

const initialAdministrator = {
  username: 'admin',
  email: '',
  password: '',
  confirmPassword: '',
};

export const FirstRunSetupPage: React.FC<
  FirstRunSetupPageProps
> = ({ onSetupCompleted }) => {
  const [step, setStep] =
    useState<SetupStep>('welcome');

  const [database, setDatabase] =
    useState(initialDatabase);

  const [administrator, setAdministrator] =
    useState(initialAdministrator);

  const [testingConnection, setTestingConnection] =
    useState(false);

  const [connectionVerified, setConnectionVerified] =
    useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionVerified(false);
    setMessage('');
    setError('');

    try {
      const result =
        await api.testSetupConnection(database);

      setConnectionVerified(true);
      setMessage(result.message);
    } catch (connectionError: any) {
      setError(
        connectionError?.message ||
          'تعذر الاتصال بقاعدة البيانات.'
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const install = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();
    setError('');

    if (
      administrator.password !==
      administrator.confirmPassword
    ) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setStep('installing');

    try {
      await api.installSystem({
        database,
        administrator,
      });

      setStep('completed');
    } catch (installationError: any) {
      setError(
        installationError?.message ||
          'تعذر إكمال إعداد النظام.'
      );

      setStep('administrator');
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-100 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 px-6 py-7 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-300/20 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-blue-300" />
            </div>

            <div>
              <h1 className="text-xl font-black">
                إعداد Rayan Logistics
              </h1>

              <p className="text-sm text-blue-200 mt-1">
                سنساعدك في تجهيز النظام خلال دقائق
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5">
          <div className="grid grid-cols-3 gap-2">
            {[
              ['database', 'قاعدة البيانات'],
              ['administrator', 'المدير العام'],
              ['completed', 'الانتهاء'],
            ].map(([itemStep, label], index) => {
              const order = {
                welcome: 0,
                database: 1,
                administrator: 2,
                installing: 2,
                completed: 3,
              };

              const active =
                order[step] >= index + 1;

              return (
                <div
                  key={itemStep}
                  className="space-y-2"
                >
                  <div
                    className={`h-1.5 rounded-full ${
                      active
                        ? 'bg-blue-600'
                        : 'bg-slate-200'
                    }`}
                  />

                  <p
                    className={`text-center text-xs font-bold ${
                      active
                        ? 'text-blue-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
              {message}
            </div>
          )}

          {step === 'welcome' && (
            <div className="space-y-6 text-center">
              <Server className="w-14 h-14 text-blue-600 mx-auto" />

              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  مرحبًا بك
                </h2>

                <p className="text-slate-600 mt-3 leading-7">
                  سيقوم المعالج بتجهيز قاعدة البيانات
                  وإنشاء حساب المدير العام تلقائيًا.
                  لن تحتاج إلى تنفيذ أوامر تقنية.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep('database')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <span>بدء الإعداد</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 'database' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  الاتصال بقاعدة البيانات
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  أدخل المعلومات التي تم تعيينها عند
                  تثبيت PostgreSQL.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="md:col-span-2 text-sm font-bold text-slate-700">
                  عنوان الخادم
                  <input
                    value={database.host}
                    onChange={(event) => {
                      setConnectionVerified(false);
                      setDatabase({
                        ...database,
                        host: event.target.value,
                      });
                    }}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-slate-300 font-normal"
                  />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  المنفذ
                  <input
                    type="number"
                    value={database.port}
                    onChange={(event) => {
                      setConnectionVerified(false);
                      setDatabase({
                        ...database,
                        port: Number(event.target.value),
                      });
                    }}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-slate-300 font-normal"
                  />
                </label>

                <label className="md:col-span-3 text-sm font-bold text-slate-700">
                  اسم قاعدة البيانات
                  <input
                    value={database.database}
                    onChange={(event) => {
                      setConnectionVerified(false);
                      setDatabase({
                        ...database,
                        database: event.target.value,
                      });
                    }}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-slate-300 font-normal"
                  />
                </label>

                <label className="md:col-span-3 text-sm font-bold text-slate-700">
                  اسم مستخدم قاعدة البيانات
                  <input
                    value={database.user}
                    onChange={(event) => {
                      setConnectionVerified(false);
                      setDatabase({
                        ...database,
                        user: event.target.value,
                      });
                    }}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-slate-300 font-normal"
                  />
                </label>

                <label className="md:col-span-3 text-sm font-bold text-slate-700">
                  كلمة مرور قاعدة البيانات
                  <input
                    type="password"
                    value={database.password}
                    onChange={(event) => {
                      setConnectionVerified(false);
                      setDatabase({
                        ...database,
                        password: event.target.value,
                      });
                    }}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-slate-300 font-normal"
                  />
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={
                    testingConnection ||
                    !database.host ||
                    !database.database ||
                    !database.user ||
                    !database.password
                  }
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-bold disabled:opacity-50"
                >
                  {testingConnection ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}

                  <span>اختبار الاتصال</span>
                </button>

                <button
                  type="button"
                  disabled={!connectionVerified}
                  onClick={() => {
                    setMessage('');
                    setStep('administrator');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold disabled:bg-slate-300"
                >
                  <span>التالي</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'administrator' && (
            <form
              onSubmit={install}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  إنشاء المدير العام
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  استخدم هذه المعلومات للدخول إلى النظام
                  بعد انتهاء الإعداد.
                </p>
              </div>

              <label className="block text-sm font-bold text-slate-700">
                اسم المستخدم
                <input
                  required
                  minLength={3}
                  value={administrator.username}
                  onChange={(event) =>
                    setAdministrator({
                      ...administrator,
                      username: event.target.value,
                    })
                  }
                  className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-slate-300 font-normal"
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                البريد الإلكتروني
                <input
                  type="email"
                  required
                  value={administrator.email}
                  onChange={(event) =>
                    setAdministrator({
                      ...administrator,
                      email: event.target.value,
                    })
                  }
                  className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-slate-300 font-normal"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-bold text-slate-700">
                  كلمة المرور
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={administrator.password}
                    onChange={(event) =>
                      setAdministrator({
                        ...administrator,
                        password: event.target.value,
                      })
                    }
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-slate-300 font-normal"
                  />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  تأكيد كلمة المرور
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={
                      administrator.confirmPassword
                    }
                    onChange={(event) =>
                      setAdministrator({
                        ...administrator,
                        confirmPassword:
                          event.target.value,
                      })
                    }
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-slate-300 font-normal"
                  />
                </label>
              </div>

              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('database');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>إنشاء النظام</span>
                </button>
              </div>
            </form>
          )}

          {step === 'installing' && (
            <div className="py-10 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />

              <h2 className="text-xl font-black text-slate-900">
                جاري تجهيز النظام
              </h2>

              <p className="text-sm text-slate-500">
                يرجى عدم إغلاق الصفحة حتى اكتمال العملية.
              </p>
            </div>
          )}

          {step === 'completed' && (
            <div className="py-6 text-center space-y-5">
              <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />

              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  النظام جاهز للاستخدام
                </h2>

                <p className="text-sm text-slate-500 mt-2">
                  تم إنشاء قاعدة البيانات وحساب المدير
                  العام بنجاح.
                </p>
              </div>

              <button
                type="button"
                onClick={onSetupCompleted}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <span>الانتقال إلى تسجيل الدخول</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};