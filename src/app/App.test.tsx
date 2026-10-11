import { render, screen } from '@testing-library/react';
import { App } from './App';

class FakeWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onclose: (() => void) | null = null;
  close = vi.fn();
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the dashboard heading and the initial connection state', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /fleet operations dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
  });
});
