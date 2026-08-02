import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './resume-pdf-viewer.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface ResumePdfEngineProps {
  file: string;
  pageWidth: number;
  onReady: () => void;
  onError: () => void;
}

// The actual react-pdf/pdfjs rendering — deliberately owns none of the
// sizing or loading-placeholder logic. ResumeStage (its caller) already
// reserves the correct on-screen footprint before this even mounts, so this
// component only needs to report back: onReady once the first page has
// actually painted (not just loaded metadata), onError if the file fails.
export function ResumePdfEngine({ file, pageWidth, onReady, onError }: ResumePdfEngineProps) {
  const [numPages, setNumPages] = useState<number | null>(null);

  return (
    <Document
      file={file}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      onLoadError={onError}
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
            onRenderSuccess={i === 0 ? onReady : undefined}
          />
        ))}
    </Document>
  );
}
