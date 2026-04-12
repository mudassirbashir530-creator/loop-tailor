import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isOrderOverdue } from './utils';

describe('isOrderOverdue', () => {
  beforeEach(() => {
    // Mock the system time so that tests relying on 'new Date()' have a consistent outcome
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return false if dueDate is not provided or empty', () => {
    expect(isOrderOverdue('')).toBe(false);
  });

  it('should return false if the date is invalid', () => {
    expect(isOrderOverdue('not-a-date')).toBe(false);
  });

  it('should return true when current date is strictly greater than the due date (ignoring time)', () => {
    // Current date is 2024-05-15
    expect(isOrderOverdue('2024-05-14T00:00:00Z')).toBe(true);
    expect(isOrderOverdue('2020-01-01')).toBe(true);
  });

  it('should return false when current date is exactly the due date', () => {
    // Current date is 2024-05-15
    expect(isOrderOverdue('2024-05-15T00:00:00Z')).toBe(false);
    expect(isOrderOverdue('2024-05-15')).toBe(false);
  });

  it('should return false when due date is in the future', () => {
    // Current date is 2024-05-15
    expect(isOrderOverdue('2024-05-16T00:00:00Z')).toBe(false);
    expect(isOrderOverdue('2025-01-01')).toBe(false);
  });

  it('should allow providing a custom currentDate', () => {
    const customCurrentDate = new Date('2023-10-10T12:00:00Z');

    // With custom date 2023-10-10, due date 2023-10-09 is overdue
    expect(isOrderOverdue('2023-10-09T00:00:00Z', customCurrentDate)).toBe(true);

    // With custom date 2023-10-10, due date 2023-10-10 is not overdue
    expect(isOrderOverdue('2023-10-10T00:00:00Z', customCurrentDate)).toBe(false);

    // With custom date 2023-10-10, due date 2023-10-11 is not overdue
    expect(isOrderOverdue('2023-10-11T00:00:00Z', customCurrentDate)).toBe(false);
  });

  it('should handle different timezones correctly without failing due to timezone offsets', () => {
    // Create a scenario where local timezone might shift the day if not normalized
    // If due date is "2024-05-15T23:59:59-08:00", in UTC it is "2024-05-16T07:59:59Z"
    // Our system time is 2024-05-15T12:00:00Z.
    // In UTC: due date is 2024-05-16, current is 2024-05-15. Not overdue.
    expect(isOrderOverdue('2024-05-15T23:59:59-08:00')).toBe(false);

    // If due date is "2024-05-14T01:00:00+08:00", in UTC it is "2024-05-13T17:00:00Z"
    // In UTC: due date is 2024-05-13, current is 2024-05-15. Overdue.
    expect(isOrderOverdue('2024-05-14T01:00:00+08:00')).toBe(true);
  });
});
