# Modal Feature Design

## Problem

Float items are clickable labels ("Colby Schulz", "Resume", "Chatbot", "Links") bouncing around the screen, but clicking them does nothing. There's no way to surface content to the user.

## Goal

Build a reusable, config-driven modal system. Clicking a float item opens a full-screen frosted glass modal that displays any React component. The modal animates in from the clicked item's position and collapses back into it on close.

## Design

### Modal component

**Files:** `src/components/modal/modal.tsx`, `src/components/modal/modal.module.scss`, `src/components/modal/modal.types.ts`

Uses Radix UI Dialog primitive for accessibility (focus trapping, ARIA attributes, keyboard navigation).

**Props:**
- `open: boolean` — controlled open state
- `onClose: () => void` — called when "cool" button is clicked
- `title: string` — header text
- `origin: { x: number, y: number }` — click coordinates, used as `transform-origin` for animation
- `children: ReactNode` — modal content

**Overlay:**
- Full-screen, rendered via portal
- `backdrop-filter: blur(12px)` with dark semi-transparent background
- Blocks all interaction with elements underneath
- Clicking the overlay does NOT close the modal — only the "cool" button does

**Content panel:**
- Centered, approximately 90vw x 85vh
- Frosted glass aesthetic matching the chat panel (dark semi-transparent background, `backdrop-filter: blur`, glowing border)
- Title in a header area at the top
- Scrollable content area
- "cool" button at the bottom as the sole dismiss mechanism — no "X" button, no close-on-click-outside

**Animation:**
- CSS transition using `transform-origin` set to the `origin` coordinates
- Open: `scale(0) opacity(0)` -> `scale(1) opacity(1)`
- Close: reverse, `scale(1) opacity(1)` -> `scale(0) opacity(0)`
- Duration: ~300ms ease-out for open, ~200ms ease-in for close
- On close, the `onClose` callback fires after the transition completes (via `transitionend` event)

### FloatItem changes

**Files:** `src/components/float/float-item.tsx`, `src/components/float/float-types.ts`

Add optional `onClick` prop to `FloatItemProps`:

```ts
onClick?: (origin: { x: number; y: number }) => void;
```

When `onClick` is provided:
- The item renders with `cursor: pointer`
- On click, it reads `getBoundingClientRect()`, calculates the center point, and calls `onClick({ x: centerX, y: centerY })`

When `onClick` is not provided:
- No click behavior, no pointer cursor — item is purely decorative

The float item has no knowledge of modals.

### App orchestration

**File:** `src/app.tsx`

**Config array** replaces individual `<FloatItem>` JSX blocks:

```ts
interface FloatItemConfig {
  key: string;
  label: string;
  modal?: {
    title: string;
    content: ComponentType;
  };
}

const FLOAT_ITEMS: FloatItemConfig[] = [
  { key: 'name', label: 'Colby Schulz', modal: { title: 'About', content: AboutContent } },
  { key: 'resume', label: 'Resume', modal: { title: 'Resume', content: ResumeContent } },
  { key: 'chatbot', label: 'Chatbot', modal: { title: 'Chat', content: Chat } },
  { key: 'links', label: 'Links' },  // no modal, not clickable
];
```

**State:**
- `activeModal: { key: string; origin: { x: number; y: number } } | null`

**Flow:**
1. Float items render in a loop from `FLOAT_ITEMS`
2. Items with `modal` config get an `onClick` handler; items without do not
3. On click: set `activeModal` with the item's key and origin coordinates, freeze that float item
4. A single `<Modal>` instance renders when `activeModal` is set, pulling `title` and `content` from the matching config entry
5. On "cool" click: close animation plays, then `activeModal` clears and the float item unfreezes

**Freeze/unfreeze timing:**
- Open: freeze the clicked item immediately, then animate modal in
- Close: animate modal back to origin, then unfreeze the item after animation completes

### Files summary

- **Create:** `src/components/modal/modal.tsx`, `src/components/modal/modal.module.scss`, `src/components/modal/modal.types.ts`
- **Modify:** `src/components/float/float-item.tsx`, `src/components/float/float-types.ts`, `src/app.tsx`

### Dependencies

- `@radix-ui/react-dialog` — needs to be installed

### Out of scope

- Specific content components (AboutContent, ResumeContent, etc.) — those are separate work, the modal just renders whatever is passed to it
- Mobile-specific modal sizing adjustments beyond what CSS handles naturally
- Keyboard shortcut to close (Escape) — Radix Dialog handles this by default, but since we want "cool" as the only close mechanism, Escape will be disabled via Radix's `onEscapeKeyDown` preventDefault
