import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Search, UserPlus, Eye, Edit2, Trash2, X, Users2 } from 'lucide-react';

const Employees: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState<any>(null);
  
  // Custom Modal State
  const [modal, setModal] = useState<{
    show: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ show: false, type: 'alert', title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setModal({ show: true, type: 'alert', title, message });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModal({ show: true, type: 'confirm', title, message, onConfirm });
  };

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employee');
      return response.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/employee/departments');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employee/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      showAlert('Deleted', 'Employee record has been removed from the registry');
    },
    onError: (err: any) => showAlert('Delete Failed', err.response?.data || err.message)
  });

  const handleDelete = (id: string, name: string) => {
    showConfirm(
      'Confirm Deletion',
      `Are you sure you want to permanently remove ${name} from the enterprise registry?`,
      () => deleteMutation.mutate(id)
    );
  };

  const filteredEmployees = employees?.filter((emp: any) => 
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500 rounded-lg shadow-lg">
              <Users2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Employee Directory</h1>
          </div>
          <p className="text-slate-500 mt-1 font-medium text-sm">Enterprise Registry</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2.5 bg-[#0b1120] hover:bg-slate-800 text-white rounded-md font-bold transition-all flex items-center gap-2 text-sm shadow-lg shadow-slate-900/20 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Onboard Employee
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex-1 max-w-md hidden md:block" />
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search ecosystem..." 
              className="bg-white border border-slate-200 rounded-lg px-5 py-2 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Nexus ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Corporate Email</th>
                <th className="px-6 py-4">Basic Salary</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-sm">Synchronizing directory...</td></tr>
              ) : filteredEmployees?.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-sm">No employees found in registry.</td></tr>
              ) : filteredEmployees?.map((emp: any) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                    {emp.employeeCode}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">
                    {emp.fullName}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">
                    {emp.department}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-cyan-500 hover:underline cursor-pointer">
                    {emp.email}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-emerald-600">
                    {emp.baseSalary.toLocaleString()} LKR
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowViewModal(emp)}
                        className="p-1.5 text-cyan-400 hover:bg-cyan-50 rounded-lg border border-cyan-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setShowEditModal(emp)}
                        className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(emp.id, emp.fullName)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
          <span>Showing 1 to {filteredEmployees?.length || 0} of {filteredEmployees?.length || 0} entries</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-white transition-colors disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
      
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing page 1</p>

      {modal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden p-8 text-center space-y-4">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{modal.title}</h3>
            <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">{modal.message}</p>
            <div className="pt-4 flex gap-3">
              {modal.type === 'confirm' && (
                <button 
                  onClick={() => setModal({ ...modal, show: false })}
                  className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-all text-sm"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={() => {
                  if (modal.type === 'confirm' && modal.onConfirm) modal.onConfirm();
                  setModal({ ...modal, show: false });
                }}
                className={`flex-1 px-6 py-3 text-white rounded-lg font-bold shadow-lg transition-all text-sm ${modal.type === 'confirm' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {modal.type === 'confirm' ? 'Delete' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && <AddEmployeeModal onClose={() => setShowAddModal(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['employees'] })} showAlert={showAlert} departments={departments || []} />}
      {showEditModal && <EditEmployeeModal employee={showEditModal} onClose={() => setShowEditModal(null)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['employees'] })} showAlert={showAlert} departments={departments || []} />}
      {showViewModal && <ViewEmployeeModal employee={showViewModal} onClose={() => setShowViewModal(null)} />}
    </div>
  );
};

const AddEmployeeModal: React.FC<{ 
  onClose: () => void, 
  onSuccess: () => void, 
  showAlert: (title: string, message: string) => void,
  departments: string[] 
}> = ({ onClose, onSuccess, showAlert, departments }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    department: '',
    designation: '',
    baseSalary: '',
    role: 'Employee'
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/employee', data),
    onSuccess: () => {
      onSuccess();
      onClose();
      showAlert('Onboarding Success', `${formData.fullName} has been successfully added to the system.`);
    },
    onError: (err: any) => {
      showAlert('Onboarding Failed', err.response?.data || err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      baseSalary: parseFloat(formData.baseSalary),
      joinedDate: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Onboard New Employee</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
              <input 
                type="text" required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corporate Email</label>
              <input 
                type="email" required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              >
                <option value="">Select Dept</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</label>
              <input 
                type="text" required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={formData.designation}
                onChange={(e) => setFormData({...formData, designation: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Basic Salary (LKR)</label>
              <input 
                type="number" required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={formData.baseSalary}
                onChange={(e) => setFormData({...formData, baseSalary: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Access Role</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="HR">HR Specialist</option>
                <option value="Finance">Finance Officer</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Password</label>
            <input 
              type="password" required 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-bold transition-all text-sm">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-6 py-3 bg-[#0b1120] hover:bg-slate-800 text-white rounded-full font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 text-sm">
              {mutation.isPending ? 'Processing...' : 'Complete Onboarding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditEmployeeModal: React.FC<{ 
  employee: any, 
  onClose: () => void, 
  onSuccess: () => void, 
  showAlert: (title: string, message: string) => void,
  departments: string[]
}> = ({ employee, onClose, onSuccess, showAlert, departments }) => {
  const [formData, setFormData] = useState({
    fullName: employee.fullName,
    department: employee.department,
    designation: employee.designation,
    baseSalary: employee.baseSalary.toString(),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.put(`/employee/${employee.id}`, data),
    onSuccess: () => {
      onSuccess();
      onClose();
      showAlert('Success', 'Employee profile updated successfully.');
    },
    onError: (err: any) => showAlert('Update Failed', err.response?.data || err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      baseSalary: parseFloat(formData.baseSalary)
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Profile: {employee.fullName}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
            <input 
              type="text" required 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-bold"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              >
                <option value="">Select Dept</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</label>
              <input 
                type="text" required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={formData.designation}
                onChange={(e) => setFormData({...formData, designation: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Basic Salary (LKR)</label>
            <input 
              type="number" required 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              value={formData.baseSalary}
              onChange={(e) => setFormData({...formData, baseSalary: e.target.value})}
            />
          </div>
          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-bold transition-all text-sm">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full font-bold shadow-lg shadow-cyan-600/20 transition-all text-sm">
              {mutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewEmployeeModal: React.FC<{ employee: any, onClose: () => void }> = ({ employee, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-10 text-center border-b border-slate-50 relative">
          <button onClick={onClose} className="absolute right-6 top-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"><X className="w-6 h-6" /></button>
          <div className="mx-auto w-24 h-24 bg-cyan-50 rounded-[2rem] flex items-center justify-center text-cyan-500 mb-6 border border-cyan-100">
            <Users2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{employee.fullName}</h2>
          <p className="text-cyan-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">{employee.employeeCode}</p>
        </div>
        <div className="p-10 grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</p>
            <p className="text-sm font-bold text-slate-700">{employee.department}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</p>
            <p className="text-sm font-bold text-slate-700">{employee.designation}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corporate Email</p>
            <p className="text-sm font-bold text-slate-700">{employee.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Salary</p>
            <p className="text-sm font-black text-emerald-600">{employee.baseSalary.toLocaleString()} LKR</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined Date</p>
            <p className="text-sm font-bold text-slate-700">{new Date(employee.joinedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Role</p>
            <p className="text-sm font-bold text-slate-700">{employee.role}</p>
          </div>
        </div>
        <div className="px-10 pb-10">
          <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
            Close Registry Record
          </button>
        </div>
      </div>
    </div>
  );
};

export default Employees;
