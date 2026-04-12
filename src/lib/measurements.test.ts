import { describe, it, expect } from 'vitest';
import { getMeasurementCategoriesForDress } from './measurements';

describe('getMeasurementCategoriesForDress', () => {
  it('should return kameez and shalwar categories for "shalwar kameez"', () => {
    const categories = getMeasurementCategoriesForDress('shalwar kameez');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('kameez');
    expect(categories[1].id).toBe('shalwar');
  });

  it('should return kameez and shalwar categories for "kurta pajama"', () => {
    const categories = getMeasurementCategoriesForDress('kurta pajama');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('kameez');
    expect(categories[1].id).toBe('shalwar');
  });

  it('should return kameez and shalwar categories for "suit"', () => {
    const categories = getMeasurementCategoriesForDress('suit');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('kameez');
    expect(categories[1].id).toBe('shalwar');
  });

  it('should return kameez and shalwar categories for "sherwani"', () => {
    const categories = getMeasurementCategoriesForDress('sherwani');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('kameez');
    expect(categories[1].id).toBe('shalwar');
  });

  it('should return shirt and pants categories for "pants + shirt"', () => {
    const categories = getMeasurementCategoriesForDress('pants + shirt');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('shirt');
    expect(categories[1].id).toBe('pants');
  });

  it('should return shirt and pants categories for "pant shirt"', () => {
    const categories = getMeasurementCategoriesForDress('pant shirt');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('shirt');
    expect(categories[1].id).toBe('pants');
  });

  it('should return waistcoat category for "waistcoat"', () => {
    const categories = getMeasurementCategoriesForDress('waistcoat');
    expect(categories).toHaveLength(1);
    expect(categories[0].id).toBe('waistcoat');
  });

  it('should return frock and shalwar categories for "frock"', () => {
    const categories = getMeasurementCategoriesForDress('frock');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('frock');
    expect(categories[1].id).toBe('shalwar');
  });

  it('should return frock and shalwar categories for "maxi"', () => {
    const categories = getMeasurementCategoriesForDress('maxi');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('frock');
    expect(categories[1].id).toBe('shalwar');
  });

  it('should return frock and shalwar categories for "bridal"', () => {
    const categories = getMeasurementCategoriesForDress('bridal');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('frock');
    expect(categories[1].id).toBe('shalwar');
  });

  it('should return frock and shalwar categories for "lehenga"', () => {
    const categories = getMeasurementCategoriesForDress('lehenga');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('frock');
    expect(categories[1].id).toBe('shalwar');
  });

  it('should return frock and shalwar categories for "gharara"', () => {
    const categories = getMeasurementCategoriesForDress('gharara');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('frock');
    expect(categories[1].id).toBe('shalwar');
  });

  it('should return kameez category for "kameez"', () => {
    const categories = getMeasurementCategoriesForDress('kameez');
    expect(categories).toHaveLength(1);
    expect(categories[0].id).toBe('kameez');
  });

  it('should return kameez category for "kurti"', () => {
    const categories = getMeasurementCategoriesForDress('kurti');
    expect(categories).toHaveLength(1);
    expect(categories[0].id).toBe('kameez');
  });

  it('should return kameez category for "kurta"', () => {
    const categories = getMeasurementCategoriesForDress('kurta');
    expect(categories).toHaveLength(1);
    expect(categories[0].id).toBe('kameez');
  });

  it('should return pants category for "shalwar"', () => {
    const categories = getMeasurementCategoriesForDress('shalwar');
    expect(categories).toHaveLength(1);
    expect(categories[0].id).toBe('pants');
  });

  it('should return pants category for "trouser"', () => {
    const categories = getMeasurementCategoriesForDress('trouser');
    expect(categories).toHaveLength(1);
    expect(categories[0].id).toBe('pants');
  });

  it('should return pants category for "pants"', () => {
    const categories = getMeasurementCategoriesForDress('pants');
    expect(categories).toHaveLength(1);
    expect(categories[0].id).toBe('pants');
  });

  it('should return default kameez and shalwar categories for unknown dress type', () => {
    const categories = getMeasurementCategoriesForDress('unknown type');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('kameez');
    expect(categories[0].titleEn).toBe('Top');
    expect(categories[1].id).toBe('shalwar');
    expect(categories[1].titleEn).toBe('Bottom');
  });

  it('should be case insensitive', () => {
    const categories = getMeasurementCategoriesForDress('SHALWAR KAMEEZ');
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe('kameez');
    expect(categories[1].id).toBe('shalwar');
  });
});
