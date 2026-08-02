import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useExpandOnMount } from '../use-expand-on-mount.ts';

const ORIGIN = { left: 10, top: 20, width: 100, height: 50 };

describe('useExpandOnMount', () => {
  it('starts with neither flourishing nor expanded, style matching the origin rect', () => {
    const { result } = renderHook(() => useExpandOnMount(ORIGIN, 20));

    expect(result.current.flourishing).toBe(false);
    expect(result.current.expanded).toBe(false);
    expect(result.current.style).toEqual(ORIGIN);
  });

  it('starts flourishing after mount, before expanding', async () => {
    // A longer flourishMs here (vs. the other tests' 20ms) leaves a
    // comfortable window between "flourishing became true" and "the
    // expand timer fires", so this assertion isn't racing waitFor's
    // own ~50ms poll interval.
    const { result } = renderHook(() => useExpandOnMount(ORIGIN, 500));

    await waitFor(() => expect(result.current.flourishing).toBe(true));

    expect(result.current.expanded).toBe(false);
    expect(result.current.style).toEqual(ORIGIN);
  });

  it('expands only after flourishMs has elapsed, clearing the inline style', async () => {
    const { result } = renderHook(() => useExpandOnMount(ORIGIN, 20));

    await waitFor(() => expect(result.current.expanded).toBe(true));

    expect(result.current.style).toBeUndefined();
  });
});
