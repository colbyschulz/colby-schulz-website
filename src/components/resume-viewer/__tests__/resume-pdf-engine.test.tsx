import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ResumePdfEngine } from '../resume-pdf-engine';

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
  Page: ({
    pageNumber,
    width,
    onRenderSuccess,
  }: {
    pageNumber: number;
    width?: number;
    onRenderSuccess?: () => void;
  }) => {
    useEffect(() => {
      onRenderSuccess?.();
    }, [onRenderSuccess]);
    return <div data-testid={`page-${pageNumber}`} data-width={width} />;
  },
}));

describe('ResumePdfEngine', () => {
  it('renders one Page per page reported by the PDF, at the given width', () => {
    render(
      <ResumePdfEngine file="resume.pdf" pageWidth={555} onReady={vi.fn()} onError={vi.fn()} />,
    );

    expect(screen.getByTestId('page-1')).toHaveAttribute('data-width', '555');
    expect(screen.getByTestId('page-2')).toHaveAttribute('data-width', '555');
    expect(screen.getByTestId('page-3')).toHaveAttribute('data-width', '555');
  });

  it('calls onReady once the first page has rendered', async () => {
    const onReady = vi.fn();
    render(
      <ResumePdfEngine file="resume.pdf" pageWidth={555} onReady={onReady} onError={vi.fn()} />,
    );

    await waitFor(() => expect(onReady).toHaveBeenCalledOnce());
  });

  it('calls onError when the PDF fails to load', async () => {
    const onError = vi.fn();
    render(
      <ResumePdfEngine file="broken.pdf" pageWidth={555} onReady={vi.fn()} onError={onError} />,
    );

    await waitFor(() => expect(onError).toHaveBeenCalledOnce());
  });
});
