import { useCallback, useEffect, useRef, useState } from 'react';
import { repl } from '@strudel/core';
import {
  getAudioContext,
  initAudioOnFirstClick,
  registerSynthSounds,
  samples,
  webaudioOutput,
} from '@strudel/webaudio';

const DEFAULT_SAMPLE_MAP = 'github:tidalcycles/dirt-samples';

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

  useEffect(() => {
    const initStrudel = async () => {
      try {
        // Prepare audio context as soon as the user interacts with the page.
        initAudioOnFirstClick().catch((error: unknown) => {
          console.error('Failed to queue Strudel audio init on first click:', error);
        });

        const strudelRepl = repl({
          defaultOutput: webaudioOutput,
          getTime: () => getAudioContext().currentTime,
        });
        replRef.current = strudelRepl;

        await Promise.allSettled([
          samples(DEFAULT_SAMPLE_MAP).catch((error: unknown) => {
            console.error('Failed to load default Strudel samples:', error);
            throw error;
          }),
          registerSynthSounds().catch((error: unknown) => {
            console.error('Failed to register Strudel synth sounds:', error);
            throw error;
          }),
        ]);
        setIsLoading(false);
      } catch (error: unknown) {
        console.error('Failed to initialize Strudel:', error);
        setIsLoading(false);
      }
    };

    initStrudel();
  }, []);

  const evaluatePattern = useCallback(
    async (code: string, options?: { markPlaying?: boolean }) => {
      if (!replRef.current) {
        throw new Error('Strudel not initialized');
      }

      const result = await replRef.current.evaluate(code);
      if (options?.markPlaying ?? true) {
        setIsPlaying(true);
      }
      return result;
    },
    []
  );

  const stop = useCallback(() => {
    if (!replRef.current) {
      setIsPlaying(false);
      return;
    }

    try {
      replRef.current.scheduler?.stop?.();
    } catch (error: unknown) {
      console.error('Failed to stop Strudel scheduler:', error);
    } finally {
      setIsPlaying(false);
    }
  }, []);

  return {
    isPlaying,
    isLoading,
    stop,
    evaluatePattern,
  };
};
