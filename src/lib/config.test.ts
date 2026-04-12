import { describe, it, expect } from 'vitest';
import { ORDER_STATUS, isValidStatusTransition } from './config';

describe('isValidStatusTransition', () => {
  it('should allow valid forward transitions from PENDING', () => {
    expect(isValidStatusTransition(ORDER_STATUS.PENDING, ORDER_STATUS.STITCHING)).toBe(true);
    expect(isValidStatusTransition(ORDER_STATUS.PENDING, ORDER_STATUS.READY)).toBe(true);
    expect(isValidStatusTransition(ORDER_STATUS.PENDING, ORDER_STATUS.DELIVERED)).toBe(true);
  });

  it('should allow valid forward transitions from STITCHING', () => {
    expect(isValidStatusTransition(ORDER_STATUS.STITCHING, ORDER_STATUS.READY)).toBe(true);
    expect(isValidStatusTransition(ORDER_STATUS.STITCHING, ORDER_STATUS.DELIVERED)).toBe(true);
  });

  it('should allow valid forward transitions from READY', () => {
    expect(isValidStatusTransition(ORDER_STATUS.READY, ORDER_STATUS.DELIVERED)).toBe(true);
  });

  it('should not allow transitions from DELIVERED', () => {
    expect(isValidStatusTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.PENDING)).toBe(false);
    expect(isValidStatusTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.STITCHING)).toBe(false);
    expect(isValidStatusTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.READY)).toBe(false);
  });

  it('should allow transitioning to the same status (self-transition)', () => {
    expect(isValidStatusTransition(ORDER_STATUS.PENDING, ORDER_STATUS.PENDING)).toBe(true);
    expect(isValidStatusTransition(ORDER_STATUS.STITCHING, ORDER_STATUS.STITCHING)).toBe(true);
    expect(isValidStatusTransition(ORDER_STATUS.READY, ORDER_STATUS.READY)).toBe(true);
    expect(isValidStatusTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.DELIVERED)).toBe(true);
  });

  it('should not allow backward transitions', () => {
    expect(isValidStatusTransition(ORDER_STATUS.STITCHING, ORDER_STATUS.PENDING)).toBe(false);
    expect(isValidStatusTransition(ORDER_STATUS.READY, ORDER_STATUS.PENDING)).toBe(false);
    expect(isValidStatusTransition(ORDER_STATUS.READY, ORDER_STATUS.STITCHING)).toBe(false);
  });
});
