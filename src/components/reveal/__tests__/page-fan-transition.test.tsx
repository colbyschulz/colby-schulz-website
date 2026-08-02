import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { PageFanTransition } from '../page-fan-transition';

const ORIGIN = { left: 10, top: 20, width: 100, height: 50 };

// Built manually (not fireEvent.transitionEnd) so the test doesn't depend on
// jsdom's TransitionEvent constructor — a plain Event with propertyName
// attached is all React's onTransitionEnd handler actually reads.
function transitionEndEvent(propertyName: string) {
  const event = new Event('transitionend', { bubbles: true });
  Object.defineProperty(event, 'propertyName', { value: propertyName });
  return event;
}

describe('PageFanTransition', () => {
  it('calls onDone when the expand transition completes', () => {
    const onDone = vi.fn();
    const { container } = render(<PageFanTransition origin={ORIGIN} onDone={onDone} />);
    const panel = container.firstChild as HTMLElement;

    fireEvent(panel, transitionEndEvent('width'));

    expect(onDone).toHaveBeenCalledOnce();
  });

  it('does not call onDone for unrelated transitionend events', () => {
    const onDone = vi.fn();
    const { container } = render(<PageFanTransition origin={ORIGIN} onDone={onDone} />);
    const panel = container.firstChild as HTMLElement;

    fireEvent(panel, transitionEndEvent('opacity'));

    expect(onDone).not.toHaveBeenCalled();
  });

  it('settles the pages (the flourish) before the panel grows', async () => {
    const { container } = render(<PageFanTransition origin={ORIGIN} onDone={vi.fn()} />);
    const panel = container.firstChild as HTMLElement;
    const pageBehind = panel.querySelector('div')!;

    expect(pageBehind.className).not.toMatch(/settled/);
    expect(panel.className).not.toMatch(/expanded/);

    await waitFor(() => expect(pageBehind.className).toMatch(/settled/));

    // The flourish settles well before the panel starts growing to full size.
    expect(panel.className).not.toMatch(/expanded/);
  });
});
