import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CardFlipTransition } from '../card-flip-transition';

const ORIGIN = { left: 10, top: 20, width: 100, height: 50 };

// Built manually (not fireEvent.transitionEnd) so the test doesn't depend on
// jsdom's TransitionEvent constructor — a plain Event with propertyName
// attached is all React's onTransitionEnd handler actually reads.
function transitionEndEvent(propertyName: string) {
  const event = new Event('transitionend', { bubbles: true });
  Object.defineProperty(event, 'propertyName', { value: propertyName });
  return event;
}

describe('CardFlipTransition', () => {
  it('calls onDone when the expand transition completes', () => {
    const onDone = vi.fn();
    const { container } = render(<CardFlipTransition origin={ORIGIN} onDone={onDone} />);
    const stage = container.firstChild as HTMLElement;

    fireEvent(stage, transitionEndEvent('width'));

    expect(onDone).toHaveBeenCalledOnce();
  });

  it('does not call onDone for unrelated transitionend events', () => {
    const onDone = vi.fn();
    const { container } = render(<CardFlipTransition origin={ORIGIN} onDone={onDone} />);
    const stage = container.firstChild as HTMLElement;

    fireEvent(stage, transitionEndEvent('opacity'));

    expect(onDone).not.toHaveBeenCalled();
  });
});
