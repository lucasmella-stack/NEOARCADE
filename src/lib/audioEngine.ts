interface SoundStep {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume?: number;
  slideTo?: number;
  delay?: number;
}

const SOUND_LIBRARY = {
  "ui-start": [
    {
      frequency: 440,
      duration: 0.07,
      type: "square" as OscillatorType,
      volume: 0.03,
    },
    {
      frequency: 660,
      duration: 0.09,
      type: "square" as OscillatorType,
      volume: 0.028,
      delay: 0.05,
    },
  ],
  "snake-eat": [
    {
      frequency: 760,
      duration: 0.05,
      type: "square" as OscillatorType,
      volume: 0.028,
    },
    {
      frequency: 980,
      duration: 0.08,
      type: "square" as OscillatorType,
      volume: 0.026,
      delay: 0.04,
    },
  ],
  "snake-dead": [
    {
      frequency: 260,
      duration: 0.2,
      type: "sawtooth" as OscillatorType,
      volume: 0.03,
      slideTo: 140,
    },
  ],
  "pong-hit": [
    {
      frequency: 620,
      duration: 0.05,
      type: "square" as OscillatorType,
      volume: 0.025,
    },
  ],
  "pong-score": [
    {
      frequency: 300,
      duration: 0.08,
      type: "triangle" as OscillatorType,
      volume: 0.028,
    },
    {
      frequency: 520,
      duration: 0.12,
      type: "triangle" as OscillatorType,
      volume: 0.024,
      delay: 0.06,
    },
  ],
  "pong-win": [
    {
      frequency: 520,
      duration: 0.08,
      type: "square" as OscillatorType,
      volume: 0.028,
    },
    {
      frequency: 780,
      duration: 0.1,
      type: "square" as OscillatorType,
      volume: 0.026,
      delay: 0.06,
    },
    {
      frequency: 1040,
      duration: 0.14,
      type: "square" as OscillatorType,
      volume: 0.024,
      delay: 0.14,
    },
  ],
  "breakout-launch": [
    {
      frequency: 520,
      duration: 0.06,
      type: "square" as OscillatorType,
      volume: 0.025,
      slideTo: 700,
    },
  ],
  "breakout-paddle": [
    {
      frequency: 420,
      duration: 0.05,
      type: "triangle" as OscillatorType,
      volume: 0.023,
    },
  ],
  "breakout-brick": [
    {
      frequency: 760,
      duration: 0.04,
      type: "square" as OscillatorType,
      volume: 0.022,
    },
  ],
  "breakout-life": [
    {
      frequency: 260,
      duration: 0.15,
      type: "sawtooth" as OscillatorType,
      volume: 0.028,
      slideTo: 180,
    },
  ],
  "breakout-level": [
    {
      frequency: 660,
      duration: 0.07,
      type: "triangle" as OscillatorType,
      volume: 0.024,
    },
    {
      frequency: 880,
      duration: 0.08,
      type: "triangle" as OscillatorType,
      volume: 0.024,
      delay: 0.05,
    },
    {
      frequency: 1180,
      duration: 0.1,
      type: "triangle" as OscillatorType,
      volume: 0.022,
      delay: 0.11,
    },
  ],
  "breakout-gameover": [
    {
      frequency: 220,
      duration: 0.22,
      type: "sawtooth" as OscillatorType,
      volume: 0.03,
      slideTo: 130,
    },
  ],
  "invaders-shoot": [
    {
      frequency: 460,
      duration: 0.05,
      type: "square" as OscillatorType,
      volume: 0.02,
      slideTo: 560,
    },
  ],
  "invaders-hit": [
    {
      frequency: 920,
      duration: 0.05,
      type: "square" as OscillatorType,
      volume: 0.022,
    },
  ],
  "invaders-player-hit": [
    {
      frequency: 180,
      duration: 0.18,
      type: "sawtooth" as OscillatorType,
      volume: 0.03,
      slideTo: 110,
    },
  ],
  "invaders-level": [
    {
      frequency: 560,
      duration: 0.06,
      type: "square" as OscillatorType,
      volume: 0.024,
    },
    {
      frequency: 760,
      duration: 0.08,
      type: "square" as OscillatorType,
      volume: 0.024,
      delay: 0.05,
    },
    {
      frequency: 980,
      duration: 0.1,
      type: "square" as OscillatorType,
      volume: 0.022,
      delay: 0.11,
    },
  ],
  "invaders-gameover": [
    {
      frequency: 200,
      duration: 0.2,
      type: "sawtooth" as OscillatorType,
      volume: 0.03,
      slideTo: 120,
    },
  ],
} satisfies Record<string, SoundStep[]>;

export type SoundName = keyof typeof SOUND_LIBRARY;

export function isKnownSound(sound: string): sound is SoundName {
  return sound in SOUND_LIBRARY;
}

export interface AudioEngine {
  unlock: () => void;
  play: (sound: SoundName) => void;
}

export function createAudioEngine(): AudioEngine {
  let audioContext: AudioContext | null = null;

  const getContext = () => {
    if (audioContext) return audioContext;
    const audioWindow = window as Window &
      typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const Ctor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
    return audioContext;
  };

  return {
    unlock: () => {
      const ctx = getContext();
      if (ctx?.state === "suspended") void ctx.resume();
    },
    play: (sound) => {
      const ctx = getContext();
      if (!ctx) return;
      if (ctx.state === "suspended") void ctx.resume();

      const steps = SOUND_LIBRARY[sound];
      const baseTime = ctx.currentTime;

      steps.forEach((step: SoundStep) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const startTime = baseTime + (step.delay ?? 0);
        const endFrequency = step.slideTo ?? step.frequency;
        const volume = step.volume ?? 0.025;

        oscillator.type = step.type;
        oscillator.frequency.setValueAtTime(step.frequency, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(60, endFrequency),
          startTime + step.duration,
        );
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          startTime + step.duration,
        );
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + step.duration + 0.02);
      });
    },
  };
}
