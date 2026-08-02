import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRevealOrchestration } from '../use-reveal-orchestration.ts';

const RECT = { left: 10, top: 20, width: 100, height: 50 };

describe('useRevealOrchestration', () => {
  it('starts with no active modal', () => {
    const { result } = renderHook(() => useRevealOrchestration());

    expect(result.current.activeModal).toBeNull();
  });

  it('opens the modal at the rect center on openModal', () => {
    const { result } = renderHook(() => useRevealOrchestration());

    act(() => {
      result.current.openModal('resume', RECT);
    });

    expect(result.current.activeModal).toEqual({ key: 'resume', origin: { x: 60, y: 45 } });
  });

  it('clears activeModal on closeModal', () => {
    const { result } = renderHook(() => useRevealOrchestration());

    act(() => {
      result.current.openModal('resume', RECT);
    });
    act(() => {
      result.current.closeModal();
    });

    expect(result.current.activeModal).toBeNull();
  });
});
