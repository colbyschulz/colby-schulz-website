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
  Page: ({ pageNumber, width }: { pageNumber: number; width?: number }) => (
    <div data-testid={`page-${pageNumber}`} data-width={width} />
  ),
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

  it('sizes each page to a ratio of the viewport width so pages read as bigger', () => {
    vi.stubGlobal('innerWidth', 1000);

    render(<ResumePdfViewer file="resume.pdf" />);

    expect(screen.getByTestId('page-1')).toHaveAttribute('data-width', '600');
    expect(screen.getByTestId('page-3')).toHaveAttribute('data-width', '600');

    vi.unstubAllGlobals();
  });

  it('caps the page width so it does not grow unbounded on very wide viewports', () => {
    vi.stubGlobal('innerWidth', 3000);

    render(<ResumePdfViewer file="resume.pdf" />);

    expect(screen.getByTestId('page-1')).toHaveAttribute('data-width', '900');

    vi.unstubAllGlobals();
  });
});
