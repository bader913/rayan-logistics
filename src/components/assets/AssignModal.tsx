// src/components/assets/AssignModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Asset } from '../../types/index.js';
import { api } from '../../services/api.js';

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onSuccess: () => void;
}

export const AssignModal: React.FC<AssignModalProps> = ({ isOpen, onClose, asset, onSuccess }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [assignmentDate, setAssignmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && asset) {
      setError(null);
      setEmployeeId('');
      setLocationId(asset.current_location_id || '');
      setCondition(asset.condition_status || 'GOOD');
      setNotes('');

      Promise.all([api.getEmployees({ status: 'ACTIVE' }), api.getLocations()]).then(([emps, locs]) => {
        setEmployees(emps);
        setLocations(locs);
      });
    }
  }, [isOpen, asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !employeeId) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.assignAsset(asset.id, {
        employee_id: employeeId,
        assigned_location_id: locationId || undefined,
        assignment_date: assignmentDate,
        expected_return_date: expectedReturnDate || undefined,
        assignment_condition: condition,
        assignment_notes: notes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign custody');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!asset) return null;

  return (
    <Modal
      id="assign-custody-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="تسليم عهدة أصل لموظف (Handover Custody)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Asset Brief Card */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs space-y-1">
          <p className="font-bold text-blue-900">{asset.full_asset_number || asset.asset_number}</p>
          <p className="text-slate-700">{asset.item_description}</p>
          <p className="text-slate-500 font-mono">S/N: {asset.serial_number_1 || 'N/A'}</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            الموظف المستلم للعهدة <span className="text-rose-500">*</span>
          </label>
          <select
            id="assign-employee-select"
            required
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- اختر الموظف --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name} ({e.employee_number}) - {e.job_title || 'Employee'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ التسليم</label>
            <input
              type="date"
              value={assignmentDate}
              onChange={(e) => setAssignmentDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الإرجاع المتوقع</label>
            <input
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">موقع الاستخدام</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- الاحتفاظ بالموقع الحالي --</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.location_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">حالة الأصل عند التسليم</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="NEW">جديد (New)</option>
              <option value="GOOD">جيد جداً (Good)</option>
              <option value="OK">مقبول ويعمل (OK)</option>
              <option value="FAIR">وسط (Fair)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات محضر التسليم</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="الملحقات المسلمة (كابل، شاحن، حقيبة...) أو شروط الاستخدام..."
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
            id="confirm-assign-btn"
            type="submit"
            disabled={isSubmitting || !employeeId}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition disabled:opacity-50"
          >
            {isSubmitting ? 'جاري توثيق التسليم...' : 'توثيق تسليم العهدة'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
