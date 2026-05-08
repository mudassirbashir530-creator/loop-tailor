import { Customer, Worker, Order, DashboardStats } from './types';

export const mockCustomers: Customer[] = [
  { id: '1', name: 'Ahmed Ali', phone: '03001234567', totalOrders: 5, createdAt: '2023-01-15T10:00:00Z', address: 'Lahore, Pakistan' },
  { id: '2', name: 'Fatima Khan', phone: '03339876543', totalOrders: 2, createdAt: '2023-06-20T14:30:00Z' },
  { id: '3', name: 'Hassan Raza', phone: '03214567890', totalOrders: 12, createdAt: '2022-11-05T09:15:00Z', address: 'Karachi, Pakistan' },
  { id: '4', name: 'Ayesha Malik', phone: '03456789012', totalOrders: 1, createdAt: '2024-02-10T16:45:00Z' },
];

export const mockWorkers: Worker[] = [
  { id: 'w1', name: 'Usman Tailor', phone: '03001112222', activeOrders: 3 },
  { id: 'w2', name: 'Bilal Master', phone: '03334445555', activeOrders: 5 },
  { id: 'w3', name: 'Kamran Khan', phone: '03217778888', activeOrders: 1 },
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerId: '1',
    customerName: 'Ahmed Ali',
    customerPhone: '03001234567',
    workerId: 'w1',
    workerName: 'Usman Tailor',
    status: 'stitching',
    clothingType: 'Shalwar Kameez',
    measurements: { shoulder: '18', chest: '40', waist: '38', length: '40' },
    price: 4500,
    advancePayment: 2000,
    remainingPayment: 2500,
    deliveryDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ORD-002',
    customerId: '2',
    customerName: 'Fatima Khan',
    customerPhone: '03339876543',
    workerId: 'w2',
    workerName: 'Bilal Master',
    status: 'pending',
    clothingType: 'Kurta',
    measurements: { shoulder: '14', chest: '36', length: '38' },
    price: 3000,
    advancePayment: 0,
    remainingPayment: 3000,
    deliveryDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ORD-003',
    customerId: '3',
    customerName: 'Hassan Raza',
    customerPhone: '03214567890',
    workerId: 'w3',
    workerName: 'Kamran Khan',
    status: 'ready',
    clothingType: 'Pant-Coat 3 piece',
    measurements: { shoulder: '19', chest: '42' },
    price: 15000,
    advancePayment: 10000,
    remainingPayment: 5000,
    deliveryDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ORD-004',
    customerId: '4',
    customerName: 'Ayesha Malik',
    customerPhone: '03456789012',
    status: 'delivered',
    clothingType: 'Shalwar Kameez',
    measurements: { shoulder: '15', chest: '38' },
    price: 4000,
    advancePayment: 4000,
    remainingPayment: 0,
    deliveryDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'ORD-005',
    customerId: '1',
    customerName: 'Ahmed Ali',
    customerPhone: '03001234567',
    status: 'pending',
    clothingType: 'Waistcoat',
    measurements: { shoulder: '18', chest: '40' },
    price: 3500,
    advancePayment: 1000,
    remainingPayment: 2500,
    deliveryDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockDashboardStats: DashboardStats = {
  totalOrders: 45,
  pendingOrders: 12,
  completedToday: 3,
  revenue: 125000,
};
