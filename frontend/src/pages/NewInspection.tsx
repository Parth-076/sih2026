import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, PackageSearch, ScanLine } from "lucide-react";
import BarcodeScanner from "../components/BarcodeScanner";
import ImageUploadDropzone, { StagedImage } from "../components/ImageUploadDropzone";
import { createInspection, lookupProductByBarcode } from "../lib/inspectionsApi";
import { extractErrorMessage } from "../lib/api";
import { Product } from "../types/product";

export default function NewInspection() {
  const navigate = useNavigate();

  const [images, setImages] = useState<StagedImage[]>([]);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [barcodeMessage, setBarcodeMessage] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleBarcodeDetected(code: string) {
    setBarcode(code);
    setMatchedProduct(null);
    setBarcodeMessage(null);
    setLookingUp(true);
    try {
      const product = await lookupProductByBarcode(code);
      if (product) {
        setMatchedProduct(product);
      } else {
        // Exact fallback per brief §9 — continue with image-based inspection.
        setBarcodeMessage("Product ID detected but product was not found in repository.");
      }
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (images.length === 0) {
      setSubmitError("At least one package image is required to start an inspection.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createInspection({
        images: images.map((i) => i.file),
        barcode: barcode ?? undefined,
        productId: matchedProduct?._id,
      });
      navigate(`/inspections/${res.inspection._id}`, { replace: true });
    } catch (err) {
      setSubmitError(extractErrorMessage(err, "Could not start the inspection."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-navy-800">
        <ScanLine className="h-5 w-5 text-teal-600" />
        New Inspection
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Scan or enter a barcode to identify the product (optional), then upload package images to
        begin.
      </p>

      <div className="mt-6 space-y-6">
        <BarcodeScanner onDetected={handleBarcodeDetected} />

        {lookingUp && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Looking up product…
          </div>
        )}

        {matchedProduct && (
          <div className="flex items-start gap-3 rounded-lg border border-teal-200 bg-teal-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
            <div>
              <p className="text-sm font-medium text-teal-900">Product matched from repository</p>
              <p className="text-sm text-teal-800">
                {matchedProduct.productName}
                {matchedProduct.brand ? ` — ${matchedProduct.brand}` : ""}
              </p>
              <p className="mt-1 text-xs text-teal-700">
                Repository values (MRP, net quantity, etc.) will be used for cross-verification
                against what OCR reads off the package.
              </p>
            </div>
          </div>
        )}

        {barcodeMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <PackageSearch className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-amber-900">{barcodeMessage}</p>
              <p className="mt-1 text-xs text-amber-700">
                You can continue with an image-based inspection — declarations will be read
                directly from the package instead of cross-verified against a repository record.
              </p>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-navy-800">Package images</p>
          <ImageUploadDropzone images={images} onChange={setImages} />
        </div>

        {submitError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-critical">{submitError}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || images.length === 0}
          className="flex items-center gap-2 rounded-md bg-navy-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Starting inspection…" : "Start Inspection"}
        </button>
      </div>
    </div>
  );
}
