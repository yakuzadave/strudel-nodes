import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@strudel/core', () => ({
  repl: vi.fn(),
}));

const mockAudioContext = { currentTime: 123 };

vi.mock('@strudel/webaudio', () => ({
  getAudioContext: vi.fn(() => mockAudioContext),
  initAudioOnFirstClick: vi.fn(() => Promise.resolve()),
  registerSynthSounds: vi.fn(() => Promise.resolve()),
  samples: vi.fn(() => Promise.resolve()),
  webaudioOutput: Symbol('webaudioOutput'),
}));

import { repl } from '@strudel/core';
import {
  getAudioContext,
  initAudioOnFirstClick,
  registerSynthSounds,
  samples,
  webaudioOutput,
} from '@strudel/webaudio';
import { useStrudelEngine } from './useStrudelEngine';

type MockedRepl = {
  evaluate: ReturnType<typeof vi.fn>;
  scheduler?: { stop?: ReturnType<typeof vi.fn> };
};

const createMockRepl = (): MockedRepl => ({
  evaluate: vi.fn(() => Promise.resolve(undefined)),
  scheduler: { stop: vi.fn() },
});

const mockReplInstance = createMockRepl();
(vi.mocked(repl) as ReturnType<typeof vi.fn>).mockReturnValue(mockReplInstance as never);

const resetMocks = () => {
  mockReplInstance.evaluate = vi.fn(() => Promise.resolve(undefined));
  mockReplInstance.scheduler = { stop: vi.fn() };
  vi.mocked(repl).mockReturnValue(mockReplInstance as never);
  vi.mocked(samples).mockResolvedValue(undefined);
  vi.mocked(registerSynthSounds).mockResolvedValue(undefined);
  vi.mocked(initAudioOnFirstClick).mockResolvedValue(undefined);
};

beforeEach(() => {
  resetMocks();
});

describe('useStrudelEngine', () => {
  it('initializes the Strudel REPL and preloads audio assets', async () => {
    const { result } = renderHook(() => useStrudelEngine());

    expect(initAudioOnFirstClick).toHaveBeenCalled();
    expect(repl).toHaveBeenCalledWith({
      defaultOutput: webaudioOutput,
      getTime: expect.any(Function),
    });

    const getTime = vi.mocked(repl).mock.calls[0][0]?.getTime;
    expect(getTime?.()).toBe(getAudioContext().currentTime);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(samples).toHaveBeenCalledWith('github:tidalcycles/dirt-samples');
    expect(registerSynthSounds).toHaveBeenCalled();
  });

  it('evaluates patterns via the REPL and toggles playing state', async () => {
    const { result } = renderHook(() => useStrudelEngine());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.evaluatePattern('s("bd")');
    });

    expect(mockReplInstance.evaluate).toHaveBeenCalledWith('s("bd")');
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(mockReplInstance.scheduler?.stop).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });

  it('allows evaluatePattern to skip toggling playback when requested', async () => {
    const { result } = renderHook(() => useStrudelEngine());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.evaluatePattern('s("sd")', { markPlaying: false });
    });

    expect(result.current.isPlaying).toBe(false);
  });
});
