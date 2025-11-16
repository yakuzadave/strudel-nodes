import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NodePalette } from './NodePalette';

afterEach(() => {
  cleanup();
});

describe('NodePalette', () => {
  it('renders all palette buttons', () => {
    render(<NodePalette onAddNode={() => {}} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Pattern/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Transform/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /FX/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Output/ })).toBeDefined();
  });

  it('invokes onAddNode with the selected type', () => {
    const onAddNode = vi.fn();
    render(<NodePalette onAddNode={onAddNode} />);

    fireEvent.click(screen.getByRole('button', { name: /Pattern/ }));
    fireEvent.click(screen.getByRole('button', { name: /Transform/ }));
    fireEvent.click(screen.getByRole('button', { name: /FX/ }));
    fireEvent.click(screen.getByRole('button', { name: /Output/ }));

    expect(onAddNode).toHaveBeenCalledTimes(4);
    expect(onAddNode).toHaveBeenNthCalledWith(1, 'pattern');
    expect(onAddNode).toHaveBeenNthCalledWith(2, 'transform');
    expect(onAddNode).toHaveBeenNthCalledWith(3, 'fx');
    expect(onAddNode).toHaveBeenNthCalledWith(4, 'output');
  });
});
