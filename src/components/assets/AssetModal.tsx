// src/components/assets/AssetModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { api } from '../../services/api.js';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_asset_number: '',
    item_description: '',
    asset_type: 'EQUIPMENT',
    category_id: '',
    subcategory_id: '',
    brand_name: '',
    model: '',
    serial_number_1: '',
    serial_number_2: '',
    invoice_cost_usd: '',
    invoice_cost_syp: '',
    donor_id: '',
    current_location_id: '',
    current_custodian_employee_id: '',
    condition_status: 'GOOD',
    lifecycle_status: 'CURRENTLY_HELD',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setError(null);
      Promise.all([
        api.getCategories(),
        api.getLocations(),
        api.getEmployees(),
        api.getDonors(),
      ]).then(([cats, locs, emps, dons]) => {
        setCategories(cats);
        setLocations(locs);
        setEmployees(emps);
        setDonors(dons);
      });

      if (initialData) {
        setFormData({
          full_asset_number: initialData.full_asset_number || initialData.asset_number || '',
          item_description: initialData.item_description || '',
          asset_type: initialData.asset_type || 'EQUIPMENT',
          category_id: initialData.category_id || '',
          subcategory_id: initialData.subcategory_id || '',
          brand_name: initialData.brand_name || '',
          model: initialData.model || '',
          serial_number_1: initialData.serial_number_1 || '',
          serial_number_2: initialData.serial_number_2 || '',
          invoice_cost_usd: initialData.invoice_cost_usd || '',
          invoice_cost_syp: initialData.invoice_cost_syp || '',
          donor_id: initialData.donor_id || '',
          current_location_id: initialData.current_location_id || '',
          current_custodian_employee_id: initialData.current_custodian_employee_id || '',
          condition_status: initialData.condition_status || 'GOOD',
          lifecycle_status: initialData.lifecycle_status || 'CURRENTLY_HELD',
          notes: initialData.notes || '',
        });
      } else {
        setFormData({
          full_asset_number: '',
          item_description: '',
          asset_type: 'EQUIPMENT',
          category_id: '',
          subcategory_id: '',
          brand_name: '',
          model: '',
          serial_number_1: '',
          serial_number_2: '',
          invoice_cost_usd: '',
          invoice_cost_syp: '',
          donor_id: '',
          current_location_id: '',
          current_custodian_employee_id: '',
          condition_status: 'GOOD',
          lifecycle_status: 'CURRENTLY_HELD',
          notes: '',
        });
      }
    }
  }, [isOpen, initialData]);

  const selectedCategory = categories.find((c) => c.id === formData.category_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        ...formData,
        invoice_cost_usd: formData.invoice_cost_usd ? parseFloat(formData.invoice_cost_usd) : null,
        invoice_cost_syp: formData.invoice_cost_syp ? parseFloat(formData.invoice_cost_syp) : null,
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
        donor_id: formData.donor_id || null,
        current_location_id: formData.current_location_id || null,
        current_custodian_employee_id: formData.current_custodian_employee_id || null,
      };

      await api.createAsset(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="asset-form-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'تعديل بيانات الأصل' : 'تسجيل أصل جديد في المنظومة'}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رقم الأصل (Asset Number)
            </label>
            <input
              id="asset-number-input"
              type="text"
              placeholder="SYR/DAM/042"
              value={formData.full_asset_number}
              onChange={(e) => setFormData({ ...formData, full_asset_number: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              وصف الأصل <span className="text-rose-500">*</span>
            </label>
            <input
              id="asset-desc-input"
              type="text"
              required
              placeholder="مثال: Laptop Lenovo ThinkPad T14"
              value={formData.item_description}
              onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف الرئيسي</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- اختر التصنيف --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف الفرعي</label>
            <select
              value={formData.subcategory_id}
              onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
              disabled={!selectedCategory || (selectedCategory.subcategories || []).length === 0}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
            >
              <option value="">-- اختياري --</option>
              {(selectedCategory?.subcategories || []).map((sc: any) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">نوع الأصل</label>
            <select
              value={formData.asset_type}
              onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="EQUIPMENT">معدات وتجهيزات (Equipment)</option>
              <option value="IT_HARDWARE">أجهزة تقنية (IT Hardware)</option>
              <option value="FURNITURE">أثاث ومفروشات (Furniture)</option>
              <option value="VEHICLE">مركبات وآليات (Vehicle)</option>
              <option value="APPLIANCE">أجهزة كهربائية (Appliance)</option>
              <option value="OTHER">أخرى (Other)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الماركة / الشركة المصنعة</label>
            <input
              type="text"
              placeholder="مثال: Dell / Toyota / HP"
              value={formData.brand_name}
              onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الموديل (Model)</label>
            <input
              type="text"
              placeholder="مثال: Latitude 5520"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الرقم التسلسلي (Serial Number 1)</label>
            <input
              type="text"
              placeholder="S/N: ABC12345"
              value={formData.serial_number_1}
              onChange={(e) => setFormData({ ...formData, serial_number_1: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الموقع الحالي</label>
            <select
              value={formData.current_location_id}
              onChange={(e) => setFormData({ ...formData, current_location_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- اختر الموقع --</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.location_name} ({l.location_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تسليم كعهدة أولية لموظف</label>
            <select
              value={formData.current_custodian_employee_id}
              onChange={(e) => setFormData({ ...formData, current_custodian_employee_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- بدون عهدة (في المستودع) --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name} ({e.employee_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الجهة المانحة (Donor)</label>
            <select
              value={formData.donor_id}
              onChange={(e) => setFormData({ ...formData, donor_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- اختياري --</option>
              {donors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.donor_name} ({d.donor_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">التكلفة (USD)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.invoice_cost_usd}
              onChange={(e) => setFormData({ ...formData, invoice_cost_usd: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الحالة الفنية</label>
            <select
              value={formData.condition_status}
              onChange={(e) => setFormData({ ...formData, condition_status: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="NEW">جديد (New)</option>
              <option value="GOOD">جيد جداً (Good)</option>
              <option value="OK">مقبول (OK)</option>
              <option value="NEEDS_REPAIR">بحاجة صيانة (Needs Repair)</option>
              <option value="DAMAGED">تالف (Damaged)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الحالة التشغيلية</label>
            <select
              value={formData.lifecycle_status}
              onChange={(e) => setFormData({ ...formData, lifecycle_status: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="CURRENTLY_HELD">بحوزة المنظمة / قيد الاستخدام</option>
              <option value="UNDER_MAINTENANCE">قيد الصيانة</option>
              <option value="PENDING_DISPOSAL">بانتظار الإتلاف</option>
              <option value="DISPOSED">تم الإتلاف والتخريد</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="أية تفاصيل إضافية عن الأصل وملحقاته..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition"
          >
            إلغاء
          </button>
          <button
            id="submit-asset-btn"
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-50"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الأصل'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
