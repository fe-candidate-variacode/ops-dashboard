import { render, screen } from '@testing-library/react';
import { telemetryStore } from '../telemetryStore';
import { TelemetryStatus } from './TelemetryStatus';

describe('TelemetryStatus', () => {
  afterEach(() => {
    telemetryStore.setState({ connectionStatus: 'connecting', updatesPerSecond: 0 });
  });

  it('shows the connection state as text', () => {
    telemetryStore.setState({ connectionStatus: 'reconnecting' });

    render(<TelemetryStatus />);

    expect(screen.getByText('Reconnecting')).toBeInTheDocument();
  });

  it('shows the current updates per second', () => {
    telemetryStore.setState({ connectionStatus: 'connected', updatesPerSecond: 48 });

    render(<TelemetryStatus />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Updates/s').nextElementSibling).toHaveTextContent('48');
  });
});
