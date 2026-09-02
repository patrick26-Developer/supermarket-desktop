/**
 * Client HTTP minimal vers l'API NestJS (supermarket-backend).
 * URL de base configurable via VITE_API_URL, sinon le port par défaut du
 * backend en dev local (voir supermarket-backend/.env : PORT=3000, API_PREFIX=api).
 */

import { getAccessToken } from "./auth-store";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  const body =
    res.status === 204
      ? null
      : contentType.includes("application/json")
        ? await res.json()
        : await res.text();

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? Array.isArray((body as { message: unknown }).message)
          ? (body as { message: string[] }).message.join(", ")
          : String((body as { message: unknown }).message)
        : `Erreur HTTP ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return body as T;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  costPrice: string;
  taxRate: string;
  unitType: string;
  status: string;
}

export interface StockLevel {
  storeId: string;
  productId: string;
  quantity: string;
  reservedQty: string;
  availableQty: string;
}

export interface CashRegister {
  id: string;
  storeId: string;
  code: string;
  name: string;
  status: string;
}

export interface CashierSession {
  id: string;
  cashRegisterId: string;
  cashierId: string;
  status: string;
  openingAmount: string;
  expectedAmount: string;
  actualAmount: string | null;
  openedAt: string;
  closedAt: string | null;
}

export interface SaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface SalePaymentInput {
  method: string;
  amount: number;
  forceFailure?: boolean;
}

export interface CreateSaleInput {
  storeId: string;
  sessionId: string;
  items: SaleItemInput[];
  payments: SalePaymentInput[];
}

export interface Sale {
  id: string;
  orderId: string;
  reference: string;
  totalAmount: string;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  products: {
    search: (query: string) =>
      request<Product[]>(`/products?search=${encodeURIComponent(query)}`),
  },

  stock: {
    listByStore: (storeId: string) => request<StockLevel[]>(`/stock?storeId=${storeId}`),
  },

  cashRegisters: {
    list: () => request<CashRegister[]>("/cash-registers"),
  },

  cashSessions: {
    findOpen: (cashRegisterId: string) =>
      request<CashierSession[]>(`/cash-sessions?status=OPEN&cashRegisterId=${cashRegisterId}`),
    open: (cashRegisterId: string, openingAmount: number) =>
      request<CashierSession>("/cash-sessions/open", {
        method: "POST",
        body: JSON.stringify({ cashRegisterId, openingAmount }),
      }),
    close: (id: string, actualAmount: number) =>
      request<CashierSession>(`/cash-sessions/${id}/close`, {
        method: "POST",
        body: JSON.stringify({ actualAmount }),
      }),
  },

  sales: {
    create: (input: CreateSaleInput) =>
      request<Sale>("/sales", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
};
