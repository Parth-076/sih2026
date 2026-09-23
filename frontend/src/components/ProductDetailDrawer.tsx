import { X } from "lucide-react";
import { Product } from "../types/product";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}

export default function ProductDetailDrawer({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const declarationEntries = Object.entries(product.declarations ?? {});

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-navy-800">{product.productName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Brand" value={product.brand} />
            <Field label="Manufacturer" value={product.manufacturer} />
            <Field label="Category" value={product.productCategory} />
            <Field label="Barcode" value={product.barcode} />
            <Field
              label="Net Quantity"
              value={product.netQuantity ? `${product.netQuantity} ${product.unit ?? ""}` : undefined}
            />
            <Field label="MRP" value={product.mrp ? `₹${product.mrp}` : undefined} />
            <Field label="Country of Origin" value={product.countryOfOrigin} />
            <Field label="Batch Number" value={product.batchNumber} />
            <Field
              label="Manufacturing Date"
              value={product.manufacturingDate ? product.manufacturingDate.slice(0, 10) : undefined}
            />
            <Field
              label="Best Before / Expiry"
              value={product.bestBeforeOrExpiry ? product.bestBeforeOrExpiry.slice(0, 10) : undefined}
            />
            <Field label="Consumer Care" value={product.consumerCare} />
          </div>

          {declarationEntries.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                Additional Declarations
              </p>
              <dl className="space-y-2">
                {declarationEntries.map(([key, value]) => (
                  <div key={key} className="rounded-md bg-slate-50 px-3 py-2">
                    <dt className="text-xs font-medium text-slate-500">{key}</dt>
                    <dd className="text-sm text-slate-700">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
