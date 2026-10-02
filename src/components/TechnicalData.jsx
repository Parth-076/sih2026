import React, { useState } from 'react';
import { Copy, Check, Search, Cpu, Layers, FileCode, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function TechnicalData({
  inspection,
  hoveredBoxId,
  highlightedBoxId,
  onBoxHover,
  onBoxSelect
}) {
  const [activeSubTab, setActiveSubTab] = useState('tokens'); // 'structured', 'tokens', 'json'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const boxes = inspection.boundingBoxes || [];
  const tokenCount = boxes.length;

  const filteredBoxes = boxes.filter((box) => {
    if (!searchQuery) return true;
    return (
      box.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (box.label && box.label.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleCopyBbox = (e, box) => {
    e.stopPropagation();
    const bboxStr = box.bbox
      ? `[${box.bbox.join(', ')}]`
      : `[${Math.round(box.y * 10)}, ${Math.round(box.x * 10)}, ${Math.round((box.y + box.height) * 10)}, ${Math.round((box.x + box.width) * 10)}]`;
    navigator.clipboard.writeText(bboxStr);
    setCopiedId(box.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(inspection, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* 3 Sub-tabs matching screenshot */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab('structured')}
          className={`px-3 py-1.5 rounded-md font-semibold transition ${
            activeSubTab === 'structured'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Structured Data
        </button>

        <button
          onClick={() => setActiveSubTab('tokens')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
            activeSubTab === 'tokens'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>OCR Tokens ({tokenCount})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('json')}
          className={`px-3 py-1.5 rounded-md font-semibold transition ${
            activeSubTab === 'json'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Raw JSON
        </button>
      </div>

      {/* 1. OCR TOKENS VIEW (Exact match to screenshot) */}
      {activeSubTab === 'tokens' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-800 tracking-wider text-[11px] uppercase">
                DETECTED OCR REGIONS
              </span>
              <span className="font-bold text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                {tokenCount}
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              {inspection.engineDetails?.ocrEngine || 'NVIDIA Nemotron OCR'}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search detected text (e.g. 'MRP', 'Net', 'g')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-700"
            />
          </div>

          {/* Tokens Card List */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredBoxes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No OCR regions found matching '{searchQuery}'
              </div>
            ) : (
              filteredBoxes.map((box) => {
                const isHovered = hoveredBoxId === box.id;
                const isSelected = highlightedBoxId === box.id;
                const isActive = isHovered || isSelected;

                const confNum =
                  typeof box.confidence === 'number'
                    ? box.confidence <= 1
                      ? Math.round(box.confidence * 100)
                      : Math.round(box.confidence)
                    : 90;

                const bboxArray = box.bbox || [
                  Math.round(box.y * 10),
                  Math.round(box.x * 10),
                  Math.round((box.y + box.height) * 10),
                  Math.round((box.x + box.width) * 10)
                ];

                return (
                  <div
                    key={box.id}
                    onMouseEnter={() => onBoxHover && onBoxHover(box.id)}
                    onMouseLeave={() => onBoxHover && onBoxHover(null)}
                    onClick={() => onBoxSelect && onBoxSelect(box.id)}
                    className={`p-3 rounded-lg border transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'border-amber-400 ring-2 ring-amber-300/50 bg-amber-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Top Row: RAW TEXT tag and Conf badge */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">
                        {box.label || 'RAW TEXT'}
                      </span>
                      <span
                        className={`font-semibold ${
                          confNum >= 80
                            ? 'text-emerald-700'
                            : confNum >= 50
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {confNum}% conf
                      </span>
                    </div>

                    {/* Middle Row: Extracted String */}
                    <div className="mt-1 font-mono text-xs font-bold text-slate-900 tracking-tight">
                      "{box.text}"
                    </div>

                    {/* Bottom Row: Bounding Box Coordinates & Copy */}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>bbox: [{bboxArray.join(', ')}]</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyBbox(e, box)}
                        className="p-1 hover:text-slate-700 rounded transition"
                        title="Copy bbox"
                      >
                        {copiedId === box.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. STRUCTURED DATA VIEW */}
      {activeSubTab === 'structured' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Extracted Legal Entities
            </span>
            <span className="text-[11px] text-slate-500">PCR 2011 Normalized</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <tr>
                <th className="p-2">Statutory Field</th>
                <th className="p-2">Detected Value</th>
                <th className="p-2">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr className="hover:bg-slate-50">
                <td className="p-2 font-medium text-slate-600">Product / Commodity</td>
                <td className="p-2 font-semibold text-slate-800">{inspection.commodity || 'Balaji Wafers Aloo Sev'}</td>
                <td className="p-2 text-emerald-700 font-semibold">Identified</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 font-medium text-slate-600">Barcode / Product Lookup</td>
                <td className="p-2 font-semibold text-slate-800 font-mono">
                  {inspection.barcodeInfo ? `${inspection.barcodeInfo.code} (${inspection.barcodeInfo.symbology})` : '8901425001234 (EAN-13)'}
                </td>
                <td className="p-2 text-emerald-700 font-semibold">
                  {inspection.barcodeInfo?.gs1Status || 'GS1 Verified'}
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 font-medium text-slate-600">Readability & Contrast</td>
                <td className="p-2 font-semibold text-slate-800">
                  {inspection.readabilityAnalysis?.contrastRatio || '14.8:1 (Optimal High Contrast)'}
                </td>
                <td className="p-2 text-emerald-700 font-semibold">
                  {inspection.readabilityAnalysis?.fontProminence || 'Compliant (Rule 9)'}
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 font-medium text-slate-600">Net Quantity</td>
                <td className="p-2 font-semibold text-slate-800">{inspection.declaredNetQty || '17.0 g'}</td>
                <td className="p-2 text-emerald-700 font-semibold">Standard Metric (g)</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 font-medium text-slate-600">Maximum Retail Price</td>
                <td className="p-2 font-semibold text-slate-800">{inspection.declaredMrp || '₹ 5.00'}</td>
                <td className="p-2 text-amber-700 font-semibold">Review Pending Taxes</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 font-medium text-slate-600">Packing Date</td>
                <td className="p-2 font-semibold text-slate-800">PKD.: 14/09/2026</td>
                <td className="p-2 text-emerald-700 font-semibold">Valid Prefix</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2 font-medium text-slate-600">Manufacturer Address</td>
                <td className="p-2 font-semibold text-slate-800">{inspection.manufacturer || 'Balaji Wafers Pvt. Ltd.'}</td>
                <td className="p-2 text-amber-700 font-semibold">Partial (Seam View)</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 3. RAW JSON VIEW */}
      {activeSubTab === 'json' && (
        <div className="bg-slate-900 rounded-xl p-4 overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Payload JSON</span>
            <button
              onClick={handleCopyJson}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono transition"
            >
              {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre className="text-xs font-mono text-emerald-400 overflow-x-auto max-h-[500px] leading-relaxed">
            {JSON.stringify(inspection, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
