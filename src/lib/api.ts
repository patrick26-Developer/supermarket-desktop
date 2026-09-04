/**
 * Client HTTP minimal vers l'API NestJS (supermarket-backend).
 * URL de base configurable via VITE_API_URL, sinon le port par défaut du
 * backend en dev local (voir supermarket-backend/.env : PORT=3000, API_PREFIX=api).
 */

import { getAccessToken } from "./auth-store";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
// Origine du backend, sans le préfixe `/api` — pour résoudre les chemins
// relatifs renvoyés par /uploads (ex. "/uploads/products/xxx.jpg") en URL
// absolue affichable dans un <img>.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

/** Résout un chemin d'image renvoyé par le backend (relatif ou URL externe déjà absolue). */
export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^(https?:)?\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

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

/**
 * Upload multipart séparé de `request()` : le navigateur doit fixer lui-même
 * l'en-tête `Content-Type` (avec la boundary du multipart), donc on ne peut
 * pas réutiliser le `Content-Type: application/json` fixé par `request()`.
 */
async function uploadFile<T>(path: string, file: File): Promise<T> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await res.json() : await res.text();

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
  avatarUrl?: string | null;
  roles: string[];
}

/** (resource, action) — reflète l'enum PermissionResource/PermissionAction du backend, gardé en string ici (pas d'enum dupliqué côté client). */
export interface Permission {
  resource: string;
  action: string;
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
  slug: string;
  description: string | null;
  categoryId: string | null;
  costPrice: string;
  taxRate: string;
  unitType: string;
  status: string;
  reorderLevel: string;
  minimumStock: string;
  imageUrl: string | null;
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
  soldAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  slug: string;
  description?: string;
  categoryId?: string;
  costPrice: number;
  taxRate: number;
  reorderLevel: number;
  minimumStock: number;
  status?: string;
  imageUrl?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  taxNumber: string | null;
  status: string;
}

export interface CreateSupplierInput {
  name: string;
  code: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  taxNumber?: string;
}

export interface PurchaseOrderItem {
  productId: string;
  quantity: string;
  unitCost: string;
  taxRate: string;
  subtotal: string;
}

export interface PurchaseOrder {
  id: string;
  storeId: string;
  supplierId: string;
  reference: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  createdAt: string;
  items?: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderInput {
  storeId: string;
  supplierId: string;
  items: { productId: string; quantity: number; unitCost: number; taxRate?: number }[];
}

export interface CreateGoodsReceiptInput {
  storeId: string;
  purchaseOrderId?: string;
  items: { productId: string; quantity: number; unitCost: number }[];
}

export interface Delivery {
  id: string;
  orderId: string;
  storeId: string;
  status: string;
  failureReason: string | null;
  deliveryFee: string;
  notes: string | null;
  scheduledAt: string | null;
  deliveredAt: string | null;
  createdAt?: string;
  statusHistory?: { id: string; status: string; createdAt: string; note: string | null }[];
}

export interface Customer {
  id: string;
  customerNo: string;
  type: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  status: string;
}

export interface CustomerAddress {
  id: string;
  label: string | null;
  recipient: string;
  phone: string | null;
  address: string;
  city: string;
  isDefault: boolean;
}

export interface CustomerDetail extends Customer {
  addresses: CustomerAddress[];
}

export interface CreateCustomerInput {
  storeId: string;
  type?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  status?: string;
}

export interface CreateCustomerAddressInput {
  label?: string;
  recipient: string;
  phone?: string;
  address: string;
  city: string;
  isDefault?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  storeId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  description: string | null;
  createdAt: string;
}

export interface SalesSummary {
  salesCount: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  averageBasket: number;
}

export interface StockValueItem {
  productId: string;
  sku: string | null;
  name: string | null;
  quantity: number;
  costPrice: number;
  value: number;
}

export interface StockValueReport {
  totalValue: number;
  items: StockValueItem[];
}

export interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  revenue: number;
}

export interface AppUser {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AppUserDetail extends AppUser {
  roles: { role: { code: string; name: string } }[];
}

export interface CreateUserInput {
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  roles?: string[];
}

export interface Role {
  id: string;
  code: string;
  name: string;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  auth: {
    /** Profil complet de l'utilisateur connecté — GET /auth/me ne renvoie que le payload JWT. */
    profile: () => request<AppUserDetail>("/auth/me/profile"),
    updateProfile: (input: Partial<{ firstName: string; lastName: string; phone: string; avatarUrl: string }>) =>
      request<AppUserDetail>("/auth/me", { method: "PUT", body: JSON.stringify(input) }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ success: true }>("/auth/me/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    /** Permissions effectives (resource, action) du rôle de l'utilisateur connecté. */
    permissions: () => request<Permission[]>("/auth/me/permissions"),
  },

  products: {
    search: (query: string) =>
      request<Product[]>(`/products?search=${encodeURIComponent(query)}`),
    create: (input: CreateProductInput) =>
      request<Product>("/products", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<CreateProductInput>) =>
      request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<void>(`/products/${id}`, { method: "DELETE" }),
  },

  uploads: {
    productImage: (file: File) => uploadFile<{ url: string }>("/uploads/product-image", file),
    avatar: (file: File) => uploadFile<{ url: string }>("/uploads/avatar", file),
  },

  categories: {
    list: () => request<Category[]>("/categories"),
    create: (input: { name: string; slug: string }) =>
      request<Category>("/categories", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<{ name: string; slug: string }>) =>
      request<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<void>(`/categories/${id}`, { method: "DELETE" }),
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
    list: (storeId?: string) => request<Sale[]>(`/sales${storeId ? `?storeId=${storeId}` : ""}`),
    create: (input: CreateSaleInput) =>
      request<Sale>("/sales", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },

  suppliers: {
    list: () => request<Supplier[]>("/suppliers"),
    create: (input: CreateSupplierInput) =>
      request<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<CreateSupplierInput> & { status?: string }) =>
      request<Supplier>(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<void>(`/suppliers/${id}`, { method: "DELETE" }),
  },

  purchaseOrders: {
    list: (storeId?: string) =>
      request<PurchaseOrder[]>(`/purchase-orders${storeId ? `?storeId=${storeId}` : ""}`),
    findOne: (id: string) => request<PurchaseOrder>(`/purchase-orders/${id}`),
    create: (input: CreatePurchaseOrderInput) =>
      request<PurchaseOrder>("/purchase-orders", { method: "POST", body: JSON.stringify(input) }),
    submit: (id: string) => request<PurchaseOrder>(`/purchase-orders/${id}/submit`, { method: "POST" }),
    approve: (id: string) => request<PurchaseOrder>(`/purchase-orders/${id}/approve`, { method: "POST" }),
    cancel: (id: string) => request<PurchaseOrder>(`/purchase-orders/${id}/cancel`, { method: "POST" }),
  },

  goodsReceipts: {
    create: (input: CreateGoodsReceiptInput) =>
      request("/goods-receipts", { method: "POST", body: JSON.stringify(input) }),
  },

  deliveries: {
    list: (storeId?: string) => request<Delivery[]>(`/deliveries${storeId ? `?storeId=${storeId}` : ""}`),
    findOne: (id: string) => request<Delivery>(`/deliveries/${id}`),
    updateStatus: (id: string, status: string, failureReason?: string) =>
      request<Delivery>(`/deliveries/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status, failureReason }),
      }),
  },

  customers: {
    list: (storeId: string) => request<Customer[]>(`/customers?storeId=${storeId}`),
    findOne: (id: string) => request<CustomerDetail>(`/customers/${id}`),
    create: (input: CreateCustomerInput) =>
      request<Customer>("/customers", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<CreateCustomerInput>) =>
      request<Customer>(`/customers/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    addAddress: (id: string, input: CreateCustomerAddressInput) =>
      request<CustomerDetail>(`/customers/${id}/addresses`, { method: "POST", body: JSON.stringify(input) }),
    removeAddress: (id: string, addressId: string) =>
      request<void>(`/customers/${id}/addresses/${addressId}`, { method: "DELETE" }),
  },

  users: {
    list: () => request<AppUser[]>("/users"),
    findOne: (id: string) => request<AppUserDetail>(`/users/${id}`),
    create: (input: CreateUserInput) =>
      request<AppUserDetail>("/users", { method: "POST", body: JSON.stringify(input) }),
    update: (
      id: string,
      input: Partial<{ firstName: string; lastName: string; phone: string; avatarUrl: string; status: string }>,
    ) => request<AppUserDetail>(`/users/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    resetPassword: (id: string, newPassword: string) =>
      request<{ success: true }>(`/users/${id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      }),
    assignRole: (id: string, roleCode: string) =>
      request<AppUserDetail>(`/users/${id}/roles`, { method: "POST", body: JSON.stringify({ roleCode }) }),
    revokeRole: (id: string, roleCode: string) =>
      request<void>(`/users/${id}/roles/${roleCode}`, { method: "DELETE" }),
  },

  roles: {
    list: () => request<Role[]>("/roles"),
  },

  auditLogs: {
    list: (filters?: { action?: string; resource?: string; limit?: number }) => {
      const params = new URLSearchParams();
      if (filters?.action) params.set("action", filters.action);
      if (filters?.resource) params.set("resource", filters.resource);
      params.set("limit", String(filters?.limit ?? 100));
      return request<AuditLog[]>(`/audit-logs?${params.toString()}`);
    },
  },

  reports: {
    salesSummary: (storeId?: string) =>
      request<SalesSummary>(`/reports/sales-summary${storeId ? `?storeId=${storeId}` : ""}`),
    stockValue: (storeId?: string) =>
      request<StockValueReport>(`/reports/stock-value${storeId ? `?storeId=${storeId}` : ""}`),
    topProducts: (storeId?: string) =>
      request<TopProduct[]>(`/reports/top-products${storeId ? `?storeId=${storeId}` : ""}`),
  },
};
