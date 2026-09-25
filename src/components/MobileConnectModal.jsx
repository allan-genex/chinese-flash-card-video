import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, Copy, Check, X, QrCode } from 'lucide-react';

export default function MobileConnectModal({ isOpen, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Public permanent URL
  const publicUrl = "https://allan-genex.github.io/chinese-flash-card-video/";
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const port = typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : '';
  const localUrl = `http://192.168.1.227${port || ':5173'}`;

  // Default to public URL if available
  const [selectedUrlType, setSelectedUrlType] = useState('cloud'); // 'cloud' | 'local'
  const mobileUrl = selectedUrlType === 'cloud' ? publicUrl : (currentHost === 'localhost' || currentHost === '127.0.0.1' ? localUrl : window.location.href);

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(mobileUrl, {
        width: 220,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then((url) => {
        setQrDataUrl(url);
      }).catch(console.error);
    }
  }, [isOpen, mobileUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1">
          📱 在手机上使用此应用
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          请确保手机与电脑连接到同一个家庭或学校 Wi-Fi
        </p>

        {/* QR Code Container */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block mb-4 shadow-inner">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Mobile QR Code" className="w-48 h-48 rounded-lg mx-auto" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
              生成二维码中...
            </div>
          )}
          <p className="text-[11px] text-slate-500 mt-2 font-medium">用手机相机直接扫码打开</p>
        </div>

        {/* URL Box & Copy */}
        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 mb-4 font-mono">
          <span className="truncate flex-1 text-left">{mobileUrl}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-600 transition-colors shadow-xs"
            title="复制链接"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="text-[11px] text-slate-400 text-left bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
          <p>💡 <span className="font-semibold text-slate-600">小提示：</span></p>
          <p>• 苹果 iPhone：在 Safari 浏览器中点击底部“分享”→“添加到主屏幕”，即可像原生 App 一样全屏使用！</p>
          <p>• 安卓 Android：在 Chrome 浏览器中点击右上角“⋮”→“安装应用 / 添加到桌面”。</p>
        </div>
      </div>
    </div>
  );
}
