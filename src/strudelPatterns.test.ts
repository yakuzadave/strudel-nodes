import { beforeAll, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { transpiler } from '@strudel/transpiler';
import { evalScope } from '@strudel/core';
import * as strudel from '@strudel/core';
import * as webaudio from '@strudel/webaudio';
import { mini, m } from '@strudel/mini/mini.mjs';
import * as tonalHelpers from '@strudel/tonal';
import '@strudel/xen';

class MockedNode {
  chain() {
    return this;
  }
  connect() {
    return this;
  }
  toDestination() {
    return this;
  }
  set() {
    return this;
  }
  start() {
    return this;
  }
}

const mockNode = () => new MockedNode();
const id = <T>(value: T) => value;

const toneHelpersMocked = {
  FeedbackDelay: MockedNode,
  MembraneSynth: MockedNode,
  NoiseSynth: MockedNode,
  MetalSynth: MockedNode,
  Synth: MockedNode,
  PolySynth: MockedNode,
  Chorus: MockedNode,
  Freeverb: MockedNode,
  Gain: MockedNode,
  Reverb: MockedNode,
  vol: mockNode,
  out: id,
  osc: id,
  samples: id,
  adsr: id,
  getDestination: id,
  players: mockNode,
  sampler: mockNode,
  synth: mockNode,
  piano: mockNode,
  polysynth: mockNode,
  fmsynth: mockNode,
  membrane: mockNode,
  noise: mockNode,
  metal: mockNode,
  lowpass: mockNode,
  highpass: mockNode,
};

const noop = () => {};
const uiHelpersMocked = { backgroundImage: id };
const canvasCtx = {
  clearRect: noop,
  fillText: noop,
  fillRect: noop,
  canvas: { width: 100, height: 100 },
};
const audioCtx = { currentTime: 1 };
const getDrawContext = () => canvasCtx;
const getAudioContext = () => audioCtx;
const loadSoundfont = noop;
const loadCsound = noop;
const loadCSound = noop;
const loadcsound = noop;
const midin = () => () => strudel.ref(() => 0);
const sysex = () => {};

[
  'osc',
  'csound',
  'tone',
  'webdirt',
  'pianoroll',
  'speak',
  'wave',
  'filter',
  'adsr',
  'webaudio',
  'soundfont',
  'tune',
  'midi',
  '_scope',
  '_spiral',
  '_pitchwheel',
  '_pianoroll',
  '_spectrum',
  'markcss',
  'p',
].forEach((method) => {
  const patternPrototype = (strudel.Pattern as unknown as { prototype: Record<string, unknown> }).prototype;
  patternPrototype[method] = function patternPassthrough() {
    return this;
  };
});

const NOTE_ALIAS_TO_CANONICAL = {
  c: 'c',
  cs: 'c#',
  db: 'db',
  d: 'd',
  ds: 'd#',
  eb: 'eb',
  e: 'e',
  f: 'f',
  fs: 'f#',
  gb: 'gb',
  g: 'g',
  gs: 'g#',
  ab: 'ab',
  a: 'a',
  as: 'a#',
  bb: 'bb',
  b: 'b',
} as const;

const registerNoteConstants = () => {
  const octaves = Array.from({ length: 9 }, (_, i) => i);
  octaves.forEach((octave) => {
    Object.entries(NOTE_ALIAS_TO_CANONICAL).forEach(([alias, canonical]) => {
      const noteName = `${canonical}${octave}`;
      const key = `${alias}${octave}`;
      // @ts-expect-error - assigning Strudel note helpers to the runtime scope
      globalThis[key] = strudel.note(noteName);
    });
  });
  // @ts-expect-error - allow shorthand rest helper that Strudel tunes use
  globalThis.r = strudel.silence;
};

const PATTERN_DEFINITIONS = {
  timeCatMini: `stack(
  "c3@3 [eb3, g3, [c4 d4]/2]",
  "c2 g2",
  "[eb4@5 [f4 eb4 d4]@3] [eb4 c4]/2".slow(8)
)`,
  timeCat: `stack(
  timeCat([3, c3], [1, stack(eb3, g3, seq(c4, d4).slow(2))]),
  seq(c2, g2),
  seq(
    timeCat([5, eb4], [3, seq(f4, eb4, d4)]), 
    seq(eb4, c4).slow(2)
  ).slow(4)
)`,
  shapeShifted: `stack(
  seq(
    e5, [b4, c5], d5, [c5, b4],
    a4, [a4, c5], e5, [d5, c5],
    b4, [r, c5], d5, e5,
    c5, a4, a4, r,
    [r, d5], [r, f5], a5, [g5, f5],
    e5, [r, c5], e5, [d5, c5],
    b4, [b4, c5], d5, e5,
    c5, a4, a4, r,
  ).rev(),
  seq(
    e2, e3, e2, e3, e2, e3, e2, e3,
    a2, a3, a2, a3, a2, a3, a2, a3,
    gs2, gs3, gs2, gs3, e2, e3, e2, e3,
    a2, a3, a2, a3, a2, a3, b1, c2,
    d2, d3, d2, d3, d2, d3, d2, d3,
    c2, c3, c2, c3, c2, c3, c2, c3,
    b1, b2, b1, b2, e2, e3, e2, e3,
    a1, a2, a1, a2, a1, a2, a1, a2,
  ).rev()
).slow(16)`,
  whirlyStrudel: `seq(e4, [b2,  b3], c4)
.every(4, fast(2))
.every(3, slow(1.5))
.fast(cat(1.25, 1, 1.5))
.every(2, _ => seq(e4, r, e3, d4, r))`,
  transposedChordsHacked: `stack(
  "c2 eb2 g2",
  "Cm7".voicings('lefthand').slow(2)
).transpose(
  "<1 2 3 2>".slow(2)
).transpose(5)`,
  scaleTranspose: `"f2,f3,c4,ab4"
.scale(seq('F minor', 'F harmonic minor').slow(4))
.scaleTranspose("<0 -1 -2 -3>")
.transpose("0 1".slow(16))`,
  struct: `stack(
  "c2 g2 a2 [e2@2 eb2] d2 a2 g2 [d2 ~ db2]",
  "[C^7 A7] [Dm7 G7]".struct("[x@2 x] [~@2 x] [~ x@2]@2 [x ~@2] ~ [~@2 x@4]@2")
  .voicings('lefthand')
).slow(4)`,
  magicSofa: `stack(
  "<C^7 F^7 ~> <Dm7 G7 A7 ~>"
   .every(2, fast(2))
   .voicings('lefthand'),
  "<c2 f2 g2> <d2 g2 a2 e2>"
).transpose("<0 2 3 4>")`,
  confusedPhone: `"[g2 ~@1.3] [c3 ~@1.3]"
.superimpose(
  compose(transpose(-12), late(0)),
  compose(transpose(7), late(0.1)),
  compose(transpose(10), late(0.2)),
  compose(transpose(12), late(0.3)),
  compose(transpose(24), late(0.4))
)
.scale(cat('C dorian', 'C mixolydian'))
.scaleTranspose("<0 1 2 1>")
.slow(2)`,
  technoDrums: `stack(
  "c1*2".tone(new MembraneSynth().toDestination()),
  "~ x".tone(new NoiseSynth().toDestination()),
  "[~ c4]*2".tone(new MetalSynth().set({envelope:{decay:0.06,sustain:0}}).chain(new Gain(0.5),getDestination()))
)`,
};

const PATTERN_CYCLES: Record<string, number> = {
  timeCatMini: 16,
  timeCat: 8,
  shapeShifted: 16,
  whirlyStrudel: 16,
  transposedChordsHacked: 8,
  scaleTranspose: 16,
  struct: 4,
  magicSofa: 8,
  confusedPhone: 8,
  technoDrums: 4,
};

const PATTERN_DIGESTS: Record<string, string> = {
  timeCatMini: '843f885693a4fd602fe56db9739b947f92c60d7681451f2d3d0e93dd8283c66d',
  timeCat: '7db1921bafbb794f30ae4b105201b61237486c6561207bf8619dcd6473471fb2',
  shapeShifted: '91d126932a04935e2ac0726d09c3681b4f7c4a4d76b57709cd8dcb8549a3a576',
  whirlyStrudel: '1d6963e9024327c9ef4763e16f19431c5e80e891125dcfdd808796ed7d7fd648',
  transposedChordsHacked: '095fbe2cf869d3e303afcad5574cd444f16a5a0bd64c48a718f29751955548f9',
  scaleTranspose: 'c82090fc0c05653de869341dea362e523a788c00f0476e85d0c8ec8937ac1bd1',
  struct: 'dd72947f5f182ea4730a91d2eac6400a08230aab44982ed9031d2967fa2e5f7e',
  magicSofa: '060ec5af99f88135ac116fa23c9c9b64718c9ffdfefd6a79b7cf036efa7b15ed',
  confusedPhone: 'f65021aef4041b018966c969ff3fc2de7dd0ed4663b17df565d6448d3f068cf2',
  technoDrums: '5dd096796d0c7504295fe46c2a6ce3bf614f5b60aedde8617b0168f3fe31ea99',
};

const queryCode = async (code: string, cycles = 1) => {
  const { pattern } = await strudel.evaluate(code, transpiler);
  const runtimePattern = pattern as {
    sortHapsByPart: () => {
      queryArc: (from: number, to: number) => { show: (includePart: boolean) => string }[];
    };
  };
  const haps = runtimePattern.sortHapsByPart().queryArc(0, cycles);
  return haps.map((hap: { show: (includePart: boolean) => string }) => hap.show(true));
};

beforeAll(async () => {
  await evalScope(
    strudel,
    toneHelpersMocked,
    uiHelpersMocked,
    webaudio,
    tonalHelpers,
    {},
    {
      midin,
      sysex,
      mini,
      m,
      getDrawContext,
      getAudioContext,
      loadSoundfont,
      loadCSound,
      loadCsound,
      loadcsound,
      setcps: id,
      setcpm: id,
      Clock: {},
    }
  );
  registerNoteConstants();
});

describe('Strudel pattern integrations', () => {
  Object.entries(PATTERN_DEFINITIONS).forEach(([name, code]) => {
    if (!code) {
      return;
    }

    it(`evaluates ${name}`, async () => {
      const events = await queryCode(code, PATTERN_CYCLES[name] ?? 1);
      expect(events.length).toBeGreaterThan(0);
      const digest = createHash('sha256').update(JSON.stringify(events)).digest('hex');
      expect(digest).toBe(PATTERN_DIGESTS[name]);
    });
  });
});
