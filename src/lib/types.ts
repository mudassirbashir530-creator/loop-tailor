export interface CloudinaryImage {
  url: string;
  publicId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsappPhone?: string;
  countryCode?: string;
  address?: string;
  gender?: string;
  notes?: string;
  profileImage?: string | CloudinaryImage;
  totalOrders: number;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export type WorkerRole = 'tailor' | 'master' | 'helper' | 'cutter' | 'embroidery' | 'other';
export type WorkerStatus = 'available' | 'busy' | 'on_leave' | 'offline';
export type SalaryType = 'monthly' | 'per_order';

export interface Worker {
  id: string;
  name: string;
  phone: string;
  whatsappPhone?: string;
  countryCode?: string;
  role: WorkerRole;
  salaryType: SalaryType;
  salaryAmount: number;
  speciality?: string;
  address?: string;
  notes?: string;
  joiningDate: string;
  profileImage?: string | CloudinaryImage;
  status: WorkerStatus;
  activeOrders: number;
  completedOrders: number;
  totalEarnings?: number;
  userId: string;
  createdAt: string;
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
  referenceImages?: CloudinaryImage[];
  designImages?: CloudinaryImage[];
  referencePhotoUrl?: string;
  sampleDesignUrl?: string;
  invoiceImage?: string | CloudinaryImage;
  designNotes?: string;
  price: number;
  advancePayment: number;
  remainingPayment: number;
  deliveryDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedToday: number;
  revenue: number;
}
