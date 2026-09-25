import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import VideoStudio from './components/VideoStudio';
import InteractiveFlashcard from './components/InteractiveFlashcard';
import CurriculumLibrary from './components/CurriculumLibrary';
import MobileConnectModal from './components/MobileConnectModal';
import { PSLE_CHINESE_VOCABULARY, CURRICULUM_UNITS } from './data/psleChineseVocabulary';

const STORAGE_KEY = 'PSLE_P6_VOCAB_CUSTOM_V1';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [selectedUnit, setSelectedUnit] = useState('全部词语 (All Words)');
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [words, setWords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const customWords = JSON.parse(saved);
        return [...PSLE_CHINESE_VOCABULARY, ...customWords];
      }
    } catch (e) {
      console.error(e);
    }
    return PSLE_CHINESE_VOCABULARY;
  });

  // Selected Words for video creation (by default select first 8 words of Chapter 1)
  const [selectedWordIds, setSelectedWordIds] = useState(() => {
    return new Set(PSLE_CHINESE_VOCABULARY.slice(0, 8).map((w) => w.id));
  });

  const handleToggleWord = (id) => {
    const next = new Set(selectedWordIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedWordIds(next);
  };

  const handleSelectAll = (ids) => {
    const next = new Set(selectedWordIds);
    ids.forEach((id) => next.add(id));
    setSelectedWordIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedWordIds(new Set());
  };

  const handleAddCustomWord = (newWord) => {
    const updated = [newWord, ...words];
    setWords(updated);
    // Select newly added word automatically
    const nextSelected = new Set(selectedWordIds);
    nextSelected.add(newWord.id);
    setSelectedWordIds(nextSelected);

    // Save custom words to localStorage
    const customOnly = updated.filter((w) => w.id.startsWith('custom-'));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
  };

  const handleDeleteWord = (id) => {
    const updated = words.filter((w) => w.id !== id);
    setWords(updated);
    const nextSelected = new Set(selectedWordIds);
    nextSelected.delete(id);
    setSelectedWordIds(nextSelected);

    const customOnly = updated.filter((w) => w.id.startsWith('custom-'));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
  };

  // Filter words for flashcard interactive mode
  const flashcardWords = words.filter((w) =>
    selectedUnit === '全部词语 (All Words)' ? true : w.unit === selectedUnit
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCount={selectedWordIds.size}
        onOpenMobileModal={() => setIsMobileModalOpen(true)}
      />

      {/* Mobile Connect QR Modal */}
      <MobileConnectModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'studio' && (
          <VideoStudio
            words={words}
            selectedWordIds={selectedWordIds}
            selectedUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
            units={CURRICULUM_UNITS}
          />
        )}

        {activeTab === 'flashcard' && (
          <InteractiveFlashcard
            words={flashcardWords.length > 0 ? flashcardWords : words}
            selectedUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
            units={CURRICULUM_UNITS}
          />
        )}

        {activeTab === 'library' && (
          <CurriculumLibrary
            words={words}
            selectedWordIds={selectedWordIds}
            onToggleWord={handleToggleWord}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onAddCustomWord={handleAddCustomWord}
            onDeleteWord={handleDeleteWord}
            units={CURRICULUM_UNITS}
            selectedUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
          />
        )}
      </main>

      {/* Floating Shortcut Bar for Library -> Video Studio */}
      {activeTab === 'library' && selectedWordIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-xs sm:text-sm">
            已勾选 <span className="text-red-400 font-bold">{selectedWordIds.size}</span> 个词语
          </span>
          <button
            onClick={() => setActiveTab('studio')}
            className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm"
          >
            立即生成短视频 →
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>🇸🇬 新加坡教育部 (MOE) 小学六年级华文 (Primary 6 PSLE Chinese) 课程闪卡与短视频生成系统</p>
        <p className="mt-1">支持移动端浏览器与电脑桌面直接录制并导出 WebM / MP4 高清视频</p>
      </footer>
    </div>
  );
}
