import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Video, AlertTriangle, Crosshair, 
  Activity, Users, Settings, LogOut, ShieldAlert, MapPinned, CalendarDays, Radar
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';

const SidebarItem = ({ icon: Icon, label, path }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname === path;

  return (
    <div 
      onClick={() => navigate(path)}
      className={`flex items-center gap-4 px-6 py-3 cursor-pointer transition-all border-r-4 ${
      active 
        ? 'text-stone-brown-900 font-bold border-toasted-almond-500 bg-gradient-to-r from-transparent to-toasted-almond-100/30' 
        : 'text-silver-500 font-medium border-transparent hover:text-stone-brown-900'
    }`}>
      <Icon size={20} className={active ? 'text-toasted-almond-500' : 'text-silver-500'} />
      <span>{label}</span>
    </div>
  );
};

export default function Sidebar() {
  const dispatch = useDispatch();

  return (
    <div className="w-64 bg-white h-full flex flex-col py-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0">
      <div className="flex items-center gap-3 px-8 mb-10">
        <ShieldAlert size={28} className="text-toasted-almond-500" />
        <span className="font-black text-xl text-stone-brown-900 tracking-tight">Sentinel AI</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-8 text-xs font-bold text-silver-300 uppercase tracking-wider mb-2">Operations</div>
        <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/dashboard" />
        <SidebarItem icon={Video} label="Live Wall" path="/dashboard/live" />
        <SidebarItem icon={AlertTriangle} label="Incidents" path="/dashboard/incidents" />
        <SidebarItem icon={Crosshair} label="Map View" path="/dashboard/map" />
        <SidebarItem icon={Activity} label="AI Model" path="/dashboard/ai-models" />
        <SidebarItem icon={Users} label="User Reports" path="/dashboard/user-reports" />
        
        <div className="px-8 text-xs font-bold text-silver-300 uppercase tracking-wider mt-6 mb-2">Management</div>
        <SidebarItem icon={Users} label="Responders" path="/dashboard/responders" />
        <SidebarItem icon={Users} label="Cameras" path="/dashboard/cameras" />
        <SidebarItem icon={MapPinned} label="Zones" path="/dashboard/zones" />
        <SidebarItem icon={Radar} label="Anomaly Rules" path="/dashboard/anomaly-rules" />
        <SidebarItem icon={CalendarDays} label="Events" path="/dashboard/events" />
        <SidebarItem icon={Settings} label="Config" path="/dashboard/settings" />
      </div>

      <div className="px-8 mt-auto pt-6 border-t border-stone-brown-50">
        <button onClick={() => dispatch(logout())} className="flex items-center gap-4 text-silver-500 hover:text-red-600 transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}