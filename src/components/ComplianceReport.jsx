import React from 'react';
import { FileText, AlertTriangle, CheckCircle2, XCircle, Scale, Download, Loader2 } from 'lucide-react';
import RuleAccordion from './RuleAccordion';

export default function ComplianceReport({
  inspection,
  highlightedBoxId,
  onBoxSelect,
  onExportPdf,
  isExportingPdf
}) {
  const isNeedsReview = inspection.status === 'NEEDS REVIEW';
  const isPass = inspection.status === 'PASS';
  const isFail = inspection.status === 'FAILED';

  return (
    <div className="space-y-4">
      {/* Executive Inspection Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Executive Inspection Summary</span>
          </div>

          {onExportPdf && (
            <button
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-2xs ${
                isExportingPdf
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                  : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100 cursor-pointer active:scale-95'
              }`}
              title="Download official Legal Metrology Inspection Report as PDF"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  <span>Export Report PDF</span>
                </>
              )}
            </button>
          )}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {inspection.summaryText || 'The package label inspection has completed statutory analysis.'}
        </p>
      </div>

      {/* Statutory Determination Banner */}
      <div
        className={`rounded-xl p-4 border transition ${
          isNeedsReview
            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
            : isPass
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div
              className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                isNeedsReview
                  ? 'bg-amber-500 text-white'
                  : isPass
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {isNeedsReview ? (
                <AlertTriangle className="w-5 h-5" />
              ) : isPass ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase opacity-75">
                LEGAL METROLOGY DETERMINATION
              </div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight mt-0.5">
                {inspection.statusDetail || 'NEEDS REVIEW — INSUFFICIENT EVIDENCE'}
              </h3>
              <p className="text-xs mt-1 opacity-90 leading-snug">
                {inspection.subStatusDetail || 'Additional package panel views or physical inspection are required to establish full compliance.'}
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded border shrink-0 ${
              isNeedsReview
                ? 'bg-white/80 text-amber-900 border-amber-300'
                : isPass
                ? 'bg-white/80 text-emerald-900 border-emerald-300'
                : 'bg-white/80 text-rose-900 border-rose-300'
            }`}
          >
            PCR 2011
          </span>
        </div>
      </div>

      {/* Statutory Checks Summary Row */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
          <Scale className="w-4 h-4 text-slate-700" />
          <span>{inspection.stats?.total || 20} Statutory Checks</span>
        </div>

        <div className="flex items-center space-x-2 text-xs font-medium">
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
            🟢 {inspection.stats?.passed || 0} Passed
          </span>
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
            ⚠ {inspection.stats?.review || 0} Review
          </span>
          {inspection.stats?.failed > 0 && (
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
              ❌ {inspection.stats.failed} Failed
            </span>
          )}
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
            ⚪ {inspection.stats?.na || 0} N/A
          </span>
        </div>
      </div>

      {/* Detailed Rules Section */}
      <div className="pt-2">
        <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider mb-2">
          DETAILED COMPLIANCE RULES ({inspection.rules?.length || 20})
        </h3>

        <RuleAccordion
          rules={inspection.rules}
          highlightedBoxId={highlightedBoxId}
          onRuleSelect={onBoxSelect}
        />
      </div>
    </div>
  );
}
