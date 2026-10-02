import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronUp, ShieldCheck, Zap, Database } from 'lucide-react';

export default function AuditEngineDetails({ engineDetails }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[#eff6ff] border border-blue-200 rounded-lg overflow-hidden mb-5 text-xs transition">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-blue-100/60 select-none"
      >
        <div className="flex items-center space-x-2 text-blue-900 font-medium truncate">
          <Cpu className="w-4 h-4 text-blue-700 shrink-0" />
          <span className="font-semibold text-blue-950">Audit & Engine Details</span>
          <span className="text-blue-400">|</span>
          <span className="text-blue-800 truncate">
            {engineDetails?.ocrEngine || "NVIDIA Nemotron OCR"} → {engineDetails?.semanticEngine || "Nemotron 3 Ultra 550B"} → {engineDetails?.ruleEngine || "Deterministic PCR 2011"}
          </span>
        </div>

        <button className="flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-medium shrink-0 ml-2">
          <span>Details</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 py-3 bg-white border-t border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-600">
          <div className="flex items-start space-x-2">
            <Zap className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800">Processing Telemetry:</span>
              <p>Latency: <span className="font-mono text-slate-700">{engineDetails?.latency || '398ms'}</span></p>
              <p>Tokens Processed: <span className="font-mono text-slate-700">{engineDetails?.tokens || 1840}</span></p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Database className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800">Extraction Stack:</span>
              <p>OCR: {engineDetails?.ocrEngine || "Nemotron OCR v2.4"}</p>
              <p>Semantic: {engineDetails?.semanticEngine || "Nemotron 3 Ultra 550B"}</p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800">Statutory Authority:</span>
              <p className="leading-tight text-[10px] text-slate-500 mt-0.5">
                {engineDetails?.registryVersion || "PCR-2011-CURRENT (GSR 202(E) 2011, GSR 779(E) 2017, GSR 784(E) 2021, GSR 226(E) 2022, GSR 512(E) 2023, 2025 Medical Devices Amendment)"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
