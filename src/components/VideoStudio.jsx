import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Download,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  Music,
  CheckCircle,
  Film,
  Smartphone,
  Monitor,
  Square as SquareIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Share2,
  Camera
} from 'lucide-react';
import { renderFlashcardFrame, THEMES, ASPECT_RATIOS } from '../utils/canvasVideoRenderer';
import { videoRecorderEngine } from '../utils/videoRecorderEngine';
import { audioEngine } from '../utils/audioEngine';

export default function VideoStudio({
  words,
  selectedWordIds,
  selectedUnit,
  onSelectUnit,
  units
}) {
  // Video Configuration State
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [themeId, setThemeId] = useState('exam');
  const [guessDurationSec, setGuessDurationSec] = useState(2.5);
  const [revealDurationSec, setRevealDurationSec] = useState(4.0);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeBgm, setIncludeBgm] = useState(true);
  const [showTianzige, setShowTianzige] = useState(true);
  const [showCollocations, setShowCollocations] = useState(true);
  const [showSentence, setShowSentence] = useState(true);

  // Active Word Selection for Video Generation
  const [videoScope, setVideoScope] = useState('chapter'); // 'chapter' | 'selected' | 'all'
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  // Live Canvas Simulation State
  const [previewPhase, setPreviewPhase] = useState('reveal'); // 'guess' | 'reveal'
  const [isPlayingSimulation, setIsPlayingSimulation] = useState(false);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Recording State & Modal
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState({ percent: 0, currentCard: 1, totalCards: 1, stage: '' });
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Filter words based on scope
  const targetWords = React.useMemo(() => {
    if (videoScope === 'selected') {
      const selected = words.filter((w) => selectedWordIds.has(w.id));
      return selected.length > 0 ? selected : words.slice(0, 5);
    }
    if (videoScope === 'all') {
      return words;
    }
    // Default 'chapter'
    const filtered = words.filter((w) =>
      selectedUnit === '全部词语 (All Words)' ? true : w.unit === selectedUnit
    );
    return filtered.length > 0 ? filtered : words.slice(0, 5);
  }, [words, selectedWordIds, videoScope, selectedUnit]);

  const currentWord = targetWords[activeWordIndex] || targetWords[0] || words[0];

  // Draw current canvas whenever params change
  useEffect(() => {
    if (!canvasRef.current || !currentWord) return;
    renderFlashcardFrame(canvasRef.current, currentWord, {
      aspectRatio,
      themeId,
      phase: previewPhase,
      countdownProgress: previewPhase === 'guess' ? 0.6 : 0,
      cardIndex: activeWordIndex + 1,
      totalCards: targetWords.length,
      showTianzige,
      showCollocations,
      showSentence,
    });
  }, [
    currentWord,
    aspectRatio,
    themeId,
    previewPhase,
    activeWordIndex,
    targetWords.length,
    showTianzige,
    showCollocations,
    showSentence,
  ]);

  // Handle Live Interactive Simulation Preview
  const runLiveSimulation = async () => {
    if (isPlayingSimulation) {
      setIsPlayingSimulation(false);
      audioEngine.cancelSpeech();
      audioEngine.stopStudyBgm();
      return;
    }

    setIsPlayingSimulation(true);
    if (includeBgm) audioEngine.startStudyBgm();

    const canvas = canvasRef.current;
    if (!canvas || !currentWord) return;

    // Guess Phase (Countdown)
    setPreviewPhase('guess');
    const guessFrames = Math.floor(guessDurationSec * 30);
    for (let f = 0; f < guessFrames; f++) {
      if (!canvasRef.current) break;
      const progress = 1.0 - f / guessFrames;
      renderFlashcardFrame(canvas, currentWord, {
        aspectRatio,
        themeId,
        phase: 'guess',
        countdownProgress: progress,
        cardIndex: activeWordIndex + 1,
        totalCards: targetWords.length,
        showTianzige,
        showCollocations,
        showSentence,
      });
      if (includeAudio && f % 30 === 0 && f > 0) {
        audioEngine.playTick();
      }
      await sleep(1000 / 30);
    }

    // Reveal Phase (Chime + Speech)
    setPreviewPhase('reveal');
    if (includeAudio) audioEngine.playChime();
    if (includeAudio) {
      audioEngine.speakChinese(`${currentWord.word}。${currentWord.sentence || ''}`);
    }

    const revealFrames = Math.floor(revealDurationSec * 30);
    for (let f = 0; f < revealFrames; f++) {
      if (!canvasRef.current) break;
      renderFlashcardFrame(canvas, currentWord, {
        aspectRatio,
        themeId,
        phase: 'reveal',
        countdownProgress: 0,
        cardIndex: activeWordIndex + 1,
        totalCards: targetWords.length,
        showTianzige,
        showCollocations,
        showSentence,
      });
      await sleep(1000 / 30);
    }

    setIsPlayingSimulation(false);
    if (includeBgm) audioEngine.stopStudyBgm();
  };

  // Start Video Export
  const handleStartExport = async () => {
    try {
      setIsRecording(true);
      setRecordProgress({ percent: 0, currentCard: 1, totalCards: targetWords.length, stage: '准备就绪' });

      const videoBlob = await videoRecorderEngine.recordVideo(
        targetWords,
        {
          aspectRatio,
          themeId,
          guessDurationSec,
          revealDurationSec,
          includeAudio,
          includeBgm,
          showTianzige,
          showCollocations,
          showSentence,
        },
        (prog) => setRecordProgress(prog)
      );

      const url = URL.createObjectURL(videoBlob);
      setRecordedVideoUrl(url);
      setShowResultModal(true);
    } catch (err) {
      console.error('Export error:', err);
      alert('视频生成过程中出现错误: ' + err.message);
    } finally {
      setIsRecording(false);
    }
  };

  const handleCancelExport = () => {
    videoRecorderEngine.cancel();
    setIsRecording(false);
  };

  // Save current frame as PNG
  const handleSaveImage = () => {
    if (!canvasRef.current || !currentWord) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `PSLE_P6_${currentWord.word}_Flashcard.png`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Canvas Preview Player (approx 6 cols) */}
        <div className="lg:col-span-6 flex flex-col items-center">
          {/* Card Preview Container */}
          <div className="w-full bg-slate-900/90 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col items-center">
            
            {/* Aspect Ratio Badge & Quick Toggle */}
            <div className="w-full flex items-center justify-between text-white text-xs mb-3">
              <span className="font-semibold text-slate-300">
                实时效果预览 (Live Preview)
              </span>
              <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    aspectRatio === '9:16' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="9:16 竖版 (TikTok/Shorts)"
                >
                  <Smartphone className="w-3.5 h-3.5" /> 9:16
                </button>
                <button
                  onClick={() => setAspectRatio('16:9')}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    aspectRatio === '16:9' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="16:9 横版 (YouTube/电视)"
                >
                  <Monitor className="w-3.5 h-3.5" /> 16:9
                </button>
                <button
                  onClick={() => setAspectRatio('1:1')}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    aspectRatio === '1:1' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="1:1 方形 (Instagram)"
                >
                  <SquareIcon className="w-3.5 h-3.5" /> 1:1
                </button>
              </div>
            </div>

            {/* The Actual Canvas Component */}
            <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-black shadow-inner max-w-full">
              <canvas
                ref={canvasRef}
                className="max-h-[500px] w-auto h-auto rounded-xl object-contain shadow-lg"
              />
            </div>

            {/* Preview Controls Bar */}
            <div className="w-full mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveWordIndex(Math.max(0, activeWordIndex - 1))}
                  disabled={activeWordIndex === 0}
                  className="p-2 rounded-xl bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-300 font-mono">
                  {activeWordIndex + 1} / {targetWords.length}
                </span>
                <button
                  onClick={() => setActiveWordIndex(Math.min(targetWords.length - 1, activeWordIndex + 1))}
                  disabled={activeWordIndex === targetWords.length - 1}
                  className="p-2 rounded-xl bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Simulation Play / Pause Button */}
              <button
                onClick={runLiveSimulation}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isPlayingSimulation
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-white text-slate-900 hover:bg-slate-100'
                }`}
              >
                {isPlayingSimulation ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> 停止演示
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> 演示答题倒计时 & 揭晓
                  </>
                )}
              </button>

              {/* Single Frame Save */}
              <button
                onClick={handleSaveImage}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title="保存此卡片高清图片"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Configuration & Export Studio (approx 6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* 1. Vocabulary Selection Scope */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-red-600" /> 1. 选择要录制的词语范围
            </h3>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={() => setVideoScope('chapter')}
                className={`py-2 px-3 rounded-xl text-xs font-medium text-center transition-all ${
                  videoScope === 'chapter'
                    ? 'bg-red-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                当前单元 ({targetWords.length} 词)
              </button>
              <button
                onClick={() => setVideoScope('selected')}
                className={`py-2 px-3 rounded-xl text-xs font-medium text-center transition-all ${
                  videoScope === 'selected'
                    ? 'bg-red-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                已勾选词语 ({selectedWordIds.size} 词)
              </button>
              <button
                onClick={() => setVideoScope('all')}
                className={`py-2 px-3 rounded-xl text-xs font-medium text-center transition-all ${
                  videoScope === 'all'
                    ? 'bg-red-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                全部小六词库 ({words.length} 词)
              </button>
            </div>

            {videoScope === 'chapter' && (
              <select
                value={selectedUnit}
                onChange={(e) => onSelectUnit(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Style Theme Selection */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> 2. 视频视觉配色风格
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.values(THEMES).map((thm) => (
                <button
                  key={thm.id}
                  onClick={() => setThemeId(thm.id)}
                  className={`p-2.5 rounded-2xl border-2 text-left transition-all ${
                    themeId === thm.id
                      ? 'border-red-500 bg-red-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: thm.primary }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: thm.accent }}
                    />
                  </div>
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {thm.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Timing & Content Toggles */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-slate-600" /> 3. 答题节奏与内容元素
            </h3>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>思考倒计时 (猜词)</span>
                  <span className="font-bold text-red-600">{guessDurationSec} 秒</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="6.0"
                  step="0.5"
                  value={guessDurationSec}
                  onChange={(e) => setGuessDurationSec(parseFloat(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>答案与发音展示</span>
                  <span className="font-bold text-red-600">{revealDurationSec} 秒</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="8.0"
                  step="0.5"
                  value={revealDurationSec}
                  onChange={(e) => setRevealDurationSec(parseFloat(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>
            </div>

            {/* Checkboxes / Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAudio}
                  onChange={(e) => setIncludeAudio(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span>中文语音朗读 & 音效</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBgm}
                  onChange={(e) => setIncludeBgm(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span>Lo-Fi 专注伴奏背景音乐</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTianzige}
                  onChange={(e) => setShowTianzige(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span>显示标准田字格红线</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCollocations}
                  onChange={(e) => setShowCollocations(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span>显示 PSLE 核心词语搭配</span>
              </label>
            </div>
          </div>

          {/* 4. The Big Action Button: Export Video */}
          <div className="pt-2">
            <button
              onClick={handleStartExport}
              disabled={isRecording || targetWords.length === 0}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-bold text-base shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>
                一键生成并导出短视频 ({targetWords.length} 个词语)
              </span>
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              ⚡ 浏览器内核极速直录，支持直接发布至 YouTube Shorts / TikTok / 小红书 / 微信视频号
            </p>
          </div>
        </div>
      </div>

      {/* Recording in Progress Modal */}
      {isRecording && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 animate-spin">
              <Loader2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">正在生成高清闪卡视频</h3>
            <p className="text-xs text-slate-500 mb-4">
              正在合成第 {recordProgress.currentCard} / {recordProgress.totalCards} 个词语 · {recordProgress.stage}
            </p>

            {/* Progress Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-red-600 transition-all duration-200 rounded-full"
                style={{ width: `${recordProgress.percent}%` }}
              />
            </div>
            <div className="text-xs font-mono font-semibold text-red-600 mb-6">
              {recordProgress.percent}% 完成
            </div>

            <button
              onClick={handleCancelExport}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-100"
            >
              取消录制
            </button>
          </div>
        </div>
      )}

      {/* Result & Download Video Modal */}
      {showResultModal && recordedVideoUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">视频生成完毕！</h3>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Video Player */}
            <div className="rounded-2xl overflow-hidden bg-black mb-4 flex items-center justify-center">
              <video
                src={recordedVideoUrl}
                controls
                autoPlay
                className="max-h-[380px] w-auto mx-auto"
              />
            </div>

            {/* Download Button */}
            <div className="space-y-2">
              <a
                href={recordedVideoUrl}
                download={`PSLE_P6_Chinese_Flashcards_${Date.now()}.webm`}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <Download className="w-4 h-4" /> 下载视频文件 (.webm / .mp4)
              </a>

              <button
                onClick={() => setShowResultModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                返回继续制作其他单元
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
