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
  let masterVolume = 0.72;
  let bellTimer: number | null = null;
  let ambience:
    | {
        low: OscillatorNode;
        high: OscillatorNode;
        wind: AudioBufferSourceNode;
        windFilter: BiquadFilterNode;
        windGain: GainNode;
        gain: GainNode;
        tremolo: OscillatorNode;
        tremoloGain: GainNode;
      }
    | null = null;
  let bossMusic:
    | {
        low: OscillatorNode;
        pulse: OscillatorNode;
        gain: GainNode;
      }
    | null = null;

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

  function outputGain(audioContext: AudioContext, gain: number) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = gain * masterVolume;
    gainNode.connect(audioContext.destination);

    return gainNode;
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
    gainNode.gain.exponentialRampToValueAtTime(gain * masterVolume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  function playNoise(duration: number, gain: number, filterFrequency: number) {
    const audioContext = getContext();

    if (!audioContext) {
      return;
    }

    const sampleCount = Math.max(1, Math.floor(audioContext.sampleRate * duration));
    const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
    const samples = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      samples[index] = Math.random() * 2 - 1;
    }

    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gainNode = outputGain(audioContext, gain);
    const now = audioContext.currentTime;

    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(filterFrequency, now);
    filter.Q.value = 2.8;
    gainNode.gain.setValueAtTime(gain * masterVolume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gainNode);
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  function setVolume(volume: number) {
    masterVolume = Math.max(0, Math.min(1, volume));

    if (ambience && context) {
      ambience.gain.gain.setTargetAtTime(0.034 * masterVolume, context.currentTime, 0.08);
      ambience.windGain.gain.setTargetAtTime(0.018 * masterVolume, context.currentTime, 0.08);
    }

    if (bossMusic && context) {
      bossMusic.gain.gain.setTargetAtTime(0.052 * masterVolume, context.currentTime, 0.08);
    }
  }

  function startAmbience() {
    const audioContext = getContext();

    if (!audioContext || ambience) {
      return;
    }

    const low = audioContext.createOscillator();
    const high = audioContext.createOscillator();
    const wind = createLoopingNoise(audioContext);
    const windFilter = audioContext.createBiquadFilter();
    const windGain = audioContext.createGain();
    const gain = audioContext.createGain();
    const tremolo = audioContext.createOscillator();
    const tremoloGain = audioContext.createGain();

    low.type = "sine";
    low.frequency.value = 46;
    high.type = "triangle";
    high.frequency.value = 91;
    tremolo.frequency.value = 0.18;
    tremoloGain.gain.value = 0.012;
    windFilter.type = "lowpass";
    windFilter.frequency.value = 620;
    windGain.gain.value = 0.018 * masterVolume;
    gain.gain.value = 0.034 * masterVolume;
    tremolo.connect(tremoloGain);
    tremoloGain.connect(gain.gain);
    low.connect(gain);
    high.connect(gain);
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(audioContext.destination);
    gain.connect(audioContext.destination);
    low.start();
    high.start();
    wind.start();
    tremolo.start();
    bellTimer = window.setInterval(() => {
      playPair(
        { frequency: 132, slideTo: 98, duration: 1.35, gain: 0.035, type: "sine" },
        { frequency: 66, slideTo: 49, duration: 1.7, gain: 0.026, type: "triangle" },
      );
    }, 18000);
    ambience = { low, high, wind, windFilter, windGain, gain, tremolo, tremoloGain };
  }

  function stopAmbience() {
    if (!ambience) {
      return;
    }

    ambience.low.stop();
    ambience.high.stop();
    ambience.wind.stop();
    ambience.tremolo.stop();
    ambience.low.disconnect();
    ambience.high.disconnect();
    ambience.wind.disconnect();
    ambience.windFilter.disconnect();
    ambience.windGain.disconnect();
    ambience.tremolo.disconnect();
    ambience.tremoloGain.disconnect();
    ambience.gain.disconnect();
    ambience = null;

    if (bellTimer !== null) {
      window.clearInterval(bellTimer);
      bellTimer = null;
    }
  }

  function startBossMusic() {
    const audioContext = getContext();

    if (!audioContext || bossMusic) {
      return;
    }

    const low = audioContext.createOscillator();
    const pulse = audioContext.createOscillator();
    const gain = audioContext.createGain();

    low.type = "sawtooth";
    low.frequency.value = 57;
    pulse.type = "triangle";
    pulse.frequency.value = 86;
    gain.gain.value = 0.052 * masterVolume;
    low.connect(gain);
    pulse.connect(gain);
    gain.connect(audioContext.destination);
    low.start();
    pulse.start();
    bossMusic = { low, pulse, gain };
  }

  function stopBossMusic() {
    if (!bossMusic) {
      return;
    }

    bossMusic.low.stop();
    bossMusic.pulse.stop();
    bossMusic.low.disconnect();
    bossMusic.pulse.disconnect();
    bossMusic.gain.disconnect();
    bossMusic = null;
  }

  function playPair(primary: ToneOptions, secondary: ToneOptions) {
    playTone(primary);
    window.setTimeout(() => playTone(secondary), Math.max(1, primary.duration * 420));
  }

  return {
    resume,
    setVolume,
    startAmbience,
    stopAmbience,
    startBossMusic,
    stopBossMusic,
    footstep(isRunning: boolean) {
      playNoise(0.026, isRunning ? 0.035 : 0.022, 260);
    },
    shot() {
      playNoise(0.045, 0.24, 1350);
      playTone({ frequency: 120, slideTo: 52, duration: 0.11, gain: 0.18, type: "sawtooth" });
      window.setTimeout(
        () => playTone({ frequency: 60, slideTo: 38, duration: 0.12, gain: 0.08, type: "triangle" }),
        18,
      );
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
    enemyGrowl() {
      playTone({ frequency: 92, slideTo: 54, duration: 0.34, gain: 0.055, type: "sawtooth" });
    },
    enemyDeath() {
      playPair(
        { frequency: 96, slideTo: 42, duration: 0.22, gain: 0.08, type: "sawtooth" },
        { frequency: 58, slideTo: 32, duration: 0.28, gain: 0.055, type: "triangle" },
      );
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
      stopBossMusic();
      stopAmbience();
      void context?.close();
      context = null;
    },
  };
}

function createLoopingNoise(audioContext: AudioContext) {
  const duration = 2;
  const sampleCount = Math.floor(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = Math.random() * 2 - 1;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}
