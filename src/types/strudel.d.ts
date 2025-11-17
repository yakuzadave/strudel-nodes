declare module '@strudel/core' {
  export type StrudelRepl = {
    evaluate: (code: string) => Promise<unknown>;
    scheduler?: { stop?: () => void };
  };

  export function repl(config: {
    defaultOutput?: unknown;
    getTime?: () => number;
  }): StrudelRepl;

  export function evaluate(
    code: string,
    runtime?: unknown
  ): Promise<{ pattern: unknown }>;

  export function evalScope(...args: unknown[]): void;

  export class Pattern {
    [key: string]: unknown;
  }

  export function note(value: string): unknown;
  export function silence(): unknown;
  export function ref<T>(fn: () => T): unknown;
  export const mini: unknown;
}

declare module '@strudel/webaudio' {
  export function getAudioContext(): { currentTime: number };
  export function initAudioOnFirstClick(): Promise<void>;
  export function registerSynthSounds(): Promise<void>;
  export function samples(source: string): Promise<unknown>;
  export const webaudioOutput: unknown;
}

declare module '@strudel/tonal' {
  export const tonalHelpers: unknown;
}

declare module '@strudel/xen' {
  const xen: unknown;
  export default xen;
}

declare module '@strudel/transpiler' {
  export const transpiler: unknown;
}

declare module '@strudel/mini/mini.mjs' {
  export const mini: unknown;
  export const m: unknown;
}
