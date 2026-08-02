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
