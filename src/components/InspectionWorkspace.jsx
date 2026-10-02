import React, { useState } from 'react';
import { ArrowLeft, FileText, Download, Plus, AlertTriangle, CheckCircle2, XCircle, Scale, Loader2, Check } from 'lucide-react';
import AuditEngineDetails from './AuditEngineDetails';
import ImageViewer from './ImageViewer';
import ComplianceReport from './ComplianceReport';
import TechnicalData from './TechnicalData';
import { exportInspectionPdf } from '../services/pdfGenerator';

export default function InspectionWorkspace({
  inspection,
  onBackToNew,
  onNewInspection
}) {
  const [activeTab, setActiveTab] = useState('compliance'); // 'compliance' or 'technical'
  const [highlightedBoxId, setHighlightedBoxId] = useState(null);
  const [hoveredBoxId, setHoveredBoxId] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportToast, setExportToast] = useState(null);

  if (!inspection) {
    return (
      <div className="p-12 text-center text-slate-500">
        No inspection selected.
      </div>
    );
  }

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inspection, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${inspection.id}_compliance_audit.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setExportToast(null);

    try {
      const result = await exportInspectionPdf(inspection);
      setExportToast({
        type: 'success',
        message: `Official Inspection Report (${result?.filename || 'report.pdf'}) generated and downloaded successfully!`
      });
      setTimeout(() => setExportToast(null), 6000);
    } catch (err) {
      console.error("PDF Export error:", err);
      setExportToast({
        type: 'error',
        message: `Failed to export PDF: ${err.message || 'Unknown error'}`
      });
      setTimeout(() => setExportToast(null), 6000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <button
              onClick={onBackToNew}
              className="hover:text-blue-600 flex items-center space-x-1 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Inspections</span>
            </button>
            <span>/</span>
            <span className="font-mono text-slate-700">{inspection.id}</span>
            <span>•</span>
            <span>{inspection.formattedDate}</span>
          </div>

          <div className="mt-1 flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {inspection.title}
            </h1>
            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                inspection.status === 'NEEDS REVIEW'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : inspection.status === 'PASS'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {inspection.status === 'NEEDS REVIEW' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
              {inspection.status === 'PASS' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              {inspection.status === 'FAILED' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
              <span>{inspection.status === 'NEEDS REVIEW' ? 'Needs Review' : inspection.status === 'PASS' ? 'Passed' : 'Failed'}</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition shadow-sm ${
              isExportingPdf
                ? 'bg-blue-800 text-blue-200 cursor-wait'
                : 'bg-[#1e3a8a] hover:bg-[#172554] text-white cursor-pointer active:scale-95'
            }`}
            title="Generate and download official 2-Page Legal Metrology PDF Report"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Export PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onNewInspection}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>New Inspection</span>
          </button>
        </div>
      </div>

      {/* Export Toast Notification */}
      {exportToast && (
        <div
          className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-semibold animate-in fade-in slide-in-from-top-2 shadow-xs ${
            exportToast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {exportToast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{exportToast.message}</span>
          </div>
          <button
            onClick={() => setExportToast(null)}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Audit Engine Details Banner */}
      <AuditEngineDetails engineDetails={inspection.engineDetails} />

      {/* 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Viewer */}
        <div className="lg:col-span-5 xl:col-span-6 sticky top-20">
          <ImageViewer
            image={inspection.image}
            boundingBoxes={inspection.boundingBoxes}
            highlightedBoxId={highlightedBoxId}
            hoveredBoxId={hoveredBoxId}
            onBoxHover={(boxId) => setHoveredBoxId(boxId)}
            onBoxSelect={(boxId) => setHighlightedBoxId(boxId)}
          />
        </div>

        {/* Right Column: Compliance Report & Technical Data */}
        <div className="lg:col-span-7 xl:col-span-6 space-y-4">
          {/* View Mode Tabs */}
          <div className="flex items-center border-b border-slate-200 bg-white p-1 rounded-lg border shadow-xs">
            <button
              onClick={() => setActiveTab('compliance')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-bold rounded-md transition ${
                activeTab === 'compliance'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Scale className="w-4 h-4 text-blue-700" />
              <span>Compliance Report</span>
            </button>

            <button
              onClick={() => setActiveTab('technical')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-bold rounded-md transition ${
                activeTab === 'technical'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Technical Data</span>
            </button>
          </div>

          {/* Active Tab View */}
          {activeTab === 'compliance' ? (
            <ComplianceReport
              inspection={inspection}
              highlightedBoxId={highlightedBoxId}
              onBoxSelect={(boxId) => setHighlightedBoxId(boxId)}
              onExportPdf={handleExportPdf}
              isExportingPdf={isExportingPdf}
            />
          ) : (
            <TechnicalData
              inspection={inspection}
              hoveredBoxId={hoveredBoxId}
              highlightedBoxId={highlightedBoxId}
              onBoxHover={(boxId) => setHoveredBoxId(boxId)}
              onBoxSelect={(boxId) => setHighlightedBoxId(boxId)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
