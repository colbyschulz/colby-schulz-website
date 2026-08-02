import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
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
    children,
  }: {
    file: string;
    onLoadSuccess: (info: { numPages: number }) => void;
    onLoadError: () => void;
    children: ReactNode;
  }) => {
    // 'pending.pdf' never resolves, simulating a still-loading document.
    useEffect(() => {
      if (file === 'pending.pdf') return;
      if (file === 'broken.pdf') onLoadError();
      else onLoadSuccess({ numPages: 3 });
    }, [file, onLoadSuccess, onLoadError]);
    return <div>{children}</div>;
  },
  Page: ({
    pageNumber,
    width,
    onRenderSuccess,
  }: {
    pageNumber: number;
    width?: number;
    onRenderSuccess?: () => void;
  }) => {
    // onRenderSuccess is deferred (not fired synchronously on mount) so
    // tests can observe the real "mounted but not yet rendered" gap.
    useEffect(() => {
      const timer = setTimeout(() => onRenderSuccess?.(), 20);
      return () => clearTimeout(timer);
    }, [onRenderSuccess]);
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

  it('reserves a stage sized like the eventual page while the document is still loading', () => {
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 700);

    render(<ResumePdfViewer file="pending.pdf" />);

    // Same 600px width the real page uses once loaded (see the width-budget
    // test above) — height is 600 / 0.75 = 800, the same fixed assumption
    // used everywhere, not just here, so this never has to change later.
    expect(screen.getByTestId('resume-stage')).toHaveStyle({ width: '600px', height: '800px' });
    expect(screen.getByTestId('resume-skeleton').className).not.toMatch(/hidden/);

    vi.unstubAllGlobals();
  });

  it('keeps the skeleton visible until the first page has actually rendered', () => {
    render(<ResumePdfViewer file="resume.pdf" />);

    // onRenderSuccess is deferred in the mock, so it hasn't fired yet here.
    expect(screen.getByTestId('resume-skeleton').className).not.toMatch(/hidden/);
  });

  it('fades out the skeleton once the first page has rendered', async () => {
    render(<ResumePdfViewer file="resume.pdf" />);

    await waitFor(() => {
      expect(screen.getByTestId('resume-skeleton').className).toMatch(/hidden/);
    });
  });

  it('does not change the stage width between the initial render and once the page has rendered', async () => {
    // A narrow, tall viewport, where the height-derived budget dominates —
    // the case that most exposed the old bug (sizing depended on the real
    // PDF's aspect ratio, which only became known after mount, so the stage
    // would resize once that arrived instead of staying put).
    vi.stubGlobal('innerWidth', 400);
    vi.stubGlobal('innerHeight', 800);

    render(<ResumePdfViewer file="resume.pdf" />);
    const initialWidth = screen.getByTestId('resume-stage').style.width;

    await waitFor(() => {
      expect(screen.getByTestId('resume-skeleton').className).toMatch(/hidden/);
    });

    expect(screen.getByTestId('resume-stage').style.width).toBe(initialWidth);

    vi.unstubAllGlobals();
  });
});
