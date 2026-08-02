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
  Page: ({ pageNumber }: { pageNumber: number }) => <div data-testid={`page-${pageNumber}`} />,
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
});
