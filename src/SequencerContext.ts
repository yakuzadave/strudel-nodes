import { createContext } from 'react';

/**
 * Context used to provide preview functionality and playing node state
 * to Strudel node components. Each node can call `previewNode` with its
 * identifier to trigger a one-shot preview of its pattern, and can
 * inspect the `playingNodes` set to determine if it should render in
 * an active state.
 */
export interface SequencerContextValue {
  /**
   * Preview a single node's code by id. Components should call this when
   * the user requests to hear a quick audition of a pattern, transform
   * or FX. Implementation lives in App.tsx.
   */
  previewNode: (id: string) => Promise<void> | void;
  /**
   * A set of node identifiers that are currently playing back.
   */
  playingNodes: Set<string>;
}

export const SequencerContext = createContext<SequencerContextValue | null>(null);
