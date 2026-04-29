type ToneOptions = {
  frequency: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  slideTo?: number;
};

type BrowserWindowWithWebkitAudio = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

export function createGameAudio() {
  let context: AudioContext | null = null;

  function getContext() {
    if (context) {
      return context;
    }

    const AudioContextCtor =
      window.AudioContext ?? (window as BrowserWindowWithWebkitAudio).webkitAudioContext;

    if (!AudioContextCtor) {
      return null;
    }

    context = new AudioContextCtor();
    return context;
  }

  function resume() {
    const audioContext = getContext();

    if (audioContext?.state === "suspended") {
      void audioContext.resume();
    }
  }

  function playTone({ frequency, duration, gain, type = "sine", slideTo }: ToneOptions) {
    const audioContext = getContext();

    if (!audioContext) {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  function playPair(primary: ToneOptions, secondary: ToneOptions) {
    playTone(primary);
    window.setTimeout(() => playTone(secondary), Math.max(1, primary.duration * 420));
  }

  return {
    resume,
    shot() {
      playTone({ frequency: 190, slideTo: 68, duration: 0.08, gain: 0.13, type: "sawtooth" });
    },
    hit() {
      playTone({ frequency: 440, slideTo: 220, duration: 0.09, gain: 0.08, type: "square" });
    },
    reload() {
      playPair(
        { frequency: 290, duration: 0.07, gain: 0.055, type: "triangle" },
        { frequency: 180, duration: 0.08, gain: 0.045, type: "triangle" },
      );
    },
    pickup() {
      playPair(
        { frequency: 650, duration: 0.07, gain: 0.055, type: "sine" },
        { frequency: 980, duration: 0.09, gain: 0.04, type: "sine" },
      );
    },
    heal() {
      playTone({ frequency: 520, slideTo: 760, duration: 0.2, gain: 0.045, type: "triangle" });
    },
    damage() {
      playTone({ frequency: 120, slideTo: 72, duration: 0.18, gain: 0.12, type: "sawtooth" });
    },
    gate() {
      playTone({ frequency: 86, slideTo: 48, duration: 0.32, gain: 0.11, type: "triangle" });
    },
    boss() {
      playPair(
        { frequency: 72, duration: 0.24, gain: 0.13, type: "sawtooth" },
        { frequency: 108, duration: 0.34, gain: 0.08, type: "triangle" },
      );
    },
    ui() {
      playTone({ frequency: 360, duration: 0.045, gain: 0.035, type: "triangle" });
    },
    win() {
      playPair(
        { frequency: 420, duration: 0.16, gain: 0.055, type: "sine" },
        { frequency: 630, duration: 0.28, gain: 0.05, type: "sine" },
      );
    },
    dispose() {
      void context?.close();
      context = null;
    },
  };
}
