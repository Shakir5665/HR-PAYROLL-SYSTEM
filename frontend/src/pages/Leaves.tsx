import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Check, X, Calendar, Search, Trash2, Send } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Leaves: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const response = await api.get('/leave');
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, comment }: any) => api.put(`/leave/${id}/status`, { status, adminComment: comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      showAlert('Success', 'Leave status updated successfully');
    },
    onError: (err: any) => showAlert('Update Failed', err.response?.data || err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/leave/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      showAlert('Deleted', 'Leave record has been removed');
    },
    onError: (err: any) => showAlert('Delete Failed', err.response?.data || err.message)
  });

  const handleAction = (id: string, status: number) => {
    const comment = status === 1 ? 'Approved' : 'Rejected';
    updateStatusMutation.mutate({ id, status, comment });
  };

  const handleDelete = (id: string) => {
    showConfirm(
      'Confirm Delete',
      'Are you sure you want to permanently delete this leave record?',
      () => deleteMutation.mutate(id)
    );
  };

  const isManagerOrAdmin = ['Admin', 'HR', 'Manager'].includes(user?.role || '');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Leave Management</h1>
              <p className="text-slate-500 font-medium text-sm">Real-time systemic tracking of employee absences</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-blue-600/25 active:scale-95"
        >
          <Send className="w-4 h-4" />
          Lodge Request
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee or reason..."
              className="bg-transparent border-none text-sm w-80 focus:outline-none focus:ring-0 text-slate-600 placeholder:text-slate-400 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-900 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">Employee Name</th>
                <th className="px-6 py-5">Balance Leaves</th>
                <th className="px-6 py-5">Duration</th>
                <th className="px-6 py-5">Period</th>
                <th className="px-6 py-5">Reason</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={8} className="px-8 py-20 text-center"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Synchronizing...</span></div></td></tr>
              ) : leaves?.length === 0 ? (
                <tr><td colSpan={8} className="px-8 py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">No systemic records found.</td></tr>
              ) : leaves?.filter((l: any) => l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || l.reason.toLowerCase().includes(searchTerm.toLowerCase())).map((leave: any) => (
                <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs border border-slate-200">
                        {leave.employeeName.charAt(0)}
                      </div>
                      <span className="text-sm font-black text-slate-900">{leave.employeeName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-1">
                      <span className={`px-3 py-1 w-fit rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${leave.annualLeaveBalance <= 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                        {leave.annualLeaveBalance} Days
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">
                      {Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 3600 * 24)) + 1} Day(s)
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">{new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">— {new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-slate-600 leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:break-words">
                        {leave.reason}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-md border-none ${
                      leave.status === 0 ? 'bg-amber-500 text-white' :
                      leave.status === 1 ? 'bg-emerald-600 text-white' :
                      'bg-rose-600 text-white'
                    }`}>
                      {leave.status === 0 ? 'Pending' : leave.status === 1 ? 'Approved' : 'Rejected'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 transition-all">
                      {isManagerOrAdmin && (
                        <>
                          <button
                            onClick={() => handleAction(leave.id, 1)}
                            disabled={leave.status !== 0}
                            className={`p-2.5 rounded-xl transition-all shadow-lg ${
                              leave.status === 0 
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20 active:scale-95' 
                                : 'bg-slate-50 text-slate-200 shadow-none cursor-not-allowed opacity-50'
                            }`}
                            title={leave.status === 0 ? "Approve Request" : "Decision already made"}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                          <button
                            onClick={() => handleAction(leave.id, 2)}
                            disabled={leave.status !== 0}
                            className={`p-2.5 rounded-xl transition-all shadow-lg ${
                              leave.status === 0 
                                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20 active:scale-95' 
                                : 'bg-slate-50 text-slate-200 shadow-none cursor-not-allowed opacity-50'
                            }`}
                            title={leave.status === 0 ? "Reject Request" : "Decision already made"}
                          >
                            <X className="w-4 h-4 stroke-[3]" />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => handleDelete(leave.id)}
                        disabled={leave.status === 1}
                        className={`p-2.5 rounded-xl transition-all shadow-lg ${
                          leave.status !== 1 
                            ? 'bg-slate-900 text-white hover:bg-black shadow-slate-900/20 active:scale-95' 
                            : 'bg-slate-50 text-slate-200 shadow-none cursor-not-allowed opacity-50'
                        }`}
                        title={leave.status !== 1 ? "Delete Record" : "Approved records cannot be deleted"}
                      >
                        <Trash2 className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing <span className="text-slate-900">{leaves?.length || 0}</span> Systemic Entries
          </p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed">Previous</button>
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>

      {modal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-4">
              <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${modal.type === 'alert' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                {modal.type === 'alert' ? <Send className="w-8 h-8" /> : <Trash2 className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{modal.title}</h3>
                <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">{modal.message}</p>
              </div>
              <div className="pt-4 flex gap-3">
                {modal.type === 'confirm' && (
                  <button
                    onClick={() => setModal({ ...modal, show: false })}
                    className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-bold transition-all text-sm"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => {
                    if (modal.type === 'confirm' && modal.onConfirm) modal.onConfirm();
                    setModal({ ...modal, show: false });
                  }}
                  className={`flex-1 px-6 py-3 text-white rounded-full font-bold shadow-lg transition-all text-sm ${modal.type === 'confirm' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}
                >
                  {modal.type === 'confirm' ? 'Delete' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <RequestLeaveModal
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['leaves'] })}
          showAlert={showAlert}
        />
      )}
    </div>
  );
};

const RequestLeaveModal: React.FC<{ onClose: () => void, onSuccess: () => void, showAlert: (title: string, message: string) => void }> = ({ onClose, onSuccess, showAlert }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/leave', data),
    onSuccess: () => {
      onSuccess();
      onClose();
      setFormData({ startDate: '', endDate: '', reason: '' });
      showAlert('Request Sent', 'Your leave request has been submitted successfully and is awaiting review.');
    },
    onError: (err: any) => {
      console.error('Leave request error:', err);
      const errorMessage = err.response?.data || err.message || 'Failed to submit request';
      showAlert('Submission Failed', errorMessage);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate) {
      showAlert('Validation Error', 'Please select both start and end dates.');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      showAlert('Invalid Dates', 'The start date cannot be later than the end date.');
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Lodge Leave Request</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
              <input
                type="date" required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
              <input
                type="date" required
                min={formData.startDate}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason for Absence</label>
            <textarea
              required rows={4}
              placeholder="Provide a brief reason for your leave request..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-bold transition-all text-sm">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-sm">
              {mutation.isPending ? 'Processing...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Leaves;
