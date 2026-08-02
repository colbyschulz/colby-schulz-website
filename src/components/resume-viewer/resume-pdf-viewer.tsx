import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './resume-pdf-viewer.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

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
// every size calculation (not just the loading placeholder). Using the
// PDF's own real aspect ratio, once known, seemed more "correct" but caused
// the whole viewer to resize mid-load whenever it differed from this guess,
// which read as a jump. A fixed assumption throughout means the size is
// identical from the very first frame to the fully-loaded one — no jump,
// at the cost of (in practice negligible) precision for unusually-shaped
// documents.
const ASSUMED_ASPECT_RATIO = 0.75;

function computePageWidth() {
  const widthBudget = Math.min(window.innerWidth * PAGE_WIDTH_RATIO, PAGE_WIDTH_MAX);
  const heightDerivedBudget = window.innerHeight * PAGE_HEIGHT_RATIO * ASSUMED_ASPECT_RATIO;
  const target = Math.max(widthBudget, heightDerivedBudget);
  return Math.round(Math.min(target, window.innerWidth * VIEWPORT_WIDTH_CEILING_RATIO));
}

interface ResumePdfViewerProps {
  file?: string;
}

export function ResumePdfViewer({ file = DEFAULT_FILE }: ResumePdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pageWidth, setPageWidth] = useState(computePageWidth);
  // True once the first page has actually painted (react-pdf's
  // onRenderSuccess), not just once its metadata loaded — painting is what
  // makes it safe to reveal, and what makes fading the skeleton out feel
  // like content appearing rather than a page popping into a blank spot.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const recompute = () => setPageWidth(computePageWidth());
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, []);

  if (loadError) {
    return <p className={styles.error}>Couldn&apos;t load the resume PDF.</p>;
  }

  // Reserves the same footprint the first page will use, so Modal's
  // content-driven size doesn't jump once the PDF actually loads. Stays
  // fixed-height (clipping the still-rendering pages underneath) until
  // ready, then relaxes to auto so the rest of the pages can stack normally.
  const stageHeight = Math.round(pageWidth / ASSUMED_ASPECT_RATIO);

  return (
    <div className={styles.viewer}>
      <div
        data-testid="resume-stage"
        className={styles.stage}
        style={{ width: pageWidth, height: ready ? undefined : stageHeight }}
      >
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={() => setLoadError(true)}
          loading={null}
        >
          {numPages !== null &&
            Array.from({ length: numPages }, (_, i) => (
              <Page
                key={i}
                pageNumber={i + 1}
                width={pageWidth}
                className={styles.page}
                loading={null}
                onRenderSuccess={i === 0 ? () => setReady(true) : undefined}
              />
            ))}
        </Document>
        <div
          data-testid="resume-skeleton"
          className={`${styles.skeleton}${ready ? ` ${styles.hidden}` : ''}`}
        />
      </div>
      <a href={file} download className={styles.download}>
        Download PDF
      </a>
    </div>
  );
}
