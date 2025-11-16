import { useCallback, useEffect, useRef, useState } from 'react';
// @ts-expect-error - Strudel doesn't have type definitions
import { repl } from '@strudel/core';
// @ts-expect-error - Strudel doesn't have type definitions
import { getAudioContext, initAudioOnFirstClick, webaudioOutput } from '@strudel/webaudio';

type StrudelPlaybackHandle = {
  play?: () => void;
  stop?: () => void;
};

type StrudelRepl = {
  evaluate: (code: string) => Promise<unknown>;
  scheduler?: {
    stop?: () => void;
  };
};

export const useStrudelEngine = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const replRef = useRef<StrudelRepl | null>(null);
  const playbackRef = useRef<StrudelPlaybackHandle | null>(null);

  useEffect(() => {
    const initStrudel = async () => {
      try {
        await initAudioOnFirstClick();
        const strudelRepl = repl({
          defaultOutput: webaudioOutput,
          getTime: () => getAudioContext().currentTime,
        });
        replRef.current = strudelRepl;
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize Strudel:', error);
        setIsLoading(false);
      }
    };

    initStrudel();
  }, []);

  const stopPlayback = useCallback(() => {
    if (!playbackRef.current) {
      return;
    }

    const playable = playbackRef.current;
    playbackRef.current = null;

    if (playable && typeof playable.stop === 'function') {
      try {
        playable.stop();
      } catch (error) {
        console.error('Failed to stop Strudel playback:', error);
      }
    }
  }, []);

  const evaluatePattern = useCallback(
    async (code: string, options?: { markPlaying?: boolean; autoPlay?: boolean }) => {
      if (!replRef.current) {
        throw new Error('Strudel not initialized');
      }

      const result = await replRef.current.evaluate(code);
      const playable =
        result && typeof result === 'object' && ('play' in result || 'stop' in result)
          ? (result as StrudelPlaybackHandle)
          : null;
      const shouldAutoPlay = options?.autoPlay ?? true;
      const shouldMarkPlaying = options?.markPlaying ?? true;

      if (shouldAutoPlay && playable && typeof playable.play === 'function') {
        stopPlayback();
        try {
          playable.play();
          playbackRef.current = playable;
        } catch (error) {
          console.error('Failed to start Strudel playback:', error);
        }
      }

      if (shouldMarkPlaying && (shouldAutoPlay ? Boolean(playable?.play) : true)) {
        setIsPlaying(true);
      }

      return playable ?? result;
    },
    [stopPlayback]
  );

  const stop = useCallback(() => {
    stopPlayback();

    if (!replRef.current) {
      setIsPlaying(false);
      return;
    }

    try {
      replRef.current.scheduler?.stop?.();
    } catch (error) {
      console.error('Failed to stop Strudel scheduler:', error);
    } finally {
      setIsPlaying(false);
    }
  }, [stopPlayback]);

  return {
    isPlaying,
    isLoading,
    stop,
    evaluatePattern,
  };
};
