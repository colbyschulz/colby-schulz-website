import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useExpandOnMount } from '../use-expand-on-mount.ts';

const ORIGIN = { left: 10, top: 20, width: 100, height: 50 };

describe('useExpandOnMount', () => {
  it('starts collapsed with an inline style matching the origin rect', () => {
    const { result } = renderHook(() => useExpandOnMount(ORIGIN));

    expect(result.current.expanded).toBe(false);
    expect(result.current.style).toEqual(ORIGIN);
  });

  it('expands after mount and clears the inline style', async () => {
    const { result } = renderHook(() => useExpandOnMount(ORIGIN));

    await waitFor(() => expect(result.current.expanded).toBe(true));

    expect(result.current.style).toBeUndefined();
  });
});
