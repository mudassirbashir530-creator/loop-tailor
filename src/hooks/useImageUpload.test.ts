import { renderHook, act } from '@testing-library/react';
import { useImageUpload } from './useImageUpload';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useImageUpload', () => {
  let createObjectURLMock: any;
  let revokeObjectURLMock: any;

  beforeEach(() => {
    // Mock URL methods
    createObjectURLMock = vi.fn().mockReturnValue('mock-url');
    revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    // Use fake timers for the setInterval upload fallback
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useImageUpload());

    expect(result.current.file).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.uploadedUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should set file and preview when valid image is selected', () => {
    const { result } = renderHook(() => useImageUpload());

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    act(() => {
      result.current.selectFile(file);
    });

    expect(result.current.file).toBe(file);
    expect(result.current.preview).toBe('mock-url');
    expect(result.current.error).toBeNull();
    expect(createObjectURLMock).toHaveBeenCalledWith(file);
  });

  it('should reject non-image files', () => {
    const { result } = renderHook(() => useImageUpload());

    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });

    act(() => {
      result.current.selectFile(file);
    });

    expect(result.current.file).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(result.current.error).toBe('Please select an image file.');
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it('should reject files larger than 5MB', () => {
    const { result } = renderHook(() => useImageUpload());

    // Create a dummy file object that looks like >5MB
    const largeFile = new File([''], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB

    act(() => {
      result.current.selectFile(largeFile);
    });

    expect(result.current.file).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(result.current.error).toBe('File size must be less than 5MB.');
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it('should simulate upload process correctly', async () => {
    const { result } = renderHook(() => useImageUpload());

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.selectFile(file);
    });

    // Start upload
    let uploadPromise: Promise<string | null>;
    act(() => {
      uploadPromise = result.current.uploadToStorage('test/path');
    });

    expect(result.current.uploading).toBe(true);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();

    // Advance timers by 100ms - progress should be 20
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.progress).toBe(20);

    // Advance timers to complete upload
    act(() => {
      vi.advanceTimersByTime(400); // 100 + 400 = 500ms total (100% progress)
    });

    const url = await uploadPromise!;

    expect(url).toBe('mock-url');
    expect(result.current.uploadedUrl).toBe('mock-url');
    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBe(100);
  });

  it('should not upload if no file is selected', async () => {
    const { result } = renderHook(() => useImageUpload());

    let url: string | null = null;
    await act(async () => {
      url = await result.current.uploadToStorage('test/path');
    });

    expect(url).toBeNull();
    expect(result.current.uploading).toBe(false);
  });

  it('should reset state and revoke object URL', () => {
    const { result } = renderHook(() => useImageUpload());

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    act(() => {
      result.current.selectFile(file);
    });

    expect(result.current.preview).toBe('mock-url');

    act(() => {
      result.current.reset();
    });

    expect(result.current.file).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('mock-url');
    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.uploadedUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
