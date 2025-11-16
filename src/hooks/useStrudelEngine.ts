import { useCallback, useEffect, useRef, useState } from 'react';
// @ts-expect-error - Strudel doesn't have type definitions
import { repl } from '@strudel/core';
// @ts-expect-error - Strudel doesn't have type definitions
import { getAudioContext, initAudioOnFirstClick, webaudioOutput } from '@strudel/webaudio';

export const useStrudelEngine = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const replRef = useRef<unknown>(null);

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

  const evaluatePattern = useCallback(
    async (code: string, options?: { markPlaying?: boolean }) => {
      if (!replRef.current) {
        throw new Error('Strudel not initialized');
      }

      const result = await (replRef.current as { evaluate: (code: string) => Promise<unknown> }).evaluate(code);
      if (options?.markPlaying ?? true) {
        setIsPlaying(true);
      }
      return result;
    },
    []
  );

  const stop = useCallback(() => {
    if (!replRef.current) return;
    
    try {
      (replRef.current as { scheduler: { stop: () => void } }).scheduler.stop();
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  }, []);

  return {
    isPlaying,
    isLoading,
    stop,
    evaluatePattern,
  };
};
