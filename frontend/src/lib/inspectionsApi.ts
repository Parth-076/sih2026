import { api } from "./api";
import { CreateInspectionResponse } from "../types/inspection";
import { Inspection } from "../types/inspection";
import { Product } from "../types/product";

interface CreateInspectionArgs {
  images: File[];
  barcode?: string;
  productId?: string;
}

export async function createInspection({ images, barcode, productId }: CreateInspectionArgs) {
  const formData = new FormData();
  images.forEach((file) => formData.append("images", file));
  if (barcode) formData.append("barcode", barcode);
  if (productId) formData.append("productId", productId);

  const res = await api.post<CreateInspectionResponse>("/inspections", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function lookupProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const res = await api.get<{ product: Product }>(`/products/barcode/${encodeURIComponent(barcode)}`);
    return res.data.product;
  } catch {
    return null;
  }
}

export async function fetchInspection(id: string): Promise<Inspection> {
  const res = await api.get<{ inspection: Inspection }>(`/inspections/${id}`);
  return res.data.inspection;
}

export async function analyzeInspection(id: string): Promise<Inspection> {
  const res = await api.post<{ inspection: Inspection }>(`/inspections/${id}/analyze`);
  return res.data.inspection;
}

export async function downloadReportFile(id: string, inspectionCode: string, inline = false) {
  const res = await api.get(`/inspections/${id}/report${inline ? "?inline=true" : ""}`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  if (inline) {
    window.open(url, "_blank");
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = `LabelCheck-Report-${inspectionCode}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
}

export interface InspectionFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  product?: string;
  inspector?: string;
  category?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface InspectionsListResponse {
  success: boolean;
  inspections: Inspection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function fetchInspectionsList(
  params: InspectionFilterParams = {}
): Promise<InspectionsListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.append(key, String(value));
    }
  });
  const res = await api.get<InspectionsListResponse>(`/inspections?${query.toString()}`);
  return res.data;
}

export async function reviewFindingApi(
  inspectionId: string,
  findingIdOrIndex: string | number,
  action: "confirm" | "reject" | "mark-for-review",
  comment?: string
): Promise<{ success: boolean; finding: any; inspection: Inspection }> {
  const res = await api.patch<{ success: boolean; finding: any; inspection: Inspection }>(
    `/inspections/${inspectionId}/findings/${findingIdOrIndex}/review`,
    { action, comment }
  );
  return res.data;
}

export async function finalizeReviewApi(
  inspectionId: string,
  finalStatus: string
): Promise<{ success: boolean; inspection: Inspection }> {
  const res = await api.post<{ success: boolean; inspection: Inspection }>(
    `/inspections/${inspectionId}/review`,
    { finalStatus }
  );
  return res.data;
}



