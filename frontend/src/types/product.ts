export interface Product {
  _id: string;
  productName: string;
  brand?: string;
  manufacturer?: string;
  productCategory?: string;
  barcode?: string;
  netQuantity?: number;
  unit?: string;
  mrp?: number;
  countryOfOrigin?: string;
  manufacturingDate?: string;
  bestBeforeOrExpiry?: string;
  consumerCare?: string;
  batchNumber?: string;
  declarations?: Record<string, string>;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormValues {
  productName: string;
  brand: string;
  manufacturer: string;
  productCategory: string;
  barcode: string;
  netQuantity: string;
  unit: string;
  mrp: string;
  countryOfOrigin: string;
  manufacturingDate: string;
  bestBeforeOrExpiry: string;
  consumerCare: string;
  batchNumber: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
