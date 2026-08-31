// src/components/assets/ReturnModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Asset } from '../../types/index.js';
import { api } from '../../services/api.js';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onSuccess: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({ isOpen, onClose, asset, onSuccess }) => {
  const [locations, setLocations] = useState<any[]>([]);
  const [locationId, setLocationId] = useState('');
  const [returnCondition, setReturnCondition] = useState('GOOD');
  const [returnNotes, setReturnNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && asset) {
      setError(null);
      setReturnNotes('');
      setReturnCondition(asset.condition_status || 'GOOD');

      api.getLocations().then((locs) => {
        setLocations(locs);
        const warehouse = locs.find((l) => l.location_type === 'WAREHOUSE' || l.location_name.includes('مستودع') || l.location_name.includes('Warehouse'));
        setLocationId(warehouse ? warehouse.id : locs[0]?.id || '');
      });
    }
  }, [isOpen, asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !locationId) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.returnAsset(asset.id, {
        to_location_id: locationId,
        return_condition: returnCondition,
        return_notes: returnNotes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to return asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!asset) return null;

  return (
    <Modal
      id="return-custody-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="استرجاع العهدة وإعادتها للمستودع (Return to Stock)"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs space-y-1">
          <p className="font-bold text-amber-900">{asset.full_asset_number || asset.asset_number}</p>
          <p className="text-slate-700">{asset.item_description}</p>
          <p className="text-slate-600">المستلم الحالي: <span className="font-semibold">{asset.custodian_name || 'موظف'}</span></p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            مستودع / موقع الإرجاع <span className="text-rose-500">*</span>
          </label>
          <select
            id="return-location-select"
            required
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.location_name} ({l.location_code}) - {l.location_type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">الحالة الفنية عند الاسترجاع</label>
          <select
            value={returnCondition}
            onChange={(e) => setReturnCondition(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="GOOD">سليم ويعمل بحالة ممتازة (Good)</option>
            <option value="OK">مقبول بدون أضرار (OK)</option>
            <option value="NEEDS_REPAIR">بحاجة صيانة / فحص فني (Needs Repair)</option>
            <option value="DAMAGED">متضرر أو تالف (Damaged)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الاسترجاع والفحص</label>
          <textarea
            rows={2}
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="ملاحظات حول سلامة الجهاز أو الملحقات المستلمة..."
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
            id="confirm-return-btn"
            type="submit"
            disabled={isSubmitting || !locationId}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-50"
          >
            {isSubmitting ? 'جاري الاسترجاع...' : 'تأكيد الاسترجاع وإخلاء الطرف'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
