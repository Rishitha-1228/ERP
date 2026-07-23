export type Role = "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;

  customerType: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";

  address?: string | null;

  status: "LEAD" | "ACTIVE" | "INACTIVE";

  followUpDate?: string | null;

  notes?: string | null;

  createdByName?: string;

  createdAt: string;

  followUpNotes?: FollowUpNote[];

  totalBilled?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  payments?: Payment[];
}

export interface FollowUpNote {
  id: string;
  note: string;
  createdByName?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  note?: string | null;
  createdByName?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  warehouse?: string | null;
  unitPrice: string | number;
  currentStock: number;
  minStockAlert: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  movementType: "IN" | "OUT" | "ADJUST";
  reason: string;
  createdByName?: string;
  createdAt: string;
}

export interface ChallanItem {
  id?: string;
  productId: string;
  productName?: string;
  productSku?: string;
  unitPrice?: string | number;
  quantity: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerName?: string;
  customerMobile?: string;
  totalQuantity: number;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  items: ChallanItem[];
  createdByName?: string;
  createdAt: string;
}

export interface DashboardCard {
  label: string;
  value: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}