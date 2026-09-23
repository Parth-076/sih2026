import { api } from "./api";
import { Pagination, Product, ProductFormValues } from "../types/product";

export async function fetchProducts(params: { search?: string; category?: string; page?: number }) {
  const res = await api.get<{ products: Product[]; pagination: Pagination }>("/products", {
    params,
  });
  return res.data;
}

export async function fetchCategories() {
  const res = await api.get<{ categories: string[] }>("/products/categories");
  return res.data.categories;
}

function toPayload(values: ProductFormValues) {
  return {
    productName: values.productName,
    brand: values.brand || undefined,
    manufacturer: values.manufacturer || undefined,
    productCategory: values.productCategory || undefined,
    barcode: values.barcode || undefined,
    netQuantity: values.netQuantity ? Number(values.netQuantity) : undefined,
    unit: values.unit || undefined,
    mrp: values.mrp ? Number(values.mrp) : undefined,
    countryOfOrigin: values.countryOfOrigin || undefined,
    manufacturingDate: values.manufacturingDate || undefined,
    bestBeforeOrExpiry: values.bestBeforeOrExpiry || undefined,
    consumerCare: values.consumerCare || undefined,
    batchNumber: values.batchNumber || undefined,
  };
}

export async function createProduct(values: ProductFormValues) {
  const res = await api.post<{ product: Product }>("/products", toPayload(values));
  return res.data.product;
}

export async function updateProduct(id: string, values: ProductFormValues) {
  const res = await api.put<{ product: Product }>(`/products/${id}`, toPayload(values));
  return res.data.product;
}

export async function deleteProduct(id: string) {
  await api.delete(`/products/${id}`);
}
