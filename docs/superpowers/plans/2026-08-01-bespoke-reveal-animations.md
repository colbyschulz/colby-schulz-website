# Bespoke Reveal Animations & Resume PDF Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single generic scale-from-a-point modal open animation with a bespoke reveal per float item (Name card flips, Contact envelope unfolds, Resume document fans into pages), and give Resume real content via a PDF viewer built on react-pdf.

**Architecture:** Each float item reports its full on-screen rect (not just a center point) when clicked. A small per-item "transition" component plays a bespoke CSS animation anchored at that rect, growing to the same size/position the shared `Modal` uses. When the transition finishes, the existing `Modal` (unchanged accessibility/chrome) takes over already at full size, now fading in instead of scale-growing (that motion is superseded by the bespoke transition). Reveal/modal state is owned by a new `useRevealOrchestration` hook, decoupled from `FloatProvider`'s physics so it's unit-testable without mounting the whole floating scene. `prefers-reduced-motion` skips the bespoke transition entirely and fades straight to the Modal.

**Tech Stack:** React 19, TypeScript, Vite 8, Vitest 4 + @testing-library/react (new), SCSS modules, Radix UI Dialog (existing, unchanged), react-pdf (new).

## Global Constraints

- Kebab-case file/directory naming for all new files (project convention).
- No `index.ts` barrel files — import directly from component/hook files.
- Relative imports: pure `.ts` files (types, hooks) are imported with an explicit `.ts` extension (e.g. `from './float-types.ts'`); `.tsx` component files are imported without an extension. This matches the existing codebase exactly — follow it for every new import.
- Radix UI primitives are required for interactive controls; nothing new here needs one (the reveal transitions are decorative, the Modal's existing Radix Dialog is unchanged, and "Download PDF" is a plain link).
- `noUnusedLocals` / `noUnusedParameters` are enabled (`tsconfig.app.json`) — no unused variables/params, including in test mocks.
- Never `git commit` or `git push` without the user's explicit go-ahead in that turn — this applies to every commit step below. Confirm with the user before running the first commit of this plan's execution (see the note at the end of this plan).

## Testing approach (deviation from the spec's wording)

The design spec asked for a test asserting each `FLOAT_ITEMS` entry's `openAnimation` renders the correct transition component on click. This plan tests that logic at smaller, more stable seams instead of one integration test mounting the full `App`:

- `useRevealOrchestration`'s own unit tests (Task 3) prove the state machine — click triggers `revealing`, reduced motion bypasses it, completion moves to `activeModal`.
- Each transition component's unit test (Tasks 4, 7, 9) proves it signals completion correctly.
- `ResumePdfViewer`'s unit test (Task 5) proves it renders the right pages / error state.
- The thin remaining glue — `FLOAT_ITEMS`' `openAnimation` config picking the right component via `REVEAL_TRANSITIONS` — is exercised by the manual verification steps in Tasks 6, 8, and 10.

Mounting the whole `App` for this would require mocking `FloatProvider`'s `requestAnimationFrame` physics loop, `ResizeObserver`, and viewport listeners for little additional signal beyond what the above already covers, and risks flaky/hanging tests. If a true end-to-end click-through test is wanted later, it's a separate, addressable follow-up — not a blocker for this plan.

---

### Task 1: Component-testing infrastructure

Every later task needs to render React components / hooks in tests, which isn't set up yet — the project's only existing test (`float-engine.test.ts`) is pure logic, no DOM. Add `jsdom` + `@testing-library/react` + `@testing-library/jest-dom` and wire them into Vitest.

**Files:**
- Modify: `package.json` (add devDependencies)
- Modify: `vitest.config.ts`
- Create: `src/test-setup.ts`
- Create: `src/components/__tests__/smoke.test.tsx` (deleted at the end of this task once infra is proven — see Step 5)

**Interfaces:**
- Produces: a working `render`/`screen`/`renderHook` environment with jest-dom matchers (`toBeInTheDocument`, etc.) available in every `*.test.tsx` file from here on, plus a `ResizeObserver` stub (jsdom doesn't implement it, and `FloatItem` needs one).

- [ ] **Step 1: Add the test dependencies**

```bash
npm install -D jsdom@^30.0.1 @testing-library/react@^16.3.2 @testing-library/dom@^10.4.1 @testing-library/jest-dom@^7.0.0
```

- [ ] **Step 2: Configure Vitest for jsdom + jest-dom + tsx tests**

Replace the contents of `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

Create `src/test-setup.ts`:

```ts
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
```

- [ ] **Step 3: Write a smoke test to prove the setup works**

Create `src/components/__tests__/smoke.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('component test infrastructure', () => {
  it('renders a component and can query the DOM', () => {
    render(<p>hello</p>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run it**

Run: `npx vitest run src/components/__tests__/smoke.test.tsx`
Expected: PASS (1 test)

Also run the full suite once to confirm the existing `float-engine.test.ts` still passes under the new config:

Run: `npx vitest run`
Expected: all tests PASS

- [ ] **Step 5: Delete the smoke test**

It was only proving the infrastructure works; every later task's real tests exercise it from here on.

```bash
rm src/components/__tests__/smoke.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test-setup.ts
git commit -m "test: add component-testing infrastructure (jsdom, testing-library)"
```

---

### Task 2: FloatItem reports a rect instead of a point on click

Card-flip / envelope-unfold / page-fan animations need the icon's actual on-screen size to anchor a same-sized shape at the start of the animation — a center point (today's `Vec2`) isn't enough.

**Files:**
- Modify: `src/components/float/float-types.ts`
- Modify: `src/components/float/float-item.tsx`
- Test: `src/components/float/__tests__/float-item.test.tsx`

**Interfaces:**
- Produces: `FloatItemOrigin` (`{ left, top, width, height }`), exported from `float-types.ts`. `FloatItemProps.onClick` is now `(origin: FloatItemOrigin) => void`.

- [ ] **Step 1: Write the failing test**

Create `src/components/float/__tests__/float-item.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/float/__tests__/float-item.test.tsx`
Expected: FAIL — `onClick` currently receives `{ x, y }`, not `{ left, top, width, height }`

- [ ] **Step 3: Add `FloatItemOrigin` and update `FloatItemProps`**

In `src/components/float/float-types.ts`, add the new interface and change the `onClick` signature:

```ts
export interface FloatItemOrigin {
  left: number;
  top: number;
  width: number;
  height: number;
}
```

Change:

```ts
  onClick?: (origin: Vec2) => void;
```

to:

```ts
  onClick?: (origin: FloatItemOrigin) => void;
```

- [ ] **Step 4: Update `float-item.tsx`'s click handler**

In `src/components/float/float-item.tsx`, change:

```ts
  const handleClick = () => {
    if (!onClick || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    onClick({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };
```

to:

```ts
  const handleClick = () => {
    if (!onClick || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    onClick({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/float/__tests__/float-item.test.tsx`
Expected: PASS

Note: `src/app.tsx` still passes the old `ModalOrigin` (`{x, y}`) shape around and will now fail to typecheck — that's expected and gets fixed in Task 6, which rewires `app.tsx` end-to-end. Don't fix it here.

- [ ] **Step 6: Commit**

```bash
git add src/components/float/float-types.ts src/components/float/float-item.tsx src/components/float/__tests__/float-item.test.tsx
git commit -m "feat: FloatItem reports full rect instead of center point on click"
```

---

### Task 3: `usePrefersReducedMotion` and `useRevealOrchestration` hooks

Extract the reveal/modal state machine into a standalone hook so it's testable without mounting the physics-heavy `FloatProvider` tree, and add the reduced-motion check it depends on.

**Files:**
- Create: `src/hooks/use-prefers-reduced-motion.ts`
- Create: `src/hooks/__tests__/use-prefers-reduced-motion.test.ts`
- Create: `src/hooks/use-reveal-orchestration.ts`
- Create: `src/hooks/__tests__/use-reveal-orchestration.test.ts`

**Interfaces:**
- Consumes: `FloatItemOrigin` from `../components/float/float-types.ts` (Task 2), `ModalOrigin` from `../components/modal/modal.types.ts` (existing, unchanged).
- Produces:
  - `usePrefersReducedMotion(): boolean`
  - `RevealingState { key: string; rect: FloatItemOrigin }`, `ActiveModal { key: string; origin: ModalOrigin }`, both exported from `use-reveal-orchestration.ts`.
  - `useRevealOrchestration(): { revealing: RevealingState | null; activeModal: ActiveModal | null; startReveal: (key: string, rect: FloatItemOrigin) => void; finishReveal: () => void; closeModal: () => void }`
  - Behavior: `startReveal` sets `revealing` (normal motion) or jumps straight to `activeModal` (reduced motion, converting the rect's center to a `ModalOrigin`). `finishReveal` converts the current `revealing` rect's center to `activeModal` and clears `revealing`. `closeModal` clears `activeModal`.

- [ ] **Step 1: Write the failing test for `usePrefersReducedMotion`**

Create `src/hooks/__tests__/use-prefers-reduced-motion.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from '../use-prefers-reduced-motion.ts';

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

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when the media query matches', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('returns false when the media query does not match', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/use-prefers-reduced-motion.test.ts`
Expected: FAIL — module doesn't exist

- [ ] **Step 3: Implement `usePrefersReducedMotion`**

Create `src/hooks/use-prefers-reduced-motion.ts`:

```ts
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handleChange = () => setReduced(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/use-prefers-reduced-motion.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for `useRevealOrchestration`**

Create `src/hooks/__tests__/use-reveal-orchestration.test.ts`:

```ts
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
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/use-reveal-orchestration.test.ts`
Expected: FAIL — module doesn't exist

- [ ] **Step 7: Implement `useRevealOrchestration`**

Create `src/hooks/use-reveal-orchestration.ts`:

```ts
import { useCallback, useState } from 'react';
import type { FloatItemOrigin } from '../components/float/float-types.ts';
import type { ModalOrigin } from '../components/modal/modal.types.ts';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion.ts';

export interface RevealingState {
  key: string;
  rect: FloatItemOrigin;
}

export interface ActiveModal {
  key: string;
  origin: ModalOrigin;
}

function centerOf(rect: FloatItemOrigin): ModalOrigin {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function useRevealOrchestration() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [revealing, setRevealing] = useState<RevealingState | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);

  const startReveal = useCallback(
    (key: string, rect: FloatItemOrigin) => {
      if (prefersReducedMotion) {
        setActiveModal({ key, origin: centerOf(rect) });
        return;
      }
      setRevealing({ key, rect });
    },
    [prefersReducedMotion],
  );

  const finishReveal = useCallback(() => {
    if (!revealing) return;
    setActiveModal({ key: revealing.key, origin: centerOf(revealing.rect) });
    setRevealing(null);
  }, [revealing]);

  const closeModal = useCallback(() => setActiveModal(null), []);

  return { revealing, activeModal, startReveal, finishReveal, closeModal };
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/use-reveal-orchestration.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/hooks/use-prefers-reduced-motion.ts src/hooks/use-reveal-orchestration.ts src/hooks/__tests__/use-prefers-reduced-motion.test.ts src/hooks/__tests__/use-reveal-orchestration.test.ts
git commit -m "feat: add prefers-reduced-motion and reveal-orchestration hooks"
```

---

### Task 4: Shared expand-on-mount hook + page-fan transition component

The bespoke reveal for Resume: the document's pages fan open, growing from the clicked icon's rect to the Modal's own target size/position (~90vw x 85dvh, centered) so the handoff to Modal is seamless. This is also the first of three transition components (Tasks 4, 7, 9), so it introduces a shared `useExpandOnMount` hook for the "am I expanded yet, and what inline style follows from that" logic every transition component needs — each component still owns its own bespoke markup/CSS on top of it.

**Files:**
- Create: `src/components/reveal/reveal-types.ts`
- Create: `src/components/reveal/use-expand-on-mount.ts`
- Create: `src/components/reveal/__tests__/use-expand-on-mount.test.ts`
- Create: `src/components/reveal/page-fan-transition.tsx`
- Create: `src/components/reveal/page-fan-transition.module.scss`
- Test: `src/components/reveal/__tests__/page-fan-transition.test.tsx`

**Interfaces:**
- Consumes: `FloatItemOrigin` from `../float/float-types.ts` (Task 2).
- Produces:
  - `OpenAnimation = 'flip' | 'envelope' | 'pages'` and `RevealTransitionProps { origin: FloatItemOrigin; onDone: () => void }`, both exported from `reveal-types.ts` (shared by every transition component in this and later tasks).
  - `useExpandOnMount(origin: FloatItemOrigin): { expanded: boolean; style: { left: number; top: number; width: number; height: number } | undefined }`, exported from `use-expand-on-mount.ts`. `style` is the origin rect while collapsed, `undefined` once expanded (letting CSS classes take over sizing). Reused verbatim by Tasks 7 and 9.
  - `PageFanTransition(props: RevealTransitionProps)`.

- [ ] **Step 1: Write the failing test for `useExpandOnMount`**

Create `src/components/reveal/__tests__/use-expand-on-mount.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/reveal/__tests__/use-expand-on-mount.test.ts`
Expected: FAIL — module doesn't exist

- [ ] **Step 3: Implement `useExpandOnMount`**

Create `src/components/reveal/use-expand-on-mount.ts`:

```ts
import { useEffect, useState } from 'react';
import type { FloatItemOrigin } from '../float/float-types.ts';

export interface ExpandOnMountResult {
  expanded: boolean;
  style: FloatItemOrigin | undefined;
}

export function useExpandOnMount(origin: FloatItemOrigin): ExpandOnMountResult {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setExpanded(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return {
    expanded,
    style: expanded ? undefined : origin,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/reveal/__tests__/use-expand-on-mount.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for `PageFanTransition`**

Create `src/components/reveal/__tests__/page-fan-transition.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/components/reveal/__tests__/page-fan-transition.test.tsx`
Expected: FAIL — module doesn't exist

- [ ] **Step 7: Add the shared reveal types**

Create `src/components/reveal/reveal-types.ts`:

```ts
import type { FloatItemOrigin } from '../float/float-types.ts';

export type OpenAnimation = 'flip' | 'envelope' | 'pages';

export interface RevealTransitionProps {
  origin: FloatItemOrigin;
  onDone: () => void;
}
```

- [ ] **Step 8: Implement `PageFanTransition`**

Create `src/components/reveal/page-fan-transition.tsx`:

```tsx
import type { RevealTransitionProps } from './reveal-types.ts';
import { useExpandOnMount } from './use-expand-on-mount.ts';
import styles from './page-fan-transition.module.scss';

export function PageFanTransition({ origin, onDone }: RevealTransitionProps) {
  const { expanded, style } = useExpandOnMount(origin);

  return (
    <div
      className={`${styles.panel}${expanded ? ` ${styles.expanded}` : ''}`}
      style={style}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'width') onDone();
      }}
    >
      <div className={`${styles.page} ${styles.pageBehind}`} />
      <div className={styles.page} />
    </div>
  );
}
```

Create `src/components/reveal/page-fan-transition.module.scss`:

```scss
@use '@/styles/tokens' as *;

.panel {
  position: fixed;
  z-index: $z-modal;
  transition:
    left 0.35s ease-out,
    top 0.35s ease-out,
    width 0.35s ease-out,
    height 0.35s ease-out,
    transform 0.35s ease-out;
  pointer-events: none;
}

.panel.expanded {
  left: 50%;
  top: 50%;
  width: 90vw;
  height: 85dvh;
  transform: translate(-50%, -50%);
}

.page {
  position: absolute;
  inset: 0;
  background: $surface-glass;
  border: 1px solid $border-default;
  border-radius: 16px;
  transition:
    transform 0.35s ease-out,
    opacity 0.35s ease-out;
}

.pageBehind {
  transform: rotate(-6deg) scale(0.96);
  opacity: 0.6;
}

.expanded .pageBehind {
  transform: rotate(0deg) scale(1);
  opacity: 0;
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run src/components/reveal/__tests__/page-fan-transition.test.tsx`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/components/reveal/reveal-types.ts src/components/reveal/use-expand-on-mount.ts src/components/reveal/page-fan-transition.tsx src/components/reveal/page-fan-transition.module.scss src/components/reveal/__tests__/
git commit -m "feat: add useExpandOnMount hook and page-fan reveal transition for Resume"
```

---

### Task 5: Resume PDF viewer (react-pdf)

Real resume content: render the actual PDF's pages, continuous scroll, plus a download link.

**Files:**
- Modify: `package.json` (add `react-pdf` dependency)
- Create: `src/components/resume-viewer/resume-pdf-viewer.tsx`
- Create: `src/components/resume-viewer/resume-pdf-viewer.module.scss`
- Test: `src/components/resume-viewer/__tests__/resume-pdf-viewer.test.tsx`

**Interfaces:**
- Produces: `ResumePdfViewer({ file }: { file?: string })` — a `ComponentType` usable directly as a float item's `modal.content`. Defaults `file` to `/resume.pdf`; the optional prop exists so tests can point it at a fixture name without touching the real asset path.

- [ ] **Step 1: Add the dependency**

```bash
npm install react-pdf@^10.4.1
```

- [ ] **Step 2: Write the failing test**

Create `src/components/resume-viewer/__tests__/resume-pdf-viewer.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ResumePdfViewer } from '../resume-pdf-viewer';

// vitest.config.ts doesn't set test.globals, so @testing-library/react's
// auto-cleanup (which detects a global `afterEach`) never registers —
// without this, leftover nodes from earlier renders make getByRole below
// match more than one element.
afterEach(() => cleanup());

vi.mock('react-pdf', () => ({
  pdfjs: { GlobalWorkerOptions: {} as Record<string, unknown> },
  Document: ({
    file,
    onLoadSuccess,
    onLoadError,
    children,
  }: {
    file: string;
    onLoadSuccess: (info: { numPages: number }) => void;
    onLoadError: () => void;
    children: ReactNode;
  }) => {
    useEffect(() => {
      if (file === 'broken.pdf') onLoadError();
      else onLoadSuccess({ numPages: 3 });
    }, [file, onLoadSuccess, onLoadError]);
    return <div>{children}</div>;
  },
  Page: ({ pageNumber }: { pageNumber: number }) => <div data-testid={`page-${pageNumber}`} />,
}));

describe('ResumePdfViewer', () => {
  it('renders one Page per page reported by the PDF', () => {
    render(<ResumePdfViewer file="resume.pdf" />);

    expect(screen.getByTestId('page-1')).toBeInTheDocument();
    expect(screen.getByTestId('page-2')).toBeInTheDocument();
    expect(screen.getByTestId('page-3')).toBeInTheDocument();
  });

  it('shows an inline error message when the PDF fails to load', () => {
    render(<ResumePdfViewer file="broken.pdf" />);

    expect(screen.getByText(/couldn't load/i)).toBeInTheDocument();
  });

  it('renders a download link to the PDF file', () => {
    render(<ResumePdfViewer file="resume.pdf" />);

    expect(screen.getByRole('link', { name: /download/i })).toHaveAttribute(
      'href',
      'resume.pdf',
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/resume-viewer/__tests__/resume-pdf-viewer.test.tsx`
Expected: FAIL — module doesn't exist

- [ ] **Step 4: Implement `ResumePdfViewer`**

Create `src/components/resume-viewer/resume-pdf-viewer.tsx`:

```tsx
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './resume-pdf-viewer.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const DEFAULT_FILE = '/resume.pdf';

interface ResumePdfViewerProps {
  file?: string;
}

export function ResumePdfViewer({ file = DEFAULT_FILE }: ResumePdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);

  if (loadError) {
    return <p className={styles.error}>Couldn&apos;t load the resume PDF.</p>;
  }

  return (
    <div className={styles.viewer}>
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={() => setLoadError(true)}
        loading={<p className={styles.loading}>Loading resume...</p>}
      >
        {numPages !== null &&
          Array.from({ length: numPages }, (_, i) => (
            <Page key={i} pageNumber={i + 1} className={styles.page} />
          ))}
      </Document>
      <a href={file} download className={styles.download}>
        Download PDF
      </a>
    </div>
  );
}
```

Create `src/components/resume-viewer/resume-pdf-viewer.module.scss`:

```scss
@use '@/styles/tokens' as *;

.viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.page {
  max-width: 100%;
  box-shadow: $glow-default;
  border-radius: 4px;
  overflow: hidden;
}

.error,
.loading {
  color: $text-muted;
  font-size: $text-md;
}

.download {
  color: $text-primary;
  font-size: $text-sm;
  letter-spacing: $tracking-wide;
  text-decoration: underline;
  align-self: center;
}
```

- [ ] **Step 5: Configure the pdf.js worker for Vite**

No extra config file is needed — the `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)` line in the component itself is Vite's standard pattern for bundling the worker asset. Confirm it resolves by running the dev server in Task 6's manual verification step.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/components/resume-viewer/__tests__/resume-pdf-viewer.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/components/resume-viewer/
git commit -m "feat: add ResumePdfViewer built on react-pdf"
```

---

### Task 6: Wire Resume end-to-end

Bring Tasks 2-5 together for the Resume float item: clicking it plays `PageFanTransition`, then the Modal takes over showing `ResumePdfViewer`. This is also where the Modal's open animation changes from scale-grow to fade-only, since the bespoke transition now provides the opening motion.

**Files:**
- Modify: `src/components/modal/modal.module.scss`
- Modify: `src/app.tsx`
- Prerequisite (not part of this task's steps, supplied by the user): `public/resume.pdf`

**Interfaces:**
- Consumes: `useRevealOrchestration` (Task 3), `PageFanTransition` + `OpenAnimation` + `RevealTransitionProps` (Task 4), `ResumePdfViewer` (Task 5), `FloatItemOrigin` (Task 2).

- [ ] **Step 1: Make the Modal's open animation fade-only**

In `src/components/modal/modal.module.scss`, the `@starting-style` block currently animates both transform and opacity on open:

```scss
@starting-style {
  .overlay {
    opacity: 0;
  }

  .content {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
}
```

Remove the `transform` line from `.content`'s starting style, so opening only fades in (the bespoke transition already handled the "growing" motion; closing is unchanged and still scales down):

```scss
@starting-style {
  .overlay {
    opacity: 0;
  }

  .content {
    opacity: 0;
  }
}
```

This isn't unit-testable (jsdom doesn't run CSS transitions) — verify visually in Step 6.

- [ ] **Step 2: Update `app.tsx`'s config type and imports**

In `src/app.tsx`, replace the `ModalOrigin` import and the `FloatItemConfig`/`ActiveModal` types:

Replace:

```ts
import type { ModalOrigin } from './components/modal/modal.types';
```

with:

```ts
import type { OpenAnimation, RevealTransitionProps } from './components/reveal/reveal-types.ts';
import { PageFanTransition } from './components/reveal/page-fan-transition';
import { ResumePdfViewer } from './components/resume-viewer/resume-pdf-viewer';
import { useRevealOrchestration } from './hooks/use-reveal-orchestration.ts';
```

`ModalOrigin` is no longer referenced directly in `app.tsx` after this task — the `ActiveModal`/`ModalOrigin` types are now owned by `use-reveal-orchestration.ts`, and `Modal`'s `origin` prop still typechecks against `activeModal.origin` structurally.

Replace the `FloatItemConfig` interface's `modal` field:

```ts
  modal?: {
    title: string;
    content: ComponentType;
  };
```

with:

```ts
  modal?: {
    title: string;
    content: ComponentType;
    openAnimation: OpenAnimation;
  };
```

Delete the local `ActiveModal` interface entirely — it's now defined and owned by `use-reveal-orchestration.ts` (Task 3). Nothing in `app.tsx` needs to import that type by name: `activeModal`'s type comes from `useRevealOrchestration()`'s inferred return type, and `Modal`'s `origin` prop is checked structurally against `ModalOrigin`.

Add a lookup from `OpenAnimation` to its transition component, above `FLOAT_ITEMS`. Only `'pages'` exists so far — `'envelope'` and `'flip'` are added in Tasks 8 and 10 — so type it as `Partial` for now; Task 10 tightens it to a full `Record` once all three keys exist:

```ts
const REVEAL_TRANSITIONS: Partial<Record<OpenAnimation, ComponentType<RevealTransitionProps>>> = {
  pages: PageFanTransition,
};
```

- [ ] **Step 3: Update the Resume entry in `FLOAT_ITEMS`**

Change:

```ts
  {
    key: 'resume',
    label: 'Resume',
    content: ResumeDocument,
    modal: { title: 'Resume', content: () => <p>Resume coming soon.</p> },
    freezeOnHover: true,
    // 220 × 334/260 = 180px desktop; 95 × 334/260 + 16px padding = 138px mobile
    heights: { desktop: 180, mobile: 138 },
  },
```

to:

```ts
  {
    key: 'resume',
    label: 'Resume',
    content: ResumeDocument,
    modal: { title: 'Resume', content: ResumePdfViewer, openAnimation: 'pages' },
    freezeOnHover: true,
    // 220 × 334/260 = 180px desktop; 95 × 334/260 + 16px padding = 138px mobile
    heights: { desktop: 180, mobile: 138 },
  },
```

Leave the `name` and `contact` entries' `modal` config as-is for now — they'll fail to typecheck (missing `openAnimation`) until Tasks 8 and 10. That's expected; this task only wires Resume.

- [ ] **Step 4: Replace ad hoc modal state with `useRevealOrchestration`**

In the `App` function, replace:

```ts
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
```

with:

```ts
  const { revealing, activeModal, startReveal, finishReveal, closeModal } =
    useRevealOrchestration();
```

Replace `handleItemClick`:

```ts
  const handleItemClick = useCallback((key: string, origin: ModalOrigin) => {
    setFrozenKey(key);
    setActiveModal({ key, origin });
  }, []);
```

with:

```ts
  const handleItemClick = useCallback(
    (key: string, rect: FloatItemOrigin) => {
      setFrozenKey(key);
      startReveal(key, rect);
    },
    [startReveal],
  );
```

This needs `FloatItemOrigin` imported: add it to the existing `import type { Vec2 } from './components/float/float-types'` line (or add a new one):

```ts
import type { FloatItemOrigin, Vec2 } from './components/float/float-types.ts';
```

Replace `handleModalClose`:

```ts
  const handleModalClose = useCallback(() => {
    setFrozenKey(null);
    setActiveModal(null);
  }, []);
```

with:

```ts
  const handleModalClose = useCallback(() => {
    setFrozenKey(null);
    closeModal();
  }, [closeModal]);
```

- [ ] **Step 5: Render the transition component, then the Modal**

`activeConfig` is computed today as:

```ts
  const activeConfig = activeModal
    ? FLOAT_ITEMS.find((item) => item.key === activeModal.key)
    : null;
```

Add the equivalent lookup for the revealing state, and the transition component it maps to, right after it:

```ts
  const revealingConfig = revealing
    ? FLOAT_ITEMS.find((item) => item.key === revealing.key)
    : null;
  const RevealTransitionComponent = revealingConfig?.modal
    ? REVEAL_TRANSITIONS[revealingConfig.modal.openAnimation]
    : undefined;
```

In the JSX, right before the existing `{activeModal && activeConfig?.modal && (...)}` block, add:

```tsx
      {revealing && RevealTransitionComponent && (
        <RevealTransitionComponent origin={revealing.rect} onDone={finishReveal} />
      )}
```

- [ ] **Step 6: Manually verify**

Run: `npm run dev`

Add your resume PDF at `public/resume.pdf` if it isn't there yet (required for this manual check; the automated tests from Task 5 don't need it since `react-pdf` is mocked there).

In the browser:
- Click the Resume float item. Confirm pages fan open from the icon's position, then the Modal appears already at full size (no additional pop/scale), showing the real PDF pages, scrollable, with a working "Download PDF" link.
- Click "cool" to close. Confirm it closes exactly as it did before this change (unaffected).
- In your OS/browser accessibility settings, enable "reduce motion", reload, and click Resume again — confirm it fades straight into the Modal with no page-fan flourish.

- [ ] **Step 7: Run the full test suite**

Run: `npx vitest run`
Expected: all tests PASS. `npm run build` (`tsc -b && vite build`) is expected to still report errors for the `name`/`contact` entries missing `openAnimation` — that's resolved in Tasks 8 and 10, not here.

- [ ] **Step 8: Commit**

```bash
git add src/components/modal/modal.module.scss src/app.tsx
git commit -m "feat: wire Resume float item to page-fan transition and PDF viewer"
```

---

### Task 7: Envelope transition component

The bespoke reveal for Contact: the envelope's flap opens like a letter, while the panel grows to the Modal's target size/position.

**Files:**
- Create: `src/components/reveal/envelope-transition.tsx`
- Create: `src/components/reveal/envelope-transition.module.scss`
- Test: `src/components/reveal/__tests__/envelope-transition.test.tsx`

**Interfaces:**
- Consumes: `RevealTransitionProps` from `./reveal-types.ts` and `useExpandOnMount` from `./use-expand-on-mount.ts` (both Task 4).
- Produces: `EnvelopeTransition(props: RevealTransitionProps)`.

- [ ] **Step 1: Write the failing test**

Create `src/components/reveal/__tests__/envelope-transition.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { EnvelopeTransition } from '../envelope-transition';

const ORIGIN = { left: 10, top: 20, width: 100, height: 50 };

// Built manually (not fireEvent.transitionEnd) so the test doesn't depend on
// jsdom's TransitionEvent constructor — a plain Event with propertyName
// attached is all React's onTransitionEnd handler actually reads.
function transitionEndEvent(propertyName: string) {
  const event = new Event('transitionend', { bubbles: true });
  Object.defineProperty(event, 'propertyName', { value: propertyName });
  return event;
}

describe('EnvelopeTransition', () => {
  it('calls onDone when the expand transition completes', () => {
    const onDone = vi.fn();
    const { container } = render(<EnvelopeTransition origin={ORIGIN} onDone={onDone} />);
    const panel = container.firstChild as HTMLElement;

    fireEvent(panel, transitionEndEvent('width'));

    expect(onDone).toHaveBeenCalledOnce();
  });

  it('does not call onDone for unrelated transitionend events', () => {
    const onDone = vi.fn();
    const { container } = render(<EnvelopeTransition origin={ORIGIN} onDone={onDone} />);
    const panel = container.firstChild as HTMLElement;

    fireEvent(panel, transitionEndEvent('opacity'));

    expect(onDone).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/reveal/__tests__/envelope-transition.test.tsx`
Expected: FAIL — module doesn't exist

- [ ] **Step 3: Implement `EnvelopeTransition`**

Create `src/components/reveal/envelope-transition.tsx`:

```tsx
import type { RevealTransitionProps } from './reveal-types.ts';
import { useExpandOnMount } from './use-expand-on-mount.ts';
import styles from './envelope-transition.module.scss';

export function EnvelopeTransition({ origin, onDone }: RevealTransitionProps) {
  const { expanded, style } = useExpandOnMount(origin);

  return (
    <div
      className={`${styles.panel}${expanded ? ` ${styles.expanded}` : ''}`}
      style={style}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'width') onDone();
      }}
    >
      <div className={styles.body} />
      <div className={styles.flap} />
    </div>
  );
}
```

Create `src/components/reveal/envelope-transition.module.scss`:

```scss
@use '@/styles/tokens' as *;

.panel {
  position: fixed;
  z-index: $z-modal;
  transition:
    left 0.35s ease-out,
    top 0.35s ease-out,
    width 0.35s ease-out,
    height 0.35s ease-out,
    transform 0.35s ease-out;
  pointer-events: none;
}

.panel.expanded {
  left: 50%;
  top: 50%;
  width: 90vw;
  height: 85dvh;
  transform: translate(-50%, -50%);
}

.body {
  position: absolute;
  inset: 0;
  background: $surface-glass;
  border: 1px solid $border-default;
  border-radius: 16px;
}

.flap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: $surface-glass;
  border: 1px solid $border-default;
  border-radius: 16px 16px 0 0;
  transform-origin: top center;
  transition: transform 0.35s ease-out, opacity 0.35s ease-out;
}

.expanded .flap {
  transform: rotateX(-170deg);
  opacity: 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/reveal/__tests__/envelope-transition.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/reveal/envelope-transition.tsx src/components/reveal/envelope-transition.module.scss src/components/reveal/__tests__/envelope-transition.test.tsx
git commit -m "feat: add envelope reveal transition for the Contact item"
```

---

### Task 8: Wire Contact end-to-end

**Files:**
- Modify: `src/app.tsx`

**Interfaces:**
- Consumes: `EnvelopeTransition` (Task 7).

- [ ] **Step 1: Add `envelope` to `REVEAL_TRANSITIONS`**

In `src/app.tsx`, import `EnvelopeTransition`:

```ts
import { EnvelopeTransition } from './components/reveal/envelope-transition';
```

Add it to the map:

```ts
const REVEAL_TRANSITIONS: Partial<Record<OpenAnimation, ComponentType<RevealTransitionProps>>> = {
  pages: PageFanTransition,
  envelope: EnvelopeTransition,
};
```

- [ ] **Step 2: Update the Contact entry in `FLOAT_ITEMS`**

Change:

```ts
  {
    key: 'contact',
    label: 'Contact',
    content: ContactEnvelope,
    modal: { title: 'Contact', content: () => <p>Contact coming soon.</p> },
    freezeOnHover: true,
    // 220 × 198/358 = 122px desktop; 150 × 198/358 + 16px padding = 99px mobile
    heights: { desktop: 122, mobile: 99 },
  },
```

to:

```ts
  {
    key: 'contact',
    label: 'Contact',
    content: ContactEnvelope,
    modal: { title: 'Contact', content: () => <p>Contact coming soon.</p>, openAnimation: 'envelope' },
    freezeOnHover: true,
    // 220 × 198/358 = 122px desktop; 150 × 198/358 + 16px padding = 99px mobile
    heights: { desktop: 122, mobile: 99 },
  },
```

(The placeholder content stays a placeholder — filling in real contact info is separate, unrelated work.)

- [ ] **Step 3: Manually verify**

Run: `npm run dev`. Click the Contact float item. Confirm the envelope's flap opens and the panel grows to the Modal's size/position, then the Modal takes over showing the (placeholder) contact content. Click "cool" to close and confirm it behaves as before.

- [ ] **Step 4: Run the full test suite**

Run: `npx vitest run`
Expected: all tests PASS. `npm run build` is still expected to report an error for the `name` entry missing `openAnimation` until Task 10.

- [ ] **Step 5: Commit**

```bash
git add src/app.tsx
git commit -m "feat: wire Contact float item to envelope transition"
```

---

### Task 9: Card-flip transition component

The bespoke reveal for Name: the card flips over (3D rotateY) while growing to the Modal's target size/position.

**Files:**
- Create: `src/components/reveal/card-flip-transition.tsx`
- Create: `src/components/reveal/card-flip-transition.module.scss`
- Test: `src/components/reveal/__tests__/card-flip-transition.test.tsx`

**Interfaces:**
- Consumes: `RevealTransitionProps` from `./reveal-types.ts` and `useExpandOnMount` from `./use-expand-on-mount.ts` (both Task 4).
- Produces: `CardFlipTransition(props: RevealTransitionProps)`.

- [ ] **Step 1: Write the failing test**

Create `src/components/reveal/__tests__/card-flip-transition.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/reveal/__tests__/card-flip-transition.test.tsx`
Expected: FAIL — module doesn't exist

- [ ] **Step 3: Implement `CardFlipTransition`**

Create `src/components/reveal/card-flip-transition.tsx`:

```tsx
import type { RevealTransitionProps } from './reveal-types.ts';
import { useExpandOnMount } from './use-expand-on-mount.ts';
import styles from './card-flip-transition.module.scss';

export function CardFlipTransition({ origin, onDone }: RevealTransitionProps) {
  const { expanded, style } = useExpandOnMount(origin);

  return (
    <div
      className={`${styles.stage}${expanded ? ` ${styles.expanded}` : ''}`}
      style={style}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'width') onDone();
      }}
    >
      <div className={`${styles.card}${expanded ? ` ${styles.cardFlipped}` : ''}`} />
    </div>
  );
}
```

Create `src/components/reveal/card-flip-transition.module.scss`:

```scss
@use '@/styles/tokens' as *;

.stage {
  position: fixed;
  z-index: $z-modal;
  perspective: 1200px;
  transition:
    left 0.35s ease-out,
    top 0.35s ease-out,
    width 0.35s ease-out,
    height 0.35s ease-out;
  pointer-events: none;
}

.stage.expanded {
  left: 50%;
  top: 50%;
  width: 90vw;
  height: 85dvh;
  transform: translate(-50%, -50%);
}

.card {
  width: 100%;
  height: 100%;
  background: $surface-glass;
  border: 1px solid $border-default;
  border-radius: 16px;
  transform: rotateY(0deg);
  transition: transform 0.35s ease-out;
}

.cardFlipped {
  transform: rotateY(180deg);
}
```

Note: `.stage.expanded` combines the position/size change with the outer container's own `translate(-50%, -50%)` centering — the same pattern used by `PageFanTransition` and `EnvelopeTransition` — while the inner `.card` handles the flip independently via its own `transform`/`transition`, so the two animations run concurrently without fighting over the same CSS property.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/reveal/__tests__/card-flip-transition.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/reveal/card-flip-transition.tsx src/components/reveal/card-flip-transition.module.scss src/components/reveal/__tests__/card-flip-transition.test.tsx
git commit -m "feat: add card-flip reveal transition for the Name item"
```

---

### Task 10: Wire Name end-to-end

**Files:**
- Modify: `src/app.tsx`

**Interfaces:**
- Consumes: `CardFlipTransition` (Task 9).

- [ ] **Step 1: Add `flip` to `REVEAL_TRANSITIONS` and tighten its type**

In `src/app.tsx`, import `CardFlipTransition`:

```ts
import { CardFlipTransition } from './components/reveal/card-flip-transition';
```

Now that all three keys exist, tighten the map back to a full `Record` (no longer `Partial`):

```ts
const REVEAL_TRANSITIONS: Record<OpenAnimation, ComponentType<RevealTransitionProps>> = {
  pages: PageFanTransition,
  envelope: EnvelopeTransition,
  flip: CardFlipTransition,
};
```

- [ ] **Step 2: Update the Name entry in `FLOAT_ITEMS`**

Change:

```ts
  {
    key: 'name',
    label: 'Colby Schulz',
    content: NameCard,
    modal: { title: 'About', content: () => <p>About content coming soon.</p> },
    freezeOnHover: true,
    // 220 × 188/368 = 112px desktop; 150 × 188/368 + 16px padding = 93px mobile
    heights: { desktop: 112, mobile: 93 },
  },
```

to:

```ts
  {
    key: 'name',
    label: 'Colby Schulz',
    content: NameCard,
    modal: { title: 'About', content: () => <p>About content coming soon.</p>, openAnimation: 'flip' },
    freezeOnHover: true,
    // 220 × 188/368 = 112px desktop; 150 × 188/368 + 16px padding = 93px mobile
    heights: { desktop: 112, mobile: 93 },
  },
```

- [ ] **Step 3: Manually verify**

Run: `npm run dev`. Click the Name float item. Confirm the card flips (3D rotateY) while growing to the Modal's size/position, then the Modal takes over showing the (placeholder) About content. Click "cool" to close and confirm it behaves as before.

Also re-verify Resume and Contact once more end-to-end now that all three share the same `REVEAL_TRANSITIONS` map and `FLOAT_ITEMS` shape.

- [ ] **Step 4: Run the full test suite and build**

Run: `npx vitest run`
Expected: all tests PASS

Run: `npm run build`
Expected: succeeds with no TypeScript errors (this is the first point where the full `FLOAT_ITEMS` config and `REVEAL_TRANSITIONS` map are complete and should typecheck cleanly end-to-end).

- [ ] **Step 5: Commit**

```bash
git add src/app.tsx
git commit -m "feat: wire Name float item to card-flip transition"
```

---

## Out of scope (carried over from the design spec)

- Mirrored reverse animations on close.
- PDF viewer zoom, search, or thumbnails.
- Page-turn-as-reader interaction (continuous scroll only).
- Filling in real About/Contact content (`content/bio.md`, `content/interests.md` already exist as source material for that separate work).
- Mobile-specific sizing adjustments beyond what CSS handles naturally.
