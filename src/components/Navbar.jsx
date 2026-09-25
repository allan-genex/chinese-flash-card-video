import React from 'react';
import { Film, BookOpen, Layers, Sparkles, Smartphone, Download } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, selectedCount, onOpenMobileModal }) {
  const navItems = [
    { id: 'studio', label: '视频制作与导出', icon: Film, badge: '核心' },
    { id: 'flashcard', label: '手机互动背诵', icon: Smartphone, badge: null },
    { id: 'library', label: '小六考纲词库', icon: BookOpen, badge: `${selectedCount} 词已选` },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('studio')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-500/20">
              <span className="text-xl font-bold font-serif">文</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">PSLE 小六华文闪卡短视频</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  🇸🇬 新加坡教育部课程
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Primary 6 Chinese Flashcard Video Studio</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2">
            <nav className="flex space-x-1 sm:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="hidden md:inline">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Scan Button */}
            <button
              onClick={onOpenMobileModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
              title="手机扫码在手机上使用"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">手机扫码</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
