import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { deleteProduct, fetchProducts } from "../lib/productsApi";
import { extractErrorMessage } from "../lib/api";
import { Product } from "../types/product";
import ProductFormModal from "../components/ProductFormModal";
import ProductDetailDrawer from "../components/ProductDetailDrawer";

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const load = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts({ search: searchTerm || undefined });
      setProducts(data.products);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load products."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    load(search);
  }

  function openCreate() {
    setEditingProduct(null);
    setShowForm(true);
  }

  function openEdit(product: Product, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingProduct(product);
    setShowForm(true);
  }

  async function handleDelete(product: Product, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${product.productName}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product._id);
      load(search);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not delete product."));
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-navy-800">Product Repository</h1>
          <p className="mt-1 text-sm text-slate-500">
            Reference product data used for barcode lookup and compliance cross-verification.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-md bg-navy-700 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        )}
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-4 flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, manufacturer…"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-critical">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Barcode</th>
              <th className="px-4 py-3">Net Qty</th>
              <th className="px-4 py-3">MRP</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Loading products…
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  <Package className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  No products found.
                </td>
              </tr>
            )}
            {!loading &&
              products.map((product) => (
                <tr
                  key={product._id}
                  onClick={() => setViewingProduct(product)}
                  className="cursor-pointer transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-navy-800">{product.productName}</td>
                  <td className="px-4 py-3 text-slate-600">{product.brand ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{product.productCategory ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {product.barcode ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {product.netQuantity ? `${product.netQuantity} ${product.unit ?? ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.mrp ? `₹${product.mrp}` : "—"}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={(e) => openEdit(product, e)}
                          className="text-slate-400 hover:text-navy-700"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(product, e)}
                          className="text-slate-400 hover:text-critical"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load(search);
          }}
        />
      )}

      {viewingProduct && (
        <ProductDetailDrawer product={viewingProduct} onClose={() => setViewingProduct(null)} />
      )}
    </div>
  );
}
