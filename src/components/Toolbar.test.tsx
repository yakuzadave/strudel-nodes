import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toolbar } from './Toolbar';

type ToolbarProps = ComponentProps<typeof Toolbar>;

afterEach(() => {
  cleanup();
});

function createProps(overrides: Partial<ToolbarProps> = {}): ToolbarProps {
  return {
    isPlaying: false,
    isLoading: false,
    darkMode: false,
    snapToGrid: true,
    onPlay: vi.fn(),
    onStop: vi.fn(),
    onToggleDarkMode: vi.fn(),
    onToggleSnapToGrid: vi.fn(),
    onSave: vi.fn(),
    onLoad: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };
}

describe('Toolbar', () => {
  it('renders the play button when idle and invokes onPlay', () => {
    const props = createProps();
    render(<Toolbar {...props} />);

    const playButton = screen.getByRole('button', { name: /Play/ });
    expect((playButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(playButton);
    expect(props.onPlay).toHaveBeenCalledTimes(1);
  });

  it('shows the stop button while playing and invokes onStop', () => {
    const props = createProps({ isPlaying: true });
    render(<Toolbar {...props} />);

    const stopButton = screen.getByRole('button', { name: /Stop/ });
    expect((stopButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(stopButton);
    expect(props.onStop).toHaveBeenCalledTimes(1);
  });

  it('disables the transport button while loading', () => {
    const props = createProps({ isLoading: true });
    render(<Toolbar {...props} />);

    const playButton = screen.getByRole('button', { name: /Play/ });
    expect((playButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('forwards toggle and utility button events', () => {
    const props = createProps();
    render(<Toolbar {...props} />);

    fireEvent.click(screen.getByLabelText('Snap to Grid'));
    fireEvent.click(screen.getByLabelText('Dark Mode'));
    fireEvent.click(screen.getByRole('button', { name: /Save Patch/ }));
    fireEvent.click(screen.getByRole('button', { name: /Load Patch/ }));
    fireEvent.click(screen.getByRole('button', { name: /Clear/ }));

    expect(props.onToggleSnapToGrid).toHaveBeenCalledTimes(1);
    expect(props.onToggleDarkMode).toHaveBeenCalledTimes(1);
    expect(props.onSave).toHaveBeenCalledTimes(1);
    expect(props.onLoad).toHaveBeenCalledTimes(1);
    expect(props.onClear).toHaveBeenCalledTimes(1);
  });
});
