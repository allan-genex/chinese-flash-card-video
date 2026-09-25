/**
 * Video Recording Engine
 * Uses HTML5 Canvas + MediaStream + Web Audio API + MediaRecorder
 * to generate real-time high definition video files directly in the browser.
 */

import { renderFlashcardFrame, ASPECT_RATIOS } from './canvasVideoRenderer';
import { audioEngine } from './audioEngine';

export class VideoRecorderEngine {
  constructor() {
    this.isRecording = false;
    this.shouldCancel = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  /**
   * Record a complete Flashcard Video from an array of words
   * @param {Array} words - Array of vocabulary items
   * @param {Object} options - Configuration options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Blob>} - Resolves with the recorded video blob
   */
  async recordVideo(words, options = {}, onProgress = () => {}) {
    if (!words || words.length === 0) {
      throw new Error("No words selected for video generation.");
    }

    this.isRecording = true;
    this.shouldCancel = false;
    this.recordedChunks = [];

    const {
      aspectRatio = "9:16",
      themeId = "exam",
      guessDurationSec = 2.5,   // Time before reveal
      revealDurationSec = 4.0,  // Time after reveal
      includeAudio = true,
      includeBgm = true,
      showTianzige = true,
      showCollocations = true,
      showSentence = true,
    } = options;

    const config = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS["9:16"];
    const canvas = document.createElement("canvas");
    canvas.width = config.width;
    canvas.height = config.height;

    // Setup Audio Stream
    const audioTrack = audioEngine.getAudioStreamTrack();
    const canvasStream = canvas.captureStream(30); // 30 FPS for smooth, efficient video

    // Combine video track + audio track
    const combinedTracks = [...canvasStream.getVideoTracks()];
    if (includeAudio && audioTrack) {
      combinedTracks.push(audioTrack);
    }
    const combinedStream = new MediaStream(combinedTracks);

    // Pick best supported MIME type
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Browser default
        }
      }
    }

    const recorderOptions = mimeType ? { mimeType, videoBitsPerSecond: 2500000 } : {};
    this.mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    const recordingPromise = new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = () => {
        const finalBlob = new Blob(this.recordedChunks, { type: mimeType || 'video/webm' });
        resolve(finalBlob);
      };
      this.mediaRecorder.onerror = (err) => reject(err);
    });

    if (includeBgm) {
      audioEngine.startStudyBgm();
    }

    this.mediaRecorder.start(200); // 200ms slice

    const totalWords = words.length;

    try {
      for (let i = 0; i < totalWords; i++) {
        if (this.shouldCancel) break;

        const wordItem = words[i];
        const cardIndex = i + 1;

        // Phase 1: Guess Phase (Animated countdown)
        const guessFrames = Math.floor(guessDurationSec * 30);
        for (let f = 0; f < guessFrames; f++) {
          if (this.shouldCancel) break;

          const progress = 1.0 - (f / guessFrames);
          renderFlashcardFrame(canvas, wordItem, {
            aspectRatio,
            themeId,
            phase: "guess",
            countdownProgress: progress,
            cardIndex,
            totalCards: totalWords,
            showTianzige,
            showCollocations,
            showSentence,
          });

          // Play tick at integer second intervals
          if (includeAudio && f % 30 === 0 && f > 0) {
            audioEngine.playTick();
          }

          onProgress({
            currentCard: cardIndex,
            totalCards: totalWords,
            percent: Math.round(((i + (f / guessFrames) * 0.4) / totalWords) * 100),
            stage: `考考你：${wordItem.word}`
          });

          await sleep(1000 / 30);
        }

        if (this.shouldCancel) break;

        // Phase 2: Reveal Phase (Chime + Speech + Full info)
        if (includeAudio) {
          audioEngine.playChime();
        }

        // Trigger speech in parallel with reveal frames
        let speechDone = false;
        if (includeAudio) {
          audioEngine.speakChinese(`${wordItem.word}。${wordItem.sentence || ''}`).then(() => {
            speechDone = true;
          });
        }

        const revealFrames = Math.floor(revealDurationSec * 30);
        for (let f = 0; f < revealFrames; f++) {
          if (this.shouldCancel) break;

          renderFlashcardFrame(canvas, wordItem, {
            aspectRatio,
            themeId,
            phase: "reveal",
            countdownProgress: 0,
            cardIndex,
            totalCards: totalWords,
            showTianzige,
            showCollocations,
            showSentence,
          });

          onProgress({
            currentCard: cardIndex,
            totalCards: totalWords,
            percent: Math.round(((i + 0.4 + (f / revealFrames) * 0.6) / totalWords) * 100),
            stage: `解析与发音：${wordItem.word}`
          });

          await sleep(1000 / 30);
        }
      }
    } finally {
      if (includeBgm) {
        audioEngine.stopStudyBgm();
      }
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
      this.isRecording = false;
    }

    return await recordingPromise;
  }

  cancel() {
    this.shouldCancel = true;
    this.isRecording = false;
    audioEngine.stopStudyBgm();
    audioEngine.cancelSpeech();
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const videoRecorderEngine = new VideoRecorderEngine();
