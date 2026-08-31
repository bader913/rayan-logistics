// src/context/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  direction: 'rtl' | 'ltr';
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // App Brand & Navigation
    'app.title': 'ريان للخدمات اللوجستية',
    'app.subtitle': 'منظومة إدارة الأصول والعهد والجرد المؤسسي',
    'nav.dashboard': 'لوحة المؤشرات',
    'nav.assets': 'سجل الأصول',
    'nav.employees': 'الموظفون والعهد',
    'nav.inventory': 'الجرد والتدقيق',
    'nav.maintenance': 'الصيانة والورش',
    'nav.import': 'استيراد إكسل',
    'nav.audit': 'سجل الرقابة',
    'nav.docs': 'التوثيق وتحميل المشروع',

    // Dashboard
    'dash.totalAssets': 'إجمالي الأصول المسجلة',
    'dash.assignedAssets': 'أصول مسلمة كعهدة',
    'dash.inStock': 'أصول في المستودع',
    'dash.underRepair': 'أصول قيد الصيانة',
    'dash.missing': 'أصول مفقودة',
    'dash.activeEmployees': 'الموظفون النشطون',
    'dash.totalValuation': 'القيمة التقديرية الإجمالية',
    'dash.recentMovements': 'أحدث حركات الأصول والعهد',
    'dash.byCategory': 'توزيع الأصول حسب التصنيف',
    'dash.byCondition': 'حالة الأصول الفنية',
    'dash.byLocation': 'توزيع الأصول حسب المواقع',

    // Common Actions
    'action.createAsset': 'إضافة أصل جديد',
    'action.assign': 'تسليم عهدة',
    'action.return': 'استرجاع للمستودع',
    'action.transfer': 'نقل موقع',
    'action.search': 'بحث بالرقم أو الوصف أو السيريال...',
    'action.filter': 'تصفية',
    'action.exportCsv': 'تصدير CSV',
    'action.save': 'حفظ التعديلات',
    'action.cancel': 'إلغاء',
    'action.confirm': 'تأكيد العملية',
    'action.login': 'تسجيل الدخول',
    'action.logout': 'تسجيل الخروج',
    'action.downloadZip': 'تحميل حزمة المشروع الكاملة (.ZIP)',

    // Statuses
    'status.CURRENTLY_HELD': 'بحوزة موظف / قيد الاستخدام',
    'status.UNDER_MAINTENANCE': 'قيد الصيانة',
    'status.LOST': 'مفقود',
    'status.STOLEN': 'مسروق',
    'status.DAMAGED': 'تالف',
    'status.MISSING': 'غير موجود بالجرد',
    'status.PENDING_DISPOSAL': 'بانتظار الإتلاف',
    'status.DISPOSED': 'تم التخريد / الإتلاف',

    'condition.NEW': 'جديد',
    'condition.GOOD': 'جيد جداً',
    'condition.OK': 'مقبول / يعمل',
    'condition.FAIR': 'وسط',
    'condition.POOR': 'ضعيف',
    'condition.NEEDS_REPAIR': 'بحاجة صيانة',
    'condition.DAMAGED': 'معطل / تالف',

    // Asset Fields
    'field.assetNumber': 'رقم الأصل',
    'field.description': 'وصف الأصل',
    'field.category': 'التصنيف',
    'field.brand': 'الماركة / الصانع',
    'field.model': 'الموديل',
    'field.serial': 'الرقم التسلسلي S/N',
    'field.location': 'الموقع الحالي',
    'field.custodian': 'الموظف المستلم (العهدة)',
    'field.condition': 'الحالة الفنية',
    'field.lifecycle': 'الحالة التشغيلية',
    'field.costUsd': 'التكلفة بالدولار',
    'field.donor': 'الجهة المانحة',
    'field.notes': 'ملاحظات',
  },
  en: {
    'app.title': 'Rayan Logistics',
    'app.subtitle': 'Enterprise Asset, Custody & Inventory Management System',
    'nav.dashboard': 'Dashboard',
    'nav.assets': 'Asset Registry',
    'nav.employees': 'Employees & Custody',
    'nav.inventory': 'Inventory Audit',
    'nav.maintenance': 'Maintenance',
    'nav.import': 'Excel Import',
    'nav.audit': 'Audit Trail',
    'nav.docs': 'Docs & ZIP Download',

    'dash.totalAssets': 'Total Registered Assets',
    'dash.assignedAssets': 'Assigned Custodies',
    'dash.inStock': 'In Stock / Warehouse',
    'dash.underRepair': 'Under Maintenance',
    'dash.missing': 'Missing Assets',
    'dash.activeEmployees': 'Active Employees',
    'dash.totalValuation': 'Total Valuation (USD)',
    'dash.recentMovements': 'Recent Asset Movements',
    'dash.byCategory': 'Assets by Category',
    'dash.byCondition': 'Asset Technical Condition',
    'dash.byLocation': 'Assets by Location',

    'action.createAsset': 'New Asset',
    'action.assign': 'Assign Custody',
    'action.return': 'Return to Stock',
    'action.transfer': 'Transfer Location',
    'action.search': 'Search by number, description, serial...',
    'action.filter': 'Filter',
    'action.exportCsv': 'Export CSV',
    'action.save': 'Save Changes',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm Action',
    'action.login': 'Sign In',
    'action.logout': 'Sign Out',
    'action.downloadZip': 'Download Project ZIP (.zip)',

    'status.CURRENTLY_HELD': 'Currently Held / In Use',
    'status.UNDER_MAINTENANCE': 'Under Maintenance',
    'status.LOST': 'Lost',
    'status.STOLEN': 'Stolen',
    'status.DAMAGED': 'Damaged',
    'status.MISSING': 'Missing from Audit',
    'status.PENDING_DISPOSAL': 'Pending Disposal',
    'status.DISPOSED': 'Disposed / Scrapped',

    'condition.NEW': 'New',
    'condition.GOOD': 'Good',
    'condition.OK': 'OK / Operational',
    'condition.FAIR': 'Fair',
    'condition.POOR': 'Poor',
    'condition.NEEDS_REPAIR': 'Needs Repair',
    'condition.DAMAGED': 'Damaged',

    'field.assetNumber': 'Asset Number',
    'field.description': 'Item Description',
    'field.category': 'Category',
    'field.brand': 'Brand',
    'field.model': 'Model',
    'field.serial': 'Serial Number S/N',
    'field.location': 'Current Location',
    'field.custodian': 'Custodian Employee',
    'field.condition': 'Condition',
    'field.lifecycle': 'Lifecycle Status',
    'field.costUsd': 'Cost (USD)',
    'field.donor': 'Donor',
    'field.notes': 'Notes',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('rayan_lang') as Language) || 'ar';
  });

  const direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    localStorage.setItem('rayan_lang', language);
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, defaultText?: string): string => {
    return translations[language]?.[key] || defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      <div dir={direction} className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
