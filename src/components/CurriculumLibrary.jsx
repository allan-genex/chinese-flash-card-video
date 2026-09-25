import React, { useState } from 'react';
import { Search, Plus, Volume2, CheckSquare, Square, Download, Upload, Filter, Tag, Trash2 } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export default function CurriculumLibrary({
  words,
  selectedWordIds,
  onToggleWord,
  onSelectAll,
  onDeselectAll,
  onAddCustomWord,
  onDeleteWord,
  units,
  selectedUnit,
  onSelectUnit,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Word Form State
  const [newWord, setNewWord] = useState({
    word: '',
    pinyin: '',
    english: '',
    unit: '6A 单元一：加油！加油！',
    tag: '自定义生字',
    collocations: '',
    sentence: '',
    sentenceEn: '',
  });

  const filteredWords = words.filter((w) => {
    const matchesUnit =
      selectedUnit === '全部词语 (All Words)' || w.unit === selectedUnit;
    const matchesSearch =
      w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.pinyin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.english.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesUnit && matchesSearch;
  });

  const handleCreateWord = (e) => {
    e.preventDefault();
    if (!newWord.word.trim()) return;

    const item = {
      id: `custom-${Date.now()}`,
      word: newWord.word.trim(),
      pinyin: newWord.pinyin.trim(),
      english: newWord.english.trim(),
      unit: newWord.unit,
      unitCode: 'Custom',
      tag: newWord.tag || '自定义生字',
      collocations: newWord.collocations
        ? newWord.collocations.split(/[,，|、]/).map((s) => s.trim()).filter(Boolean)
        : [],
      sentence: newWord.sentence.trim(),
      sentencePinyin: '',
      sentenceEn: newWord.sentenceEn.trim(),
    };

    onAddCustomWord(item);
    setShowAddModal(false);
    setNewWord({
      word: '',
      pinyin: '',
      english: '',
      unit: '6A 单元一：加油！加油！',
      tag: '自定义生字',
      collocations: '',
      sentence: '',
      sentenceEn: '',
    });
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(words, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `PSLE_P6_Chinese_Vocabulary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            📚 小六 PSLE 华文考纲词库
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            包含《欢乐伙伴》6A/6B 核心生字、词语搭配与历年会考必考成语
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> 添加自定义词语
          </button>
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" /> 导出词库 JSON
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Unit Dropdown */}
          <div className="md:w-72">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              课程单元筛选
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => onSelectUnit(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              搜索生字、拼音或英文释义
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="例如：克服、kè fú、overcome、成语..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Selection Shortcuts */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <div className="text-slate-500">
            显示 <span className="font-bold text-slate-800">{filteredWords.length}</span> 个词语 | 已勾选用于生成视频：
            <span className="font-bold text-red-600 ml-1">{selectedWordIds.size}</span> 个
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectAll(filteredWords.map((w) => w.id))}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              全选当前显示
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={onDeselectAll}
              className="text-slate-500 hover:text-slate-700 font-medium"
            >
              清空选择
            </button>
          </div>
        </div>
      </div>

      {/* Vocabulary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWords.map((wordItem) => {
          const isSelected = selectedWordIds.has(wordItem.id);
          return (
            <div
              key={wordItem.id}
              onClick={() => onToggleWord(wordItem.id)}
              className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 relative bg-white flex flex-col justify-between ${
                isSelected
                  ? 'border-red-500 shadow-md shadow-red-500/10'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Top Bar */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWord(wordItem.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 fill-red-50" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                  <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700">
                    {wordItem.tag || '生字'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    audioEngine.speakChinese(`${wordItem.word}。${wordItem.sentence || ''}`);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-colors"
                  title="朗读"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Word & Pinyin */}
              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-serif font-bold text-slate-900 tracking-wide">
                    {wordItem.word}
                  </h3>
                  <span className="text-sm font-semibold text-red-600">
                    {wordItem.pinyin}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {wordItem.english}
                </p>
              </div>

              {/* Collocations */}
              {wordItem.collocations && wordItem.collocations.length > 0 && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 text-xs">
                  <span className="font-semibold text-slate-500 block mb-0.5">搭配：</span>
                  <span className="text-slate-700 font-medium">
                    {wordItem.collocations.join(' · ')}
                  </span>
                </div>
              )}

              {/* Sentence */}
              {wordItem.sentence && (
                <div className="text-xs text-slate-500 italic border-l-2 border-red-300 pl-2 mt-auto">
                  “{wordItem.sentence}”
                </div>
              )}

              {/* Custom Word Delete */}
              {wordItem.id.startsWith('custom-') && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteWord(wordItem.id);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 删除
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              ➕ 添加自定义小六生字/词语
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              可用于输入孩子每周的听写表（Spelling List）或专项补充词汇
            </p>

            <form onSubmit={handleCreateWord} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">生字 / 词语 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例如：毅力"
                    value={newWord.word}
                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">汉语拼音</label>
                  <input
                    type="text"
                    placeholder="例如：yì lì"
                    value={newWord.pinyin}
                    onChange={(e) => setNewWord({ ...newWord, pinyin: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">英文释义</label>
                <input
                  type="text"
                  placeholder="例如：willpower, perseverance"
                  value={newWord.english}
                  onChange={(e) => setNewWord({ ...newWord, english: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">词语搭配 (用逗号分隔)</label>
                <input
                  type="text"
                  placeholder="例如：顽强的毅力, 凭借毅力"
                  value={newWord.collocations}
                  onChange={(e) => setNewWord({ ...newWord, collocations: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">考试例句 (中文)</label>
                <textarea
                  rows={2}
                  placeholder="例如：他靠着顽强的毅力克服了重重困难。"
                  value={newWord.sentence}
                  onChange={(e) => setNewWord({ ...newWord, sentence: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">例句英文翻译</label>
                <input
                  type="text"
                  placeholder="He overcame numerous difficulties through tenacity."
                  value={newWord.sentenceEn}
                  onChange={(e) => setNewWord({ ...newWord, sentenceEn: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                >
                  保存并加入词库
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
