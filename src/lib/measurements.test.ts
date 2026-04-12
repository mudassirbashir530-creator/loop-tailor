import { describe, it, expect } from 'vitest';
import { getMeasurementName } from './measurements';

describe('getMeasurementName', () => {
  it('returns the English name when isRTL is false', () => {
    expect(getMeasurementName('kameezShoulder', false)).toBe('Shoulder');
    expect(getMeasurementName('kameezChest', false)).toBe('Chest');
  });

  it('returns the Urdu name when isRTL is true', () => {
    expect(getMeasurementName('kameezShoulder', true)).toBe('کندھا');
    expect(getMeasurementName('kameezChest', true)).toBe('چھاتی');
  });

  it('returns the key itself when an invalid key is provided (fallback)', () => {
    const invalidKey = 'invalidMeasurementKey';
    expect(getMeasurementName(invalidKey, false)).toBe(invalidKey);
    expect(getMeasurementName(invalidKey, true)).toBe(invalidKey);
  });
});
