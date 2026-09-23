import { useEffect, useRef, useState } from "react";
import { Camera, ScanBarcode, X } from "lucide-react";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
}

// The Barcode Detection API (window.BarcodeDetector) is a real native
// browser capability (Chrome/Edge/Android WebView) — not something we can
// polyfill honestly without a lot more code, so where it isn't available we
// say so plainly and fall back to manual entry rather than faking a scan.
function isBarcodeDetectorSupported(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

export default function BarcodeScanner({ onDetected }: BarcodeScannerProps) {
  const [manualValue, setManualValue] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<number | null>(null);

  const supported = isBarcodeDetectorSupported();

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setCameraError(null);
    if (!supported) {
      setCameraError(
        "Live camera scanning isn't supported in this browser. Enter the barcode manually below."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const DetectorCtor = (window as any).BarcodeDetector;
      const detector = new DetectorCtor({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
      });

      detectIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const value = barcodes[0].rawValue as string;
            onDetected(value);
            setManualValue(value);
            stopCamera();
          }
        } catch {
          // Transient decode errors (e.g. frame not ready) are expected and
          // safely ignored — we just try again on the next tick.
        }
      }, 400);
    } catch {
      setCameraError("Could not access the camera. Check permissions, or enter the barcode manually.");
      stopCamera();
    }
  }

  function stopCamera() {
    if (detectIntervalRef.current) {
      window.clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualValue.trim()) {
      onDetected(manualValue.trim());
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-navy-800">
        <ScanBarcode className="h-4 w-4" />
        Barcode (optional)
      </div>

      {cameraOpen ? (
        <div className="relative overflow-hidden rounded-md bg-black">
          <video ref={videoRef} className="h-56 w-full object-cover" muted playsInline />
          <button
            type="button"
            onClick={stopCamera}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
            Point the camera at the barcode…
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-navy-300 hover:text-navy-700"
        >
          <Camera className="h-4 w-4" />
          Scan with camera
        </button>
      )}

      {cameraError && <p className="mb-3 text-xs text-warning">{cameraError}</p>}

      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder="Or enter barcode manually"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Look up
        </button>
      </form>
    </div>
  );
}
