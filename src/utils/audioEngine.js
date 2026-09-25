/**
 * Audio Engine for Chinese Flash Card Video App
 * Provides:
 * - Speech Synthesis (Mandarin Chinese pronunciation)
 * - Web Audio API synthesized SFX (flip, chime, countdown tick, fanfare)
 * - Procedural Study Ambient Background Music (works offline, zero assets)
 * - MediaStream Audio Destination for mixing directly into canvas video recordings
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.streamDestination = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.isBgmPlaying = false;
    this.bgmTimer = null;
    this.preferredVoice = null;
    this.initSynth();
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.streamDestination = this.ctx.createMediaStreamDestination();

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.12; // Gentle background level
      this.bgmGain.connect(this.ctx.destination);
      this.bgmGain.connect(this.streamDestination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.35;
      this.sfxGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.streamDestination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  getAudioStreamTrack() {
    this.getAudioContext();
    return this.streamDestination.stream.getAudioTracks()[0];
  }

  initSynth() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Priority: zh-SG > zh-CN > any zh
        this.preferredVoice =
          voices.find(v => v.lang === 'zh-SG') ||
          voices.find(v => v.lang === 'zh-CN' && (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Xiaoxiao') || v.name.includes('Yunxi'))) ||
          voices.find(v => v.lang === 'zh-CN') ||
          voices.find(v => v.lang.startsWith('zh')) ||
          null;
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  // Synthesize Card Flip / Whoosh Sound
  playCardFlip() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Synthesize Ding / Reveal Chime (crystal harp)
  playChime() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Praising chord)
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.18, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.55);
    });
  }

  // Countdown Tick
  playTick() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Procedural Study Lo-Fi Chords
  startStudyBgm() {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    const ctx = this.getAudioContext();

    // Relaxing pentatonic chords progression (G - Em - C - D)
    const chords = [
      [196.00, 246.94, 293.66, 392.00], // G
      [164.81, 196.00, 246.94, 329.63], // Em
      [130.81, 164.81, 196.00, 261.63], // C
      [146.83, 185.00, 220.00, 293.66], // D
    ];
    let step = 0;

    const playChord = () => {
      if (!this.isBgmPlaying) return;
      const now = ctx.currentTime;
      const notes = chords[step % chords.length];
      step++;

      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = 600;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(now);
        osc.stop(now + 2.9);
      });

      this.bgmTimer = setTimeout(playChord, 3000);
    };

    playChord();
  }

  stopStudyBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // Mandarin Speech Synthesis
  speakChinese(text, rate = 0.9) {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = rate;
      utterance.pitch = 1.0;

      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  cancelSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioEngine = new AudioEngine();
