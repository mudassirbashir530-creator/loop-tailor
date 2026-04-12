import { describe, it, expect } from 'vitest';
import { isOrderOverdue } from './utils';

describe('isOrderOverdue', () => {
  it('should return false for an empty due date', () => {
    expect(isOrderOverdue('')).toBe(false);
  });

  it('should return false when current date is before due date', () => {
    // Current date is Jan 1, 2024. Due date is Jan 2, 2024
    const currentDate = new Date('2024-01-01T00:00:00Z');
    expect(isOrderOverdue('2024-01-02', currentDate)).toBe(false);
  });

  it('should return false when current date is equal to due date', () => {
    // Current date is Jan 1, 2024. Due date is Jan 1, 2024
    const currentDate = new Date('2024-01-01T00:00:00Z');
    expect(isOrderOverdue('2024-01-01', currentDate)).toBe(false);
  });

  it('should return true when current date is after due date', () => {
    // Current date is Jan 2, 2024. Due date is Jan 1, 2024
    const currentDate = new Date('2024-01-02T00:00:00Z');
    expect(isOrderOverdue('2024-01-01', currentDate)).toBe(true);
  });

  it('should return false for an invalid date string', () => {
    const currentDate = new Date('2024-01-01T00:00:00Z');
    expect(isOrderOverdue('invalid-date-string', currentDate)).toBe(false);
  });
});
