import React, { useState, useRef } from 'react';
import { UploadCloud, Camera, Play, Star, Globe, Tag, Bookmark, Calendar, X, Loader2, Image as ImageIcon, Scale, CheckCircle2 } from 'lucide-react';
import { processInspectionImage } from '../services/ocrService';

export default function NewInspection({ onInspectionCreated }) {
  const [instructionText, setInstructionText] = useState('Extract manufacturer address, packer details, country of origin, and consumer care email.');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(1);
  const [processingProgress, setProcessingProgress] = useState(24);
  const [stageDescription, setStageDescription] = useState('Preparing package imagery & validating surface geometry...');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleChipClick = (text) => {
    setInstructionText(text);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newImages = files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`
      }));
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Webcam Capture Support
  const handleStartWebcam = async () => {
    try {
      setIsWebcamOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert("Unable to access camera: " + err.message);
      setIsWebcamOpen(false);
    }
  };

  const handleCaptureWebcam = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], `label_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const newImage = {
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`
        };
        setSelectedImages(prev => [...prev, newImage]);
        // Stop stream
        const stream = video.srcObject;
        if (stream) stream.getTracks().forEach(t => t.stop());
        setIsWebcamOpen(false);
      }, 'image/jpeg', 0.95);
    }
  };

  const handleCloseWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setIsWebcamOpen(false);
  };

  const handleStartInspection = async () => {
    if (selectedImages.length === 0) return;

    setIsProcessing(true);
    setProcessingStage(1);
    setProcessingProgress(20);
    setStageDescription('Preparing package imagery & validating surface geometry...');

    const timer1 = setTimeout(() => {
      setProcessingStage(2);
      setProcessingProgress(40);
      setStageDescription('Running OCR & declaration extraction via NVIDIA Nemotron OCR...');
    }, 700);

    const timer2 = setTimeout(() => {
      setProcessingStage(3);
      setProcessingProgress(60);
      setStageDescription('Executing Barcode & GS1 master product database lookup...');
    }, 1500);

    const timer3 = setTimeout(() => {
      setProcessingStage(4);
      setProcessingProgress(80);
      setStageDescription('Evaluating optical contrast, font legibility & readability (Rule 9)...');
    }, 2300);

    const timer4 = setTimeout(() => {
      setProcessingStage(5);
      setProcessingProgress(100);
      setStageDescription('Running statutory PCR 2011 compliance rule engine & compiling findings...');
    }, 3100);

    try {
      // Process the first uploaded package image alongside the UI progress sequence
      const primaryImage = selectedImages[0].file;
      const [inspectionRecord] = await Promise.all([
        processInspectionImage(primaryImage, instructionText),
        new Promise((resolve) => setTimeout(resolve, 3600))
      ]);
      onInspectionCreated(inspectionRecord);
    } catch (error) {
      console.error("Inspection error:", error);
      alert("Failed to analyze package label: " + error.message);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setIsProcessing(false);
    }
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackText && feedbackRating === 0) return;
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackText('');
      setFeedbackRating(0);
      setFeedbackSubmitted(false);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Page Title & Header matching screenshot */}
      <div className="space-y-1">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <Scale className="w-3.5 h-3.5 text-blue-600" />
          <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">New Package Inspection</h1>
        <p className="text-xs text-slate-500">
          Upload or capture label images to evaluate mandatory statutory declarations, unit sales pricing, manufacturer details, and net quantity compliance under PCR 2011.
        </p>
      </div>

      {/* Processing Animation Card */}
      {isProcessing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-full border-2 border-blue-700 border-t-transparent animate-spin shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Processing Label Inspection</h3>
                <p className="text-xs text-slate-500 mt-0.5">{stageDescription}</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
              {processingProgress}%
            </span>
          </div>

          {/* Deep navy progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#1e3a8a] h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            />
          </div>

          {/* 5 Step Flow Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
            <div
              className={`flex items-center space-x-2 py-2.5 px-2.5 rounded-xl border font-medium ${
                processingStage > 1
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : processingStage === 1
                  ? 'border-blue-200 bg-blue-50 text-blue-900 font-semibold'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {processingStage > 1 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : processingStage === 1 ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center shrink-0">1</span>
              )}
              <span className="truncate">1. Image Intake</span>
            </div>

            <div
              className={`flex items-center space-x-2 py-2.5 px-2.5 rounded-xl border font-medium ${
                processingStage > 2
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : processingStage === 2
                  ? 'border-blue-200 bg-blue-50 text-blue-900 font-semibold'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {processingStage > 2 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : processingStage === 2 ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center shrink-0">2</span>
              )}
              <span className="truncate">2. OCR Extraction</span>
            </div>

            <div
              className={`flex items-center space-x-2 py-2.5 px-2.5 rounded-xl border font-medium ${
                processingStage > 3
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : processingStage === 3
                  ? 'border-blue-200 bg-blue-50 text-blue-900 font-semibold'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {processingStage > 3 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : processingStage === 3 ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center shrink-0">3</span>
              )}
              <span className="truncate">3. Barcode / Lookup</span>
            </div>

            <div
              className={`flex items-center space-x-2 py-2.5 px-2.5 rounded-xl border font-medium ${
                processingStage > 4
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : processingStage === 4
                  ? 'border-blue-200 bg-blue-50 text-blue-900 font-semibold'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {processingStage > 4 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : processingStage === 4 ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center shrink-0">4</span>
              )}
              <span className="truncate">4. Readability (Rule 9)</span>
            </div>

            <div
              className={`flex items-center space-x-2 py-2.5 px-2.5 rounded-xl border font-medium ${
                processingStage >= 5
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {processingStage >= 5 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center shrink-0">5</span>
              )}
              <span className="truncate">5. Findings Ready</span>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
      />

      {/* Instructions & Prompt Parser */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="font-mono text-slate-700">Target: POST /api/instructions/parse</span>
          <span>Press Enter to queue ↵</span>
        </div>

        <div className="p-3">
          <textarea
            value={instructionText}
            onChange={(e) => setInstructionText(e.target.value)}
            rows={2}
            className="w-full text-xs font-mono text-slate-800 bg-transparent focus:outline-none resize-none"
            placeholder="Type extraction or legal compliance instructions..."
          />
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium text-[11px] shrink-0">Suggested:</span>

        <button
          onClick={() => handleChipClick('Mandatory PCR 2011 declarations')}
          className="flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full transition shrink-0"
        >
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          <span>Mandatory PCR 2011 declarations</span>
        </button>

        <button
          onClick={() => handleChipClick('Extract MRP & Net Quantity')}
          className="flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full transition shrink-0"
        >
          <Tag className="w-3.5 h-3.5 text-emerald-500" />
          <span>Extract MRP & Net Quantity</span>
        </button>

        <button
          onClick={() => handleChipClick('Manufacturer & Origin details')}
          className="flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full transition shrink-0"
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-500" />
          <span>Manufacturer & Origin details</span>
        </button>

        <button
          onClick={() => handleChipClick('Mfg date & Expiry')}
          className="flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full transition shrink-0"
        >
          <Calendar className="w-3.5 h-3.5 text-purple-500" />
          <span>Mfg date & Expiry</span>
        </button>
      </div>

      {/* Upload Zone Card */}
      <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-400 transition shadow-xs">
        <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-bold text-slate-900">Upload commodity label photos</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Drag & drop images here, or choose an input source below. Supports JPG, PNG, WEBP.
        </p>

        <div className="mt-5 flex items-center justify-center space-x-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#172554] text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload photo</span>
          </button>

          <button
            onClick={handleStartWebcam}
            className="flex items-center space-x-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Camera className="w-4 h-4 text-slate-600" />
            <span>Take photo</span>
          </button>
        </div>

        {/* Selected Images List */}
        {selectedImages.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative group bg-slate-50 border border-slate-200 rounded-lg p-2 overflow-hidden">
                <img src={img.previewUrl} alt={img.name} className="h-24 w-full object-cover rounded" />
                <div className="mt-1 truncate text-[11px] font-medium text-slate-800">{img.name}</div>
                <div className="text-[10px] text-slate-400">{img.size}</div>
                <button
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 transition"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webcam Modal */}
      {isWebcamOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl overflow-hidden max-w-lg w-full p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">Live Package Camera</h4>
              <button onClick={handleCloseWebcam} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <video ref={videoRef} className="w-full h-64 bg-black rounded-lg object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCloseWebcam}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCaptureWebcam}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action / Launch Bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-600">
          <span className={`w-2 h-2 rounded-full ${selectedImages.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <span>
            {selectedImages.length > 0
              ? `${selectedImages.length} label image(s) ready for inspection`
              : 'Add at least one label image to begin'}
          </span>
        </div>

        <button
          onClick={handleStartInspection}
          disabled={selectedImages.length === 0 || isProcessing}
          className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-bold text-xs transition shadow-md ${
            selectedImages.length > 0 && !isProcessing
              ? 'bg-[#1e3a8a] hover:bg-[#172554] text-white cursor-pointer ring-2 ring-blue-500/20'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing Declarations & Rules...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start Inspection</span>
            </>
          )}
        </button>
      </div>

      {/* Help Us Improve Label Check Feedback Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-slate-900">Help us improve Label Check</h4>
            <p className="text-[11px] text-slate-500">
              Your feedback helps us improve the legal metrology inspection experience.
            </p>
          </div>

          {/* Star Rating */}
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFeedbackRating(star)}
                className="text-slate-300 hover:text-amber-400 transition"
              >
                <Star
                  className={`w-4 h-4 ${
                    star <= feedbackRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleFeedbackSubmit} className="space-y-3">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={2}
            placeholder="Tell us about your experience..."
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-700"
          />

          <div className="flex items-center justify-between">
            {feedbackSubmitted && (
              <span className="text-xs text-emerald-600 font-semibold">
                ✓ Thank you for your feedback!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
