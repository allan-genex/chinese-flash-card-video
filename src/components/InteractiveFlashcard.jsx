import React, { useState } from 'react';
import { Volume2, RotateCcw, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../utils/audioEngine';

export default function InteractiveFlashcard({ words, selectedUnit, onSelectUnit, units }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState(new Set());
  const [reviewIds, setReviewIds] = useState(new Set());

  const currentWord = words[currentIndex] || words[0];

  const handleFlip = () => {
    audioEngine.playCardFlip();
    setIsFlipped(!isFlipped);
  };

  const handlePlayAudio = (e) => {
    e.stopPropagation();
    if (currentWord) {
      audioEngine.speakChinese(`${currentWord.word}。${currentWord.sentence || ''}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      audioEngine.playCardFlip();
    } else {
      // Completed set!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      audioEngine.playCardFlip();
    }
  };

  const markMastered = (e) => {
    e.stopPropagation();
    const nextMastered = new Set(masteredIds);
    nextMastered.add(currentWord.id);
    setMasteredIds(nextMastered);

    const nextReview = new Set(reviewIds);
    nextReview.delete(currentWord.id);
    setReviewIds(nextReview);

    audioEngine.playChime();
    handleNext();
  };

  const markNeedReview = (e) => {
    e.stopPropagation();
    const nextReview = new Set(reviewIds);
    nextReview.add(currentWord.id);
    setReviewIds(nextReview);

    const nextMastered = new Set(masteredIds);
    nextMastered.delete(currentWord.id);
    setMasteredIds(nextMastered);

    handleNext();
  };

  const restartDeck = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (!currentWord) {
    return (
      <div className="p-8 text-center text-slate-500">
        没有符合条件的词语，请重新筛选单元。
      </div>
    );
  }

  const isMastered = masteredIds.has(currentWord.id);
  const isReview = reviewIds.has(currentWord.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Unit Selector Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">📱 手机互动闪卡学习</h2>
          <p className="text-xs text-slate-500">随时随地滑动与点击翻转，巩固小六生字与考点</p>
        </div>
        <select
          value={selectedUnit}
          onChange={(e) => {
            onSelectUnit(e.target.value);
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
          className="text-sm px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* Progress Indicator */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs font-medium text-slate-500 mb-1">
          <span>进度：{currentIndex + 1} / {words.length}</span>
          <span>
            已掌握: <span className="text-emerald-600 font-bold">{masteredIds.size}</span> | 需复习: <span className="text-amber-600 font-bold">{reviewIds.size}</span>
          </span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-600 transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* The 3D Interactive Flip Card */}
      <div
        onClick={handleFlip}
        className="relative w-full aspect-[4/5] sm:aspect-[3/3.5] max-h-[520px] cursor-pointer select-none perspective-1000 my-4"
      >
        <div
          className={`w-full h-full duration-500 preserve-3d transition-transform relative rounded-3xl shadow-xl border-2 ${
            isFlipped ? 'rotate-y-180 border-red-300 bg-red-50/20' : 'border-slate-200 bg-white'
          }`}
        >
          {/* Card Front: Characters & Hint */}
          <div className="absolute inset-0 backface-hidden p-6 flex flex-col justify-between items-center bg-white rounded-3xl">
            <div className="w-full flex justify-between items-center">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-800">
                {currentWord.unitCode} · {currentWord.tag}
              </span>
              <button
                onClick={handlePlayAudio}
                className="p-2 rounded-full hover:bg-slate-100 text-red-600 transition-colors"
                title="朗读汉字"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Tianzige Boxes */}
            <div className="flex items-center justify-center gap-3 my-auto">
              {currentWord.word.split('').map((char, idx) => (
                <div
                  key={idx}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 border-2 border-red-200/80 rounded-xl flex items-center justify-center bg-amber-50/20 shadow-xs"
                >
                  {/* Grid guidelines */}
                  <div className="absolute inset-0 border-t border-dashed border-red-200/50 top-1/2 -translate-y-1/2" />
                  <div className="absolute inset-0 border-l border-dashed border-red-200/50 left-1/2 -translate-x-1/2" />
                  <span className="text-5xl sm:text-6xl font-serif font-bold text-slate-800 z-10">
                    {char}
                  </span>
                </div>
              ))}
            </div>

            <div className="w-full text-center">
              <p className="text-xs text-slate-400">💡 点击卡片翻面查看拼音、释义与真题搭配</p>
            </div>
          </div>

          {/* Card Back: Pinyin, Meaning, Collocations & Sentences */}
          <div className="absolute inset-0 rotate-y-180 backface-hidden p-6 flex flex-col justify-between bg-gradient-to-b from-white to-slate-50 rounded-3xl overflow-y-auto">
            <div className="w-full flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500">{currentWord.unit}</span>
              <button
                onClick={handlePlayAudio}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-medium"
              >
                <Volume2 className="w-4 h-4" /> 朗读例句
              </button>
            </div>

            <div className="text-center my-auto py-2 space-y-4">
              {/* Word & Pinyin */}
              <div>
                <h3 className="text-3xl font-serif font-bold text-slate-900">{currentWord.word}</h3>
                <p className="text-xl font-semibold text-red-600 tracking-wide mt-1">{currentWord.pinyin}</p>
              </div>

              {/* English */}
              <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                {currentWord.english}
              </div>

              {/* Collocations */}
              {currentWord.collocations && currentWord.collocations.length > 0 && (
                <div className="bg-red-50/70 p-3 rounded-2xl border border-red-100">
                  <div className="text-xs font-semibold text-red-800 mb-1">📝 PSLE 核心词语搭配</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {currentWord.collocations.join('  ·  ')}
                  </div>
                </div>
              )}

              {/* Sentence */}
              {currentWord.sentence && (
                <div className="bg-slate-100/80 p-3.5 rounded-2xl text-left border border-slate-200">
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    “{currentWord.sentence}”
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentWord.sentenceEn}
                  </p>
                </div>
              )}
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">💡 再次点击卡片即可返回正面</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons (Mastered / Review / Prev / Next) */}
      <div className="flex items-center justify-between gap-2 mt-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-2xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 flex gap-2">
          <button
            onClick={markNeedReview}
            className={`flex-1 py-3 px-3 rounded-2xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              isReview
                ? 'bg-amber-500 text-white shadow-amber-500/20'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertCircle className="w-4 h-4" /> 稍后复习
          </button>

          <button
            onClick={markMastered}
            className={`flex-1 py-3 px-3 rounded-2xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              isMastered
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> 已经掌握
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === words.length - 1}
          className="p-3 rounded-2xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Restart Deck Button */}
      <div className="text-center mt-6">
        <button
          onClick={restartDeck}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> 重新开始这组卡片
        </button>
      </div>
    </div>
  );
}
