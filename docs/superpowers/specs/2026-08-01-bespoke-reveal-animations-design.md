# Bespoke Reveal Animations & Resume PDF Viewer Design

## Problem

Every float item (Name, Resume, Contact) currently opens the same generic full-screen modal, animating in with a plain `scale(0) -> scale(1)` grow from the click point (see [`2026-03-28-modal-design.md`](./2026-03-28-modal-design.md)). It works but doesn't feel tied to what each item actually is. Separately, the Resume item has no real content yet — `content/resume.md` is a placeholder, and there's no way to view an actual resume PDF.

## Goal

Each float item reveals its content with an animation that matches what the item physically represents:

- **Name** — the card flips over to reveal its content on the back.
- **Contact** — the envelope unfolds like a letter.
- **Resume** — the document unfolds/fans open into its pages, which are the real pages of an actual resume PDF, rendered in a continuous-scroll viewer.

After the bespoke flourish plays, the existing `Modal` component (frosted glass, title, "cool" button, Radix Dialog accessibility) takes over as the container — it is not forked three ways. Only the *opening* motion is bespoke; closing continues to use the Modal's existing close animation for all three items.

Suggested build order: shared plumbing (rect-reporting, transition hand-off, Modal's fade-only mode) plus Resume's page-fan and PDF viewer first, since it's the novel-content case; then Contact's envelope; then Name's card flip.

## Design

### FloatItem: reporting a rect instead of a point

**Files:** `src/components/float/float-item.tsx`, `src/components/float/float-types.ts`

Today `onClick` reports only the click origin's center point, because the existing scale-from-a-point animation doesn't need more. A card flip or envelope unfold needs the icon's actual on-screen size to anchor a same-sized shape at the start of the animation.

```ts
export interface FloatItemOrigin {
  left: number;
  top: number;
  width: number;
  height: number;
}

onClick?: (origin: FloatItemOrigin) => void;
```

`FloatItem` computes this from `getBoundingClientRect()` on click, same as today, just reporting the full rect instead of pre-computing a center point. Consumers that only need a center point (the `Modal`'s close animation) derive it themselves (`left + width / 2`, `top + height / 2`).

### Reveal transition components

**Files (new):**
- `src/components/reveal/card-flip-transition.tsx` + `.module.scss`
- `src/components/reveal/envelope-transition.tsx` + `.module.scss`
- `src/components/reveal/page-fan-transition.tsx` + `.module.scss`

Each is a small, self-contained component that:
- Accepts the clicked item's `FloatItemOrigin` rect and a `done: () => void` callback.
- Renders positioned at that exact rect (`position: fixed`, matching `left/top/width/height`).
- Plays its own CSS/Web Animations transform (flip / envelope-open-and-slide / page-fan) growing from that rect to the same target size and position the Modal itself uses (~90vw x 85vh, centered), so there's no visible jump when the Modal takes over.
- Calls `done()` when the animation completes, so the app can swap it out for the real `Modal`.

These components know nothing about Modal, content, or each other — they're purely "play this shape's opening animation, then report completion."

### App orchestration

**File:** `src/app.tsx`

```ts
interface FloatItemConfig {
  key: string;
  label: string;
  content?: ComponentType<FloatItemContentProps>;
  freezeOnHover?: boolean;
  modal?: {
    title: string;
    content: ComponentType;
    openAnimation: 'flip' | 'envelope' | 'pages';
  };
  heights: { desktop: number; mobile: number };
}
```

**Flow:**
1. Click on a float item with a `modal` config: freeze the item, capture its `FloatItemOrigin` rect, and enter a `revealing` state (not yet `activeModal`).
2. Render the transition component matching `openAnimation`, anchored at the captured rect.
3. On its `done()` callback, switch to `activeModal` (same as today) — the `Modal` renders, using the rect's center point as its existing `origin` prop, with `skipOpenAnimation` set (see below) so it doesn't also play its own grow-from-point animation on top of the bespoke one.
4. Close behaves exactly as it does today: `Modal`'s existing scale-to-point close animation, then unfreeze.

**Reduced motion:** if `prefers-reduced-motion: reduce` is set, skip step 2 entirely — go straight to `activeModal` with the Modal's normal (non-skipped) open animation replaced by a simple fade, no bespoke transition, no scale-grow.

### Modal: fade-only open mode

**Files:** `src/components/modal/modal.tsx`, `src/components/modal/modal.types.ts`

Add an optional prop:

```ts
skipOpenAnimation?: boolean; // default false
```

When `true` (the normal case now, since a bespoke transition already played the opening motion), the content fades in in place instead of scaling from `origin`. When `false` (used only for the reduced-motion path), it plays a simple fade as well — reduced motion never gets the scale-grow either, it's a straight cross-fade. Practically, this means the scale-grow-from-origin *open* animation this component currently has becomes unused after this change; `origin` is retained solely to anchor the *close* animation, which is unchanged.

### Resume PDF viewer

**Files (new):** `src/components/resume-viewer/resume-pdf-viewer.tsx` + `.module.scss`

Renders the actual resume PDF using **react-pdf** (a maintained React wrapper around pdf.js), chosen over a native `<iframe>`/`<embed>` (imposes browser-default PDF chrome, breaks the site's custom aesthetic) and over hand-rolled pdf.js canvas code (significantly more to build/maintain for no benefit here, since we don't need zoom/search/thumbnails).

- `<Document file="/resume.pdf">` with one `<Page>` per page number, stacked for continuous scroll (no pagination controls, per earlier decision).
- Requires configuring pdf.js's worker for Vite: `pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()`.
- Below the rendered pages, a plain "Download PDF" link to the same `/resume.pdf` file.
- **Error handling:** if the PDF fails to load (missing file, parse error), render an inline error message in place of the pages rather than a blank or broken panel.

This is used as the `content` for the Resume item's `modal` config, replacing the current placeholder.

### Asset

**File:** `public/resume.pdf` (new, user-supplied — not generated as part of this work). Served directly by Vite as a static asset at `/resume.pdf`.

### Dependency

- `react-pdf` (add to `package.json`) — pulls in `pdfjs-dist` as a dependency.

### Files summary

**Create:**
- `src/components/reveal/card-flip-transition.tsx`, `.module.scss`
- `src/components/reveal/envelope-transition.tsx`, `.module.scss`
- `src/components/reveal/page-fan-transition.tsx`, `.module.scss`
- `src/components/resume-viewer/resume-pdf-viewer.tsx`, `.module.scss`
- `public/resume.pdf` (asset, supplied by user before implementation)

**Modify:**
- `src/app.tsx` — `FLOAT_ITEMS` config (`openAnimation` per item, Resume's `content` set to `ResumePdfViewer`), revealing/active-modal orchestration, reduced-motion check
- `src/components/float/float-item.tsx`, `src/components/float/float-types.ts` — `onClick` reports a rect instead of a point
- `src/components/modal/modal.tsx`, `src/components/modal/modal.types.ts` — add `skipOpenAnimation` prop, open animation becomes fade-only
- `package.json` — add `react-pdf`

### Testing

- Vitest component test for `ResumePdfViewer`: renders pages given a valid PDF, shows the inline error state when loading fails.
- Vitest test that each `FLOAT_ITEMS` entry's `openAnimation` maps to the correct transition component being rendered on click.
- Vitest test that under `prefers-reduced-motion: reduce`, the bespoke transition is skipped and the Modal fades in directly.
- Animation timing/visual correctness (the actual flip/fan/unfold motion) is not practical to unit test and won't be faked with brittle snapshot tests.

## Out of scope

- Mirrored reverse animations on close (all three items keep the existing simple close animation).
- PDF viewer zoom, search, or thumbnails.
- Page-turn-as-reader interaction for the resume (continuous scroll only, per earlier decision).
- Drag/resize "window" behavior (considered as an alternative concept, not chosen).
- Mobile-specific sizing adjustments beyond what CSS handles naturally (consistent with the original modal spec's scoping).
