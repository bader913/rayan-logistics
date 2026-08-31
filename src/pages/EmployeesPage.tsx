// src/pages/EmployeesPage.tsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, User, Shield, Briefcase, Mail, Phone, Box, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/common/Modal.js';
import { Badge } from '../components/common/Badge.js';
import { useLanguage } from '../context/LanguageContext.js';
import { api } from '../services/api.js';
import { Employee, Asset } from '../types/index.js';

export const EmployeesPage: React.FC = () => {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Employee Custody view
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [isCustodyModalOpen, setIsCustodyModalOpen] = useState(false);
  const [custodyLoading, setCustodyLoading] = useState(false);

  // Create Employee modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({
    employee_number: '',
    full_name: '',
    department_id: '',
    job_title: '',
    email: '',
    phone: '',
    notes: '',
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const emps = await api.getEmployees({
        search,
        department_id: departmentId,
      });
      setEmployees(emps);
    } catch (err) {
      console.error('Failed to load employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getDepartments().then(setDepartments);
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchEmployees, 250);
    return () => clearTimeout(timer);
  }, [search, departmentId]);

  const handleOpenCustody = async (emp: Employee) => {
    setCustodyLoading(true);
    setIsCustodyModalOpen(true);
    try {
      const details = await api.getEmployeeById(emp.id);
      setSelectedEmp(details);
    } finally {
      setCustodyLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEmployee({
        ...newEmp,
        department_id: newEmp.department_id || null,
        email: newEmp.email || null,
        phone: newEmp.phone || null,
      });
      setIsCreateOpen(false);
      setNewEmp({ employee_number: '', full_name: '', department_id: '', job_title: '', email: '', phone: '', notes: '' });
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {t('nav.employees')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            دليل الموظفين وتتبع العهد الشخصية والأصول المسلمة
          </p>
        </div>

        <button
          id="open-create-employee-btn"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
          <input
            type="text"
            placeholder="بحث باسم الموظف، الرقم الوظيفي، أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع الأقسام والإدارات</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.department_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            جاري تحميل قائمة الموظفين...
          </div>
        ) : employees.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            لم يتم العثور على موظفين مطابقين للبحث.
          </div>
        ) : (
          employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-sm transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {emp.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {emp.full_name}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500 block">
                        {emp.employee_number}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      emp.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {emp.employment_status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.job_title || 'موظف'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.department_name || 'الإدارة العامة'}</span>
                  </div>
                  {emp.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">
                    {emp.active_custody_count || 0} أصول عهدة
                  </span>
                </div>

                <button
                  onClick={() => handleOpenCustody(emp)}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200"
                >
                  كشف العهدة
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Custody Drawer Modal */}
      <Modal
        id="employee-custody-modal"
        isOpen={isCustodyModalOpen}
        onClose={() => {
          setIsCustodyModalOpen(false);
          setSelectedEmp(null);
        }}
        title={`كشف العهدة الشخصية: ${selectedEmp?.employee?.full_name || ''}`}
        maxWidth="3xl"
      >
        {custodyLoading || !selectedEmp ? (
          <div className="py-12 text-center text-xs text-slate-400">جاري تحميل سجل العهد...</div>
        ) : (
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-wrap gap-4 justify-between">
              <div>
                <span className="text-slate-400 block">الرقم الوظيفي:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedEmp.employee.employee_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block">المسمى الوظيفي:</span>
                <span className="font-bold text-slate-900">{selectedEmp.employee.job_title || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">القسم:</span>
                <span className="font-bold text-slate-900">{selectedEmp.employee.department_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">إجمالي العهد المسلمة:</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">{selectedEmp.current_custody.length} أصل</span>
              </div>
            </div>

            {/* Current Active Custodies */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                الأصول المسلمة حالياً بحوزة الموظف ({selectedEmp.current_custody.length})
              </h4>
              {selectedEmp.current_custody.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                  لا توجد أية عهد مسجلة بحوزة هذا الموظف حالياً (طرفه مبرأ).
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEmp.current_custody.map((asset: any) => (
                    <div
                      key={asset.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-slate-900">
                            {asset.full_asset_number || asset.asset_number}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                            {asset.category_name}
                          </span>
                        </div>
                        <p className="text-slate-700 mt-1">{asset.item_description}</p>
                        <p className="text-[11px] text-slate-400 font-mono">S/N: {asset.serial_number_1 || 'N/A'}</p>
                      </div>

                      <div className="text-right">
                        <Badge status={asset.condition_status} type="condition" />
                        <span className="text-[11px] text-slate-400 block mt-1">
                          تاريخ التسليم: {asset.assignment_date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custody History */}
            {selectedEmp.custody_history && selectedEmp.custody_history.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  سجل العهد السابقة المسترجعة ({selectedEmp.custody_history.length})
                </h4>
                <div className="space-y-2">
                  {selectedEmp.custody_history.map((h: any) => (
                    <div key={h.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs flex justify-between items-center text-slate-600">
                      <div>
                        <span className="font-mono font-bold text-slate-800">{h.full_asset_number}</span>
                        <span className="mx-2">•</span>
                        <span>{h.item_description}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        استرجع بتاريخ: {new Date(h.returned_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Employee Modal */}
      <Modal
        id="create-employee-modal"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="إضافة موظف جديد إلى السجل"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">الرقم الوظيفي (Employee Number) *</label>
              <input
                type="text"
                required
                placeholder="مثال: EMP-042"
                value={newEmp.employee_number}
                onChange={(e) => setNewEmp({ ...newEmp, employee_number: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                placeholder="الاسم الثلاثي"
                value={newEmp.full_name}
                onChange={(e) => setNewEmp({ ...newEmp, full_name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">القسم / الإدارة</label>
              <select
                value={newEmp.department_id}
                onChange={(e) => setNewEmp({ ...newEmp, department_id: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- اختر القسم --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
              <input
                type="text"
                placeholder="مثال: Logistics Officer"
                value={newEmp.job_title}
                onChange={(e) => setNewEmp({ ...newEmp, job_title: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                placeholder="name@rayanlogistics.org"
                value={newEmp.email}
                onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input
                type="tel"
                placeholder="+963 9xx xxx xxx"
                value={newEmp.phone}
                onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
            >
              حفظ الموظف
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
