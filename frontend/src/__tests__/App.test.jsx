import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App.jsx';

// Mock the API module
vi.mock('../api.js', () => ({
  api: {
    machines: {
      list: vi.fn().mockResolvedValue({ machines: [] }),
      register: vi.fn().mockResolvedValue({ machine: { id: '1', name: 'Test', daemonUrl: 'http://localhost:5001' } }),
      remove: vi.fn().mockResolvedValue({ status: 'removed' }),
    },
    execute: vi.fn(),
    context: {
      get: vi.fn().mockResolvedValue({ context: {} }),
      set: vi.fn(),
      delete: vi.fn(),
    },
  },
  createWS: vi.fn(() => ({ onmessage: null, close: vi.fn() })),
}));

describe('App', () => {
  it('renders header', async () => {
    render(<App />);
    expect(screen.getByText('Multi-AI CLI Framework')).toBeInTheDocument();
  });

  it('shows tabs', async () => {
    render(<App />);
    // Use role=button and look for tab buttons specifically
    const buttons = screen.getAllByRole('button');
    const tabLabels = buttons.map((b) => b.textContent);
    expect(tabLabels.some((t) => t.includes('Run'))).toBe(true);
    expect(tabLabels.some((t) => t.includes('Machines'))).toBe(true);
    expect(tabLabels.some((t) => t.includes('History'))).toBe(true);
  });

  it('shows agent buttons', async () => {
    render(<App />);
    expect(screen.getByText('GitHub Copilot')).toBeInTheDocument();
    expect(screen.getByText('OpenAI Codex')).toBeInTheDocument();
    expect(screen.getByText('Anthropic Claude')).toBeInTheDocument();
    expect(screen.getByText('Google Gemini')).toBeInTheDocument();
  });

  it('disables Run button when no machine selected', async () => {
    render(<App />);
    const runBtn = screen.getByText('Run Prompt');
    expect(runBtn).toBeDisabled();
  });

  it('switches to Machines tab', async () => {
    render(<App />);
    // Click the tab button (has class tab-btn)
    const tabButtons = screen.getAllByRole('button', { name: /Machines/i });
    // The tab-btn one is the one that switches the view
    fireEvent.click(tabButtons[0]);
    expect(screen.getByText('Registered Machines')).toBeInTheDocument();
  });

  it('switches to History tab', async () => {
    render(<App />);
    const historyTabBtn = screen.getByText('📜 History');
    fireEvent.click(historyTabBtn);
    expect(screen.getByText('Run History')).toBeInTheDocument();
  });

  it('opens settings modal', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Settings/));
    expect(screen.getByText('Backend URL (leave empty to use same origin)')).toBeInTheDocument();
  });

  it('shows validation error when registering without daemonUrl', async () => {
    render(<App />);
    const tabButtons = screen.getAllByRole('button', { name: /Machines/i });
    fireEvent.click(tabButtons[0]);
    fireEvent.click(screen.getByText('+ Register Machine'));
    await waitFor(() => {
      expect(screen.getByText('Daemon URL is required')).toBeInTheDocument();
    });
  });
});
