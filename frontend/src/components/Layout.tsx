import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  CreditCard,
  Menu,
  X,
  FileText,
  Shield,
  Cpu
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import ChangeCredentialsModal from './ChangeCredentialsModal';


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Home Dashboard', icon: LayoutDashboard, path: '/', roles: ['Admin', 'HR', 'Finance', 'Manager', 'Employee'] },
    { name: 'Leave Center', icon: CalendarClock, path: '/leaves', roles: ['Admin', 'HR', 'Manager', 'Employee'] },
    { name: 'Employee Base', icon: Users, path: '/employees', roles: ['Admin', 'HR', 'Finance'] },
    { name: 'Payroll Ops', icon: CreditCard, path: '/payroll', roles: ['Admin', 'Finance', 'Employee'] },
    { name: 'Intelligence Reports', icon: FileText, path: '/reports', roles: ['Admin', 'HR', 'Finance'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-['Inter'] overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className={`fixed inset-y-0 left-0 z-50 bg-[#0b1120] flex flex-col lg:relative transition-all duration-300`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <p className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Nexus Menu</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 px-0 py-2 space-y-1">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-6 py-3 transition-all duration-200 border-l-4 ${isActive
                    ? 'bg-slate-800/50 text-white border-cyan-500'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
                  }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : ''}`} />
                <span className="text-sm font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#0b1120] text-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all ${isSidebarOpen ? 'lg:hidden' : 'flex'}`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-500/20 rounded-md border border-cyan-500/30">
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">HR-Pay <span className="text-cyan-400">Nexus</span></span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Welcome,</span>
              <span className="font-bold text-cyan-400 uppercase tracking-wider">{user?.role} USER</span>
              <button
                onClick={() => setIsCredentialsModalOpen(true)}
                className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center ml-2 hover:bg-slate-700 hover:border-cyan-500/50 transition-all group"
                title="Security Settings"
              >
                <Shield className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-1.5 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-all text-xs font-bold"
            >
              Terminate Session
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <footer className="mt-auto pt-8 pb-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-right">
            Architected by Shakir | HRPAY NEXUS V1.0
          </footer>
        </div>
      </main>

      <ChangeCredentialsModal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
      />
    </div>
  );
};

export default Layout;
