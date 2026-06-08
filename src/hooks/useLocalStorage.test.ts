import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default value', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value')
    );
    expect(result.current[0]).toBe('default-value');
  });

  it('should initialize with stored value if available', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value')
    );
    expect(result.current[0]).toBe('stored-value');
  });

  it('should update value and localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value')
    );
    act(() => {
      result.current[1]('new-value');
    });
    expect(result.current[0]).toBe('new-value');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
  });
});
