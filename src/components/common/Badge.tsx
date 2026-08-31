// src/components/common/Badge.tsx
import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

interface BadgeProps {
  status: string;
  type?: 'lifecycle' | 'condition' | 'priority' | 'inventory';
}

export const Badge: React.FC<BadgeProps> = ({ status, type = 'lifecycle' }) => {
  const { t } = useLanguage();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  if (type === 'lifecycle') {
    label = t(`status.${status}`, status);
    switch (status) {
      case 'CURRENTLY_HELD':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'UNDER_MAINTENANCE':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'MISSING':
      case 'LOST':
      case 'STOLEN':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'DISPOSED':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-300 line-through';
        break;
      default:
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    }
  } else if (type === 'condition') {
    label = t(`condition.${status}`, status);
    switch (status) {
      case 'NEW':
      case 'GOOD':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'OK':
      case 'FAIR':
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'NEEDS_REPAIR':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'DAMAGED':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      default:
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
    }
  } else if (type === 'priority') {
    switch (status) {
      case 'CRITICAL':
        colorClasses = 'bg-red-50 text-red-700 border-red-200 font-bold';
        break;
      case 'HIGH':
        colorClasses = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
        break;
      case 'MEDIUM':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'LOW':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
        break;
    }
  } else if (type === 'inventory') {
    switch (status) {
      case 'MATCHED':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
        break;
      case 'FOUND_DIFFERENT_LOCATION':
      case 'FOUND_DIFFERENT_CUSTODIAN':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
        break;
      case 'MISSING':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
        break;
      case 'UNREGISTERED':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
        break;
      default:
        colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${colorClasses}`}
    >
      {label}
    </span>
  );
};
