// src/api.ts

const API_BASE_URL = "http://127.0.0.1:8000/api";

export interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number | null;
  unit_price: number | null;
  tax_amount: number | null;
  total: number | null;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  vendor: string;
  vendor_address: string | null;

  invoice_date: string | null;
  due_date: string | null;

  currency: string;

  subtotal: number | null;
  tax_amount: number | null;
  amount: number;

  po_number: string | null;
  tax_id: string | null;
  payment_terms: string | null;

  status: string;
  risk: string;
  confidence: number;

  s3_key: string | null;
  extracted_text: string | null;

  extraction_status: string;
  extraction_confidence: number;

  created_at: string | null;
  updated_at: string | null;

  line_items: InvoiceLineItem[];
}

export interface DashboardSummary {
  total_invoices: number;
  pending_approval: number;
  approved: number;
  high_risk: number;
}

export interface UploadInvoiceResponse extends Invoice {}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((item: any) => item?.msg || JSON.stringify(item))
          .join(", ");
      }
    } catch {
      // Keep default message if response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  return handleResponse<{
    status: string;
    service: string;
  }>(response);
}

export async function getInvoices(): Promise<Invoice[]> {
  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<Invoice[]>(response);
}

export async function getInvoice(
  invoiceId: number,
): Promise<Invoice> {
  const response = await fetch(
    `${API_BASE_URL}/invoices/${invoiceId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  return handleResponse<Invoice>(response);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/summary`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  return handleResponse<DashboardSummary>(response);
}

export async function uploadInvoice(
  file: File,
  vendor = "",
  amount = 0,
): Promise<UploadInvoiceResponse> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("vendor", vendor);
  formData.append("amount", String(amount));

  const response = await fetch(
    `${API_BASE_URL}/invoices/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  return handleResponse<UploadInvoiceResponse>(response);
}