import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './resume-pdf-viewer.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const DEFAULT_FILE = '/resume.pdf';

// react-pdf's default (no size prop) renders at the PDF's native point size
// (~612px wide for a Letter page) — legible but small relative to the
// screen. Render noticeably wider instead: a healthy chunk of the viewport
// width, capped so it doesn't get absurd on very wide screens. The page's
// own aspect ratio determines height, so it can run taller than one screen
// and scroll — that's fine for a multi-page resume.
const PAGE_WIDTH_RATIO = 0.6;
const PAGE_WIDTH_MAX = 900;

function computePageWidth() {
  return Math.min(window.innerWidth * PAGE_WIDTH_RATIO, PAGE_WIDTH_MAX);
}

interface ResumePdfViewerProps {
  file?: string;
}

export function ResumePdfViewer({ file = DEFAULT_FILE }: ResumePdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pageWidth, setPageWidth] = useState(computePageWidth);

  useEffect(() => {
    const handleResize = () => setPageWidth(computePageWidth());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            <Page key={i} pageNumber={i + 1} width={pageWidth} className={styles.page} />
          ))}
      </Document>
      <a href={file} download className={styles.download}>
        Download PDF
      </a>
    </div>
  );
}
