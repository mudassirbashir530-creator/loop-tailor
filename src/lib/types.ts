export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalOrders: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  activeOrders: number;
}

export type OrderStatus = "pending" | "stitching" | "ready" | "delivered";

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  workerId?: string;
  workerName?: string;
  status: OrderStatus;
  clothingType: string;
  measurements: Record<string, string>;
  images?: string[];
  designNotes?: string;
  price: number;
  advancePayment: number;
  remainingPayment: number;
  deliveryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedToday: number;
  revenue: number;
}
