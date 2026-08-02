import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { ResumeStage } from '../resume-stage';

afterEach(() => cleanup());

// The real engine is lazy-loaded and does the actual react-pdf work; this
// mock stands in for "the lazy import has resolved and mounted" so these
// tests can focus on what the shell itself is responsible for: sizing the
// stage synchronously (never depending on the lazy engine), and reacting to
// onReady/onError.
vi.mock('../resume-pdf-engine', () => ({
  ResumePdfEngine: ({
    file,
    onReady,
    onError,
  }: {
    file: string;
    pageWidth: number;
    onReady?: () => void;
    onError?: () => void;
  }) => {
    useEffect(() => {
      if (file === 'broken.pdf') onError?.();
      else onReady?.();
    }, [file, onReady, onError]);
    return <div data-testid="engine-mock" />;
  },
}));

describe('ResumeStage', () => {
  it('reserves the correct stage size on the very first render, before the lazy engine resolves', () => {
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 700);

    render(<ResumeStage file="resume.pdf" />);

    // widthBudget = min(1000*0.6, 900) = 600; heightDerivedBudget =
    // 700*0.8*0.75 = 420 (smaller, so width wins); stageHeight = 600/0.75 =
    // 800. This is available synchronously — react-pdf hasn't loaded yet.
    expect(screen.getByTestId('resume-stage')).toHaveStyle({ width: '600px', height: '800px' });

    vi.unstubAllGlobals();
  });

  it('hides the skeleton once the engine reports ready', async () => {
    render(<ResumeStage file="resume.pdf" />);

    // The mocked engine resolves near-instantly (unlike the real lazy
    // import + PDF fetch), so this only proves the wiring: ready flows
    // from the engine's onReady into hiding the skeleton.
    await waitFor(() => {
      expect(screen.getByTestId('resume-skeleton').className).toMatch(/hidden/);
    });
  });

  it('shows an inline error message when the engine reports a load error', async () => {
    render(<ResumeStage file="broken.pdf" />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't load/i)).toBeInTheDocument();
    });
  });

  it('renders a download link to the PDF file', () => {
    render(<ResumeStage file="resume.pdf" />);

    expect(screen.getByRole('link', { name: /download/i })).toHaveAttribute(
      'href',
      'resume.pdf',
    );
  });
});
