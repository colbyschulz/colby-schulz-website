import { lazy, Suspense, useEffect, useState } from 'react';
import type { ModalContentProps } from '@/app';
import styles from './resume-pdf-viewer.module.scss';

// Lazy-loaded so react-pdf/pdfjs-dist ship in a separate chunk, fetched only
// when a visitor actually opens the Resume modal, instead of in the main
// entry bundle every visitor downloads. This is safe to gate behind an
// empty Suspense fallback specifically because ResumeStage below reserves
// the stage's size itself, synchronously, independent of whether this lazy
// import has resolved — see the note on `.stage` further down.
const ResumePdfEngine = lazy(() =>
  import('./resume-pdf-engine').then((m) => ({ default: m.ResumePdfEngine })),
);

const DEFAULT_FILE = '/colby-schulz-resume.pdf';

// react-pdf's default (no size prop) renders at the PDF's native point size
// (~612px wide for a Letter page) — legible but small relative to the
// screen. Instead, size to whichever is bigger: a ratio of viewport width
// (what actually matters on wide desktop windows) or a ratio of viewport
// height converted through an assumed aspect ratio (what matters on narrow,
// tall mobile screens, where Modal goes full-height and there's a lot more
// vertical room than horizontal). Either way, clamp to a ceiling just under
// the actual viewport width so it never overflows the screen. The page can
// still run taller than one view and scroll — normal for a multi-page resume.
const PAGE_WIDTH_RATIO = 0.6;
const PAGE_WIDTH_MAX = 900;
const PAGE_HEIGHT_RATIO = 0.8;
const VIEWPORT_WIDTH_CEILING_RATIO = 0.92;

// Resumes are consistently Letter/A4-ish — one fixed assumption used for
// every size calculation. Using the PDF's own real aspect ratio, once
// known, seemed more "correct" but caused the whole viewer to resize
// mid-load whenever it differed from this guess, which read as a jump. A
// fixed assumption throughout means the size is identical from the very
// first frame to the fully-loaded one — no jump, at the cost of (in
// practice negligible) precision for unusually-shaped documents.
const ASSUMED_ASPECT_RATIO = 0.75;

function computePageWidth() {
  const widthBudget = Math.min(window.innerWidth * PAGE_WIDTH_RATIO, PAGE_WIDTH_MAX);
  const heightDerivedBudget = window.innerHeight * PAGE_HEIGHT_RATIO * ASSUMED_ASPECT_RATIO;
  const target = Math.max(widthBudget, heightDerivedBudget);
  return Math.round(Math.min(target, window.innerWidth * VIEWPORT_WIDTH_CEILING_RATIO));
}

interface ResumeStageProps extends ModalContentProps {
  file?: string;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

// This component is imported eagerly (not lazy) from app.tsx, specifically
// so it's available on the very first render with zero async dependency —
// unlike the previous design, where the *whole* viewer was lazy-loaded and
// Modal (which sizes itself to its content) was empty, and therefore tiny,
// for as long as that chunk took to fetch. That empty-then-full swap was
// the real jump: fast/cached loads hid it, a real first-time network fetch
// didn't.
//
// The fix: this shell's own size never depends on anything async. It
// computes and reserves the stage's final width/height synchronously on
// mount (computePageWidth has no dependency on load state at all), so Modal
// is correctly sized from frame one — before the lazy engine below has even
// started fetching. The engine mounting inside an already-correctly-sized
// box is what makes an empty Suspense fallback safe here.
export function ResumeStage({ file = DEFAULT_FILE, onHeaderActionsChange }: ResumeStageProps) {
  const [pageWidth, setPageWidth] = useState(computePageWidth);
  // True once the first page has actually painted (the engine's onReady,
  // driven by react-pdf's onRenderSuccess) — painting is what makes it
  // safe to reveal, and what makes fading the skeleton out feel like
  // content appearing rather than a page popping into a blank spot.
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const recompute = () => setPageWidth(computePageWidth());
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, []);

  const zoomControls = (
    <div className={styles.zoomControls}>
      <button
        type="button"
        className={styles.zoomButton}
        onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
        disabled={!ready || zoom <= ZOOM_MIN}
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        className={styles.zoomLabel}
        onClick={() => setZoom(1)}
        disabled={!ready}
        aria-label="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        className={styles.zoomButton}
        onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
        disabled={!ready || zoom >= ZOOM_MAX}
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );

  // Reported into Modal's header (see ModalContentProps) rather than
  // rendered inline — a sticky element inside the scrolling body either
  // shows text through it or clips it awkwardly at the edges, since the
  // controls float over a document that's actively scrolling underneath.
  useEffect(() => {
    onHeaderActionsChange?.(loadError ? null : zoomControls);
    return () => onHeaderActionsChange?.(null);
    // zoomControls is a fresh element every render (by design, it closes
    // over zoom/ready) — depend on the primitives that actually change it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, ready, loadError, onHeaderActionsChange]);

  if (loadError) {
    return <p className={styles.error}>Couldn&apos;t load the resume PDF.</p>;
  }

  // Stays fixed-height (clipping the still-rendering pages underneath)
  // until ready, then relaxes to auto so the rest of the pages can stack
  // normally for continuous scroll.
  const stageHeight = Math.round(pageWidth / ASSUMED_ASPECT_RATIO);
  // Zoom is locked to 1 until ready (buttons below are disabled), so this
  // always matches pageWidth during the reserved-size loading phase — no
  // jump risk from the two diverging.
  const displayWidth = Math.round(pageWidth * zoom);

  return (
    <div className={styles.viewer}>
      <div className={styles.scrollArea}>
        <div
          data-testid="resume-stage"
          className={styles.stage}
          style={{
            width: displayWidth,
            height: ready ? undefined : stageHeight,
            // The stage is normally capped to its container's width (see
            // .stage in the stylesheet) so an over-estimated computePageWidth
            // never overflows the modal. Zooming in is an intentional
            // request to exceed that fit, so it lifts the cap and relies on
            // .scrollArea for horizontal scrolling instead.
            maxWidth: zoom > 1 ? 'none' : undefined,
          }}
        >
          <Suspense fallback={null}>
            <ResumePdfEngine
              file={file}
              pageWidth={displayWidth}
              onReady={() => setReady(true)}
              onError={() => setLoadError(true)}
            />
          </Suspense>
          <div
            data-testid="resume-skeleton"
            className={`${styles.skeleton}${ready ? ` ${styles.hidden}` : ''}`}
          />
        </div>
      </div>

      <a href={file} download className={styles.download}>
        Download PDF
      </a>
    </div>
  );
}
