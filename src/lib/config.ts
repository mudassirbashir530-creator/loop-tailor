export const APP_CONFIG = {
  defaultCurrency: 'PKR',
};

export const ORDER_STATUS = {
  PENDING: 'Pending',
  CUTTING: 'Cutting',
  STITCHING: 'Stitching',
  QC: 'Quality Check',
  READY: 'Ready',
  DELIVERED: 'Delivered'
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CUTTING, ORDER_STATUS.STITCHING, ORDER_STATUS.READY, ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.CUTTING]: [ORDER_STATUS.STITCHING, ORDER_STATUS.READY, ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.STITCHING]: [ORDER_STATUS.QC, ORDER_STATUS.READY, ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.QC]: [ORDER_STATUS.READY, ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: []
};

export function isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  if (currentStatus === newStatus) return true;
  return ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}
