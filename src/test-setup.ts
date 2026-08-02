import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement ResizeObserver; FloatItem (Task 2) and other
// components rely on it. A no-op stub is enough since tests assert on
// props/callbacks, not real layout measurements.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
