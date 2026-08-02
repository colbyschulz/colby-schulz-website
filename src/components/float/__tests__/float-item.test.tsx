import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { FloatItem } from '../float-item';
import { FloatContext } from '../float-context.ts';
import type { FloatContextValue } from '../float-types.ts';

function renderFloatItem(onClick: (origin: unknown) => void) {
  const contextValue: FloatContextValue = {
    register: vi.fn(),
    unregister: vi.fn(),
    setFrozen: vi.fn(),
    setSize: vi.fn(),
    setHome: vi.fn(),
    returnHome: vi.fn(),
  };
  return render(
    <FloatContext.Provider value={contextValue}>
      <FloatItem onClick={onClick}>
        <span>Resume</span>
      </FloatItem>
    </FloatContext.Provider>,
  );
}

describe('FloatItem', () => {
  it('reports the clicked element rect (left, top, width, height) on click', () => {
    const onClick = vi.fn();
    const { container } = renderFloatItem(onClick);
    const item = container.querySelector('div') as HTMLDivElement;

    vi.spyOn(item, 'getBoundingClientRect').mockReturnValue({
      left: 12,
      top: 34,
      width: 100,
      height: 50,
      right: 112,
      bottom: 84,
      x: 12,
      y: 34,
      toJSON: () => '',
    });

    fireEvent.click(item);

    expect(onClick).toHaveBeenCalledWith({ left: 12, top: 34, width: 100, height: 50 });
  });
});
