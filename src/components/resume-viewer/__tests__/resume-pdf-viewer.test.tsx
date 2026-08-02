import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ResumePdfViewer } from '../resume-pdf-viewer';

afterEach(() => cleanup());

vi.mock('react-pdf', () => ({
  pdfjs: { GlobalWorkerOptions: {} as Record<string, unknown> },
  Document: ({
    file,
    onLoadSuccess,
    onLoadError,
    loading,
    children,
  }: {
    file: string;
    onLoadSuccess: (info: { numPages: number }) => void;
    onLoadError: () => void;
    loading?: ReactNode;
    children: ReactNode;
  }) => {
    // 'pending.pdf' never resolves, simulating a still-loading document so
    // tests can inspect the `loading` placeholder's own appearance.
    useEffect(() => {
      if (file === 'pending.pdf') return;
      if (file === 'broken.pdf') onLoadError();
      else onLoadSuccess({ numPages: 3 });
    }, [file, onLoadSuccess, onLoadError]);
    return file === 'pending.pdf' ? <>{loading}</> : <div>{children}</div>;
  },
  Page: ({
    pageNumber,
    width,
    onLoadSuccess,
  }: {
    pageNumber: number;
    width?: number;
    onLoadSuccess?: (page: { originalWidth: number; originalHeight: number }) => void;
  }) => {
    // Mock page aspect ratio of 0.75 (e.g. 600x800), chosen so the tests
    // below land on clean pixel numbers rather than fractional ones.
    useEffect(() => {
      onLoadSuccess?.({ originalWidth: 600, originalHeight: 800 });
    }, [onLoadSuccess]);
    return <div data-testid={`page-${pageNumber}`} data-width={width} />;
  },
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

  it('on a wide-ish viewport, sizes each page by the width budget', () => {
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 700);

    render(<ResumePdfViewer file="resume.pdf" />);

    // widthBudget = min(1000*0.6, 900) = 600; height-derived candidate
    // (560*0.75=420) is smaller, so width wins.
    expect(screen.getByTestId('page-1')).toHaveAttribute('data-width', '600');
    expect(screen.getByTestId('page-3')).toHaveAttribute('data-width', '600');

    vi.unstubAllGlobals();
  });

  it('caps the page width so it does not grow unbounded on very wide viewports', () => {
    vi.stubGlobal('innerWidth', 3000);
    vi.stubGlobal('innerHeight', 800);

    render(<ResumePdfViewer file="resume.pdf" />);

    expect(screen.getByTestId('page-1')).toHaveAttribute('data-width', '900');

    vi.unstubAllGlobals();
  });

  it('on a narrow, tall viewport (mobile), uses the height budget instead of shrinking to the width budget', () => {
    vi.stubGlobal('innerWidth', 400);
    vi.stubGlobal('innerHeight', 800);

    render(<ResumePdfViewer file="resume.pdf" />);

    // widthBudget = min(400*0.6, 900) = 240; height-derived candidate
    // (640*0.75=480) is bigger, so it wins — then clamped to the viewport
    // width ceiling (400*0.92=368) so it never overflows the screen.
    expect(screen.getByTestId('page-1')).toHaveAttribute('data-width', '368');

    vi.unstubAllGlobals();
  });

  it('shows a placeholder already sized like the eventual page while the document is still loading', () => {
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 700);

    render(<ResumePdfViewer file="pending.pdf" />);

    // Same 600px width the real page would use once loaded (see the
    // width-budget test above) — height is a generic document-shaped guess
    // (600 / 0.75 = 800) since the real aspect ratio isn't known yet.
    const skeleton = screen.getByTestId('resume-skeleton');
    expect(skeleton).toHaveStyle({ width: '600px', height: '800px' });

    vi.unstubAllGlobals();
  });
});
