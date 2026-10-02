import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  Share2, 
  Copy, 
  Check, 
  X, 
  QrCode, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Globe, 
  ExternalLink,
  Laptop
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from './usePWAInstall';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install, downloadOfflineLauncher } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'android' | 'ios' | 'desktop'>('quick');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [appUrl, setAppUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      setAppUrl(url);

      QRCode.toDataURL(url, {
        width: 200,
        margin: 1,
        color: {
          dark: '#161823',
          light: '#FFFFFF',
        },
      })
        .then((dataUri) => setQrCodeDataUrl(dataUri))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isIOS) setActiveTab('ios');
    else if (isAndroid) setActiveTab('android');
    else setActiveTab('quick');
  }, [isIOS, isAndroid]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'kamalkingg - TikTok LIVE Rewards',
          text: 'Open and install the TikTok LIVE Rewards tracking app',
          url: appUrl || window.location.href,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#161823] to-[#262835] text-white p-6 pb-5">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-2">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-lg border border-white/15 flex-shrink-0">
                <img src="/pwa-192x192.png" alt="App Icon" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-lg leading-tight truncate">TikTok LIVE Rewards</h2>
                  <ShieldCheck className="w-4 h-4 text-[#FE2C55] flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-300 mt-0.5">kamalkingg • Progressive Web App</p>
                <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full mt-1.5 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Ready to install
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/70 text-xs font-semibold px-4 pt-2">
            <button
              onClick={() => setActiveTab('quick')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'quick'
                  ? 'border-[#FE2C55] text-[#FE2C55]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Quick Install
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'android'
                  ? 'border-[#FE2C55] text-[#FE2C55]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Android
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'ios'
                  ? 'border-[#FE2C55] text-[#FE2C55]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              iPhone / iPad
            </button>
            <button
              onClick={() => setActiveTab('desktop')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'desktop'
                  ? 'border-[#FE2C55] text-[#FE2C55]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              PC / Mac
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-5 overflow-y-auto space-y-4">
            {/* Main Action based on installability */}
            {activeTab === 'quick' && (
              <div className="space-y-4">
                {isInstalled ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                    <Check className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                    <h3 className="font-bold text-gray-900 text-sm">App Already Installed!</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      You are running the standalone TikTok LIVE Rewards app on this device.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Primary Install Button */}
                    <button
                      onClick={async () => {
                        if (isInstallable) {
                          await install();
                        } else if (isIOS) {
                          setActiveTab('ios');
                        } else {
                          setActiveTab('android');
                        }
                      }}
                      className="w-full bg-[#FE2C55] hover:bg-[#E9294D] text-white py-3.5 px-4 rounded-2xl font-bold text-base shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2.5 transition-transform active:scale-[0.98]"
                    >
                      <Download className="w-5 h-5" />
                      <span>{isInstallable ? 'Install App on this Device' : 'Download / Add to Phone'}</span>
                    </button>
                  </>
                )}

                {/* QR Code Card for Scanning from Mobile */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2">
                    <QrCode className="w-4 h-4 text-[#FE2C55]" />
                    <span>Scan with Mobile Camera to Install</span>
                  </div>
                  {qrCodeDataUrl ? (
                    <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-200">
                      <img src={qrCodeDataUrl} alt="QR Code to Download App" className="w-36 h-36" />
                    </div>
                  ) : (
                    <div className="w-36 h-36 bg-gray-200 animate-pulse rounded-xl" />
                  )}
                  <p className="text-[11px] text-gray-500 mt-2 max-w-[260px]">
                    Point your camera at this QR code to open and install the app instantly on your phone.
                  </p>
                </div>

                {/* Direct Link Sharing and Offline File Download */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-3 rounded-xl font-bold text-xs transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-gray-600" />
                        <span>Copy App Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNativeShare}
                    className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-3 rounded-xl font-bold text-xs transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-gray-600" />
                    <span>Share App</span>
                  </button>
                </div>

                {/* Offline Launcher Download */}
                <button
                  onClick={downloadOfflineLauncher}
                  className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span>Download Offline App Launcher (.html)</span>
                </button>
              </div>
            )}

            {/* Android Instructions */}
            {activeTab === 'android' && (
              <div className="space-y-3">
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    How to Install on Android
                  </h3>
                  <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                    <li>
                      Open this page in <strong>Google Chrome</strong> or your default browser.
                    </li>
                    <li>
                      Tap the <strong>three dots (⋮)</strong> menu in the top right corner.
                    </li>
                    <li>
                      Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                    </li>
                    <li>
                      Confirm by tapping <strong>Install</strong>. The app icon will appear directly in your app drawer and home screen!
                    </li>
                  </ol>
                </div>

                {isInstallable && (
                  <button
                    onClick={install}
                    className="w-full bg-[#FE2C55] hover:bg-[#E9294D] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Prompt Android Install Now</span>
                  </button>
                )}

                <button
                  onClick={handleCopyLink}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Link to Open in Chrome'}</span>
                </button>
              </div>
            )}

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="space-y-3">
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    How to Install on iPhone / iPad (Safari)
                  </h3>
                  <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                    <li>
                      Open this app in <strong>Safari</strong>.
                    </li>
                    <li>
                      Tap the <strong>Share</strong> button (the square with an arrow pointing up <span className="font-bold text-base">⎋</span>) at the bottom toolbar.
                    </li>
                    <li>
                      Scroll down in the share sheet and tap <strong>"Add to Home Screen"</strong> (with the plus <span className="font-bold text-base">⊕</span> icon).
                    </li>
                    <li>
                      Tap <strong>Add</strong> in the top right. You now have the full standalone app on your iPhone!
                    </li>
                  </ol>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied Safari Link!' : 'Copy Link to Open in Safari'}</span>
                </button>
              </div>
            )}

            {/* Desktop Instructions */}
            {activeTab === 'desktop' && (
              <div className="space-y-3">
                <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-2">
                    <Laptop className="w-4 h-4 text-purple-600" />
                    Install on Chrome, Edge or Brave
                  </h3>
                  <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                    <li>
                      Look at the right side of your browser address bar.
                    </li>
                    <li>
                      Click the <strong>Install</strong> or <strong>Computer screen with down-arrow</strong> icon.
                    </li>
                    <li>
                      Click <strong>Install</strong>. It launches in its own dedicated, native desktop window!
                    </li>
                  </ol>
                </div>

                {isInstallable && (
                  <button
                    onClick={install}
                    className="w-full bg-[#FE2C55] hover:bg-[#E9294D] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install on this Computer</span>
                  </button>
                )}

                <button
                  onClick={downloadOfflineLauncher}
                  className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span>Download Desktop App Launcher (.html)</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
            <p className="text-[11px] text-gray-400">
              No App Store or Play Store account needed • Free instant installation
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
