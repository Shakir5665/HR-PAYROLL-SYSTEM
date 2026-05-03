import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CreditCard,
  Hourglass,
  Building2,
  LineChart,
  User,
  Calendar,
  Briefcase,
  History
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-12">
        <Building2 className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-800">Connection Interrupted</h2>
        <p className="text-slate-500 max-w-md text-sm">We couldn't synchronize with the Nexus core. Please check your network or refresh the page.</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4">Retry Sync</button>
      </div>
    );
  }

  const departments = stats.departmentStats || [];

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <LineChart className="w-8 h-8 text-slate-800" />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">The Overview</h1>
        </div>
        <p className="text-slate-500 mt-1 font-medium text-sm">Real-time systemic analytics of the HRPay Nexus Ecosystem</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'Employee' ? (
          <>
            <StatCard
              title="Leave Balance"
              value={stats.leaveBalance}
              icon={Calendar}
              color="blue"
              onClick={() => navigate('/leaves')}
            />
            <StatCard
              title="Pending Requests"
              value={stats.pendingRequests}
              icon={Hourglass}
              color="amber"
              onClick={() => navigate('/leaves')}
            />
            <StatCard
              title="Designation"
              value={stats.designation}
              icon={Briefcase}
              color="sky"
            />
            <StatCard
              title="Years with Nexus"
              value={new Date().getFullYear() - new Date(stats.joinedDate).getFullYear()}
              icon={History}
              color="green"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon={Users}
              color="blue"
              onClick={() => navigate('/employees')}
            />
            <StatCard
              title="Monthly Payroll"
              value={`${stats.totalPayrollThisMonth?.toLocaleString() || 0}.00`}
              icon={CreditCard}
              color="green"
              onClick={() => navigate('/payroll')}
            />
            <StatCard
              title="Pending Leaves"
              value={stats.pendingLeaves}
              icon={Hourglass}
              color="amber"
              onClick={() => navigate('/leaves')}
            />
            <StatCard
              title="Departments"
              value={departments.length}
              icon={Building2}
              color="sky"
            />
          </>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b-4 border-cyan-400">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-800">Departments Overview</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-900 text-xs font-black uppercase tracking-wider">
                <th className="px-6 py-4">Department Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Employees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((dept: any) => (
                <tr key={dept.code} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg uppercase">
                      {dept.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">
                    {dept.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">{dept.count}</span>
                      <User className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => {
  const iconStyles: any = {
    blue: 'text-blue-500 bg-blue-50',
    green: 'text-emerald-500 bg-emerald-50',
    amber: 'text-amber-500 bg-amber-50',
    sky: 'text-sky-500 bg-sky-50',
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between group transition-all ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-slate-300' : ''}`}
    >
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
        <p className={`text-3xl font-black tracking-tight ${color === 'green' ? 'text-emerald-600' : 'text-slate-900'}`}>
          {value}
        </p>
      </div>
      <div className={`p-4 rounded-2xl transition-all group-hover:scale-110 ${iconStyles[color]}`}>
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
    </div>
  );
};

export default Dashboard;
