import React from 'react';
import { Search, Bell, MessageSquare, ChevronDown, Crosshair, Siren, MoreVertical, TrendingUp, TrendingDown, Plus, Swords, Flame, Users, Eye } from 'lucide-react';

// Sub-components (StatCard, AlertItem, FeedCard) define here or import from /components
// ... (Paste your StatCard, AlertItem, FeedCard code here) ...

export default function DashboardHome() {
  return (
    <div className="flex-1 flex px-8 py-8 gap-8 overflow-y-auto bg-stone-brown-50 h-screen">
      
      {/* Middle Column */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center h-12">
            <div className="bg-white rounded-full flex items-center px-4 py-2 shadow-sm w-64">
                <span className="text-silver-400 text-sm flex-1">Search cameras...</span>
                <ChevronDown size={16} className="text-silver-500" />
            </div>
            {/* Icons... */}
        </div>

        {/* Hero Card */}
        <div className="bg-stone-brown-950 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-lg mt-2">
            <div className="relative z-10 flex justify-between items-start">
                <div>
                <h2 className="text-stone-brown-200 font-medium mb-1">Global System Status</h2>
                <div className="text-4xl font-bold text-stone-brown-50 tracking-tight">3,402 <span className="text-lg text-silver-500 font-normal tracking-normal">Active Streams</span></div>
                </div>
                <div className="flex items-center gap-2 text-olive-wood-600 text-sm font-semibold bg-olive-wood-600/10 px-2 py-1 rounded-lg">
                    <span>System Optimal</span>
                </div>
            </div>
            {/* Buttons... */}
        </div>

        {/* Stats Row */}
        <div className="flex gap-4">
            {/* Use your StatCard component here */}
            {/* <StatCard title="Total Detections" value="8,992" ... /> */}
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm flex-1">
            <h3 className="font-bold text-lg text-stone-brown-900 mb-4">Threat Flow</h3>
            {/* ... Your SVG Chart code ... */}
        </div>

      </div>

      {/* Right Column */}
      <div className="w-[340px] flex flex-col gap-6 shrink-0 mt-[60px]">
         {/* Recent Alerts List */}
         <div className="bg-white rounded-[2rem] p-6 shadow-sm flex-1">
            <h3 className="font-bold text-lg text-stone-brown-900 mb-6">Recent Alerts</h3>
            {/* <AlertItem ... /> */}
         </div>
      </div>

    </div>
  );
}