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

        const results = await Promise.allSettled([
          samples(DEFAULT_SAMPLE_MAP).catch((error) => {
            console.error('Failed to load default Strudel samples:', error);
          }),
          registerSynthSounds().catch((error) => {
            console.error('Failed to register Strudel synth sounds:', error);
          }),
        ]);
        const rejected = results.filter(r => r.status === 'rejected');
        if (rejected.length > 0) {
          rejected.forEach((r, i) => {
            console.error(`Strudel initialization promise ${i} failed:`, r.reason);
          });
          // Optionally, you could throw here to trigger the outer catch block:
          // throw new Error('One or more Strudel initialization steps failed');
        }
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
