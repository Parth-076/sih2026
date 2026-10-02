import React, { useState } from 'react';
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function ImageViewer({
  image,
  boundingBoxes = [],
  highlightedBoxId,
  hoveredBoxId,
  onBoxHover,
  onBoxSelect
}) {
  const [showBoxes, setShowBoxes] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [localHoveredBox, setLocalHoveredBox] = useState(null);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-xs">
      {/* Top Controls Bar */}
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-800">{image?.name || 'product.jpg'}</span>
          <span className="font-mono text-[11px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
            {image?.resolution || '1280×720'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Show/Hide Boxes */}
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium border transition ${
              showBoxes
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showBoxes ? 'Hide Boxes' : 'Show Boxes'}</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-white border border-slate-200 rounded text-slate-600 overflow-hidden">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-slate-100 transition"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] font-medium min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-slate-100 transition"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleResetZoom}
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 rounded transition"
            title="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Image Display Viewport */}
      <div className="relative bg-slate-900/95 overflow-auto flex items-center justify-center min-h-[460px] max-h-[580px] p-4 select-none">
        <div
          className="relative inline-block transition-transform duration-150"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
        >
          <img
            src={image?.url || 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1280&q=80'}
            alt="Commodity Package"
            className="max-h-[480px] w-auto object-contain rounded shadow-lg select-none pointer-events-none"
          />

          {/* Bounding Boxes Layer */}
          {boundingBoxes.map((box) => {
            const isHovered = hoveredBoxId === box.id || localHoveredBox === box.id;
            const isSelected = highlightedBoxId === box.id;
            const isHighlighted = isHovered || isSelected;

            // Clean view by default: Only render if showBoxes is true or if box is hovered/selected
            if (!showBoxes && !isHighlighted) return null;

              const confNum =
                typeof box.confidence === 'number'
                  ? box.confidence <= 1
                    ? Math.round(box.confidence * 100)
                    : Math.round(box.confidence)
                  : 90;

              return (
                <div
                  key={box.id}
                  onClick={() => onBoxSelect && onBoxSelect(box.id)}
                  onMouseEnter={() => {
                    setLocalHoveredBox(box.id);
                    onBoxHover && onBoxHover(box.id);
                  }}
                  onMouseLeave={() => {
                    setLocalHoveredBox(null);
                    onBoxHover && onBoxHover(null);
                  }}
                  className={`absolute cursor-pointer transition-all duration-150 group ${
                    isHighlighted
                      ? 'border-2 border-amber-400 bg-amber-400/25 ring-2 ring-amber-300/70 z-30 shadow-lg'
                      : 'border border-blue-400/70 bg-blue-500/10 hover:bg-blue-500/25 hover:border-blue-300 z-10'
                  }`}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`
                  }}
                >
                  {/* Badge display exactly as in screenshot: Black container with Cyan text & Green Conf */}
                  <div
                    className={`absolute -top-7 left-0 px-2 py-0.5 text-[11px] font-mono font-bold rounded shadow-xl pointer-events-none transition-all duration-150 flex items-center space-x-1.5 whitespace-nowrap z-40 ${
                      isHighlighted
                        ? 'opacity-100 bg-[#0f172a] text-[#38bdf8] border border-cyan-400/50 ring-1 ring-cyan-400/30 scale-105'
                        : 'opacity-0 group-hover:opacity-100 bg-slate-900/90 text-white'
                    }`}
                  >
                    <span>{box.text || box.label}</span>
                    <span className="text-[#4ade80] font-mono text-[10px]">{confNum}%</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-slate-700">
            {image?.regionCount || boundingBoxes.length} regions (Clean view)
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Select evidence items to highlight
        </span>
      </div>
    </div>
  );
}
