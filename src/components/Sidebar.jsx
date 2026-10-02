import React, { useState } from 'react';
import { Shield, Plus, Search, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export default function Sidebar({
  inspections,
  currentInspectionId,
  onSelectInspection,
  onNewInspectionClick,
  activeView
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredInspections = inspections.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.commodity && item.commodity.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Needs Review') return matchesSearch && item.status === 'NEEDS REVIEW';
    if (statusFilter === 'Passed') return matchesSearch && item.status === 'PASS';
    if (statusFilter === 'Failed') return matchesSearch && item.status === 'FAILED';
    return matchesSearch;
  });

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.png" 
            alt="Label Check Logo" 
            className="w-10 h-10 object-contain shrink-0" 
          />
          <div>
            <div className="flex items-center">
              <span className="font-extrabold text-base tracking-tight text-slate-900">LABEL</span>
              <span className="font-extrabold text-base tracking-tight text-[#2e963b] ml-1">CHECK</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">Legal Metrology Inspection System</p>
          </div>
        </div>

        {/* New Inspection Button */}
        <button
          onClick={onNewInspectionClick}
          className={`w-full mt-4 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition shadow-sm ${
            activeView === 'new'
              ? 'bg-blue-900 text-white ring-2 ring-blue-500'
              : 'bg-[#1e3a8a] hover:bg-[#172554] text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>New Inspection</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-3 border-b border-slate-100 space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search inspections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-700"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 text-[11px] font-medium">
          {['All', 'Needs Review', 'Passed', 'Failed'].map((filter) => {
            const isActive = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inspections List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredInspections.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No inspections yet</p>
            <p className="text-[11px] text-slate-400 mt-1">Upload a label photo to generate your first compliance report.</p>
          </div>
        ) : (
          filteredInspections.map((item) => {
            const isSelected = activeView === 'workspace' && currentInspectionId === item.id;
            const isNeedsReview = item.status === 'NEEDS REVIEW';
            const isPass = item.status === 'PASS';
            const isFail = item.status === 'FAILED';

            return (
              <div
                key={item.id}
                onClick={() => onSelectInspection(item.id)}
                className={`p-3.5 cursor-pointer transition text-left border-l-4 ${
                  isSelected
                    ? 'bg-blue-50/60 border-l-blue-700'
                    : 'hover:bg-slate-50 border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className={`text-xs font-semibold truncate max-w-[150px] ${
                    isSelected ? 'text-blue-950 font-bold' : 'text-slate-800'
                  }`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-normal shrink-0">
                    {item.timeAgo || 'recent'}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center space-x-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isNeedsReview
                        ? 'bg-amber-500'
                        : isPass
                        ? 'bg-emerald-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium ${
                      isNeedsReview
                        ? 'text-amber-700'
                        : isPass
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {item.status === 'NEEDS REVIEW' ? 'Needs Review' : item.status === 'PASS' ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Service Status */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
        <span className="font-medium">Backend Service:</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700">Live Engine</span>
        </div>
      </div>
    </aside>
  );
}
