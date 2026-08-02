import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRevealOrchestration } from '../use-reveal-orchestration.ts';

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

const RECT = { left: 10, top: 20, width: 100, height: 50 };

describe('useRevealOrchestration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('enters the revealing state on startReveal when motion is not reduced', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useRevealOrchestration());

    act(() => {
      result.current.startReveal('resume', RECT);
    });

    expect(result.current.revealing).toEqual({ key: 'resume', rect: RECT });
    expect(result.current.activeModal).toBeNull();
  });

  it('skips straight to activeModal when motion is reduced', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useRevealOrchestration());

    act(() => {
      result.current.startReveal('resume', RECT);
    });

    expect(result.current.revealing).toBeNull();
    expect(result.current.activeModal).toEqual({ key: 'resume', origin: { x: 60, y: 45 } });
  });

  it('moves from revealing to activeModal on finishReveal', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useRevealOrchestration());

    act(() => {
      result.current.startReveal('resume', RECT);
    });
    act(() => {
      result.current.finishReveal();
    });

    expect(result.current.revealing).toBeNull();
    expect(result.current.activeModal).toEqual({ key: 'resume', origin: { x: 60, y: 45 } });
  });

  it('clears activeModal on closeModal', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useRevealOrchestration());

    act(() => {
      result.current.startReveal('resume', RECT);
    });
    act(() => {
      result.current.closeModal();
    });

    expect(result.current.activeModal).toBeNull();
  });
});
