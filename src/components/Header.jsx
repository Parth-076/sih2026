import React from 'react';
import { Scale, RefreshCw } from 'lucide-react';

export default function Header({ currentInspectionId, onRefresh }) {
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3 text-sm">
        <Scale className="w-5 h-5 text-slate-700" />
        <span className="font-semibold text-slate-800">Legal Metrology Inspection Workspace</span>
        {currentInspectionId && (
          <>
            <span className="text-slate-400">/</span>
            <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-blue-900 border border-slate-200 rounded font-medium">
              {currentInspectionId}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onRefresh}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
          title="Refresh Workspace"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
