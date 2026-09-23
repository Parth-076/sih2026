import { FormEvent, useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Product, ProductFormValues } from "../types/product";
import { createProduct, updateProduct } from "../lib/productsApi";
import { extractErrorMessage } from "../lib/api";

const EMPTY_FORM: ProductFormValues = {
  productName: "",
  brand: "",
  manufacturer: "",
  productCategory: "",
  barcode: "",
  netQuantity: "",
  unit: "",
  mrp: "",
  countryOfOrigin: "",
  manufacturingDate: "",
  bestBeforeOrExpiry: "",
  consumerCare: "",
  batchNumber: "",
};

function toFormValues(product: Product): ProductFormValues {
  return {
    productName: product.productName ?? "",
    brand: product.brand ?? "",
    manufacturer: product.manufacturer ?? "",
    productCategory: product.productCategory ?? "",
    barcode: product.barcode ?? "",
    netQuantity: product.netQuantity?.toString() ?? "",
    unit: product.unit ?? "",
    mrp: product.mrp?.toString() ?? "",
    countryOfOrigin: product.countryOfOrigin ?? "",
    manufacturingDate: product.manufacturingDate ? product.manufacturingDate.slice(0, 10) : "",
    bestBeforeOrExpiry: product.bestBeforeOrExpiry ? product.bestBeforeOrExpiry.slice(0, 10) : "",
    consumerCare: product.consumerCare ?? "",
    batchNumber: product.batchNumber ?? "",
  };
}

interface ProductFormModalProps {
  product: Product | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

const FIELDS: { key: keyof ProductFormValues; label: string; required?: boolean; type?: string }[] = [
  { key: "productName", label: "Product Name", required: true },
  { key: "brand", label: "Brand" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "productCategory", label: "Category" },
  { key: "barcode", label: "Barcode" },
  { key: "netQuantity", label: "Net Quantity", type: "number" },
  { key: "unit", label: "Unit (g, kg, ml, l…)" },
  { key: "mrp", label: "MRP (₹)", type: "number" },
  { key: "countryOfOrigin", label: "Country of Origin" },
  { key: "manufacturingDate", label: "Manufacturing Date", type: "date" },
  { key: "bestBeforeOrExpiry", label: "Best Before / Expiry", type: "date" },
  { key: "consumerCare", label: "Consumer Care" },
  { key: "batchNumber", label: "Batch Number" },
];

export default function ProductFormModal({ product, onClose, onSaved }: ProductFormModalProps) {
  const [values, setValues] = useState<ProductFormValues>(
    product ? toFormValues(product) : EMPTY_FORM
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValues(product ? toFormValues(product) : EMPTY_FORM);
  }, [product]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (product) {
        await updateProduct(product._id, values);
      } else {
        await createProduct(values);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not save product."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-navy-800">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
          {FIELDS.map(({ key, label, required, type }) => (
            <div key={key} className={key === "productName" ? "sm:col-span-2" : ""}>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {label}
                {required && <span className="text-critical"> *</span>}
              </label>
              <input
                type={type ?? "text"}
                required={required}
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
          ))}

          {error && (
            <div className="sm:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-critical">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-md bg-navy-700 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {product ? "Save changes" : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
