import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../Logo';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 inset-x-0 p-4 z-50 pointer-events-none flex justify-center"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 max-w-md w-full pointer-events-auto flex items-center gap-4">
            <Logo size="md" />
            <div className="flex-1">
              <h4 className="font-bold text-gray-900">Install MultiShopNG</h4>
              <p className="text-xs text-gray-500">Shop from verified Nigerian sellers at multishopng.com</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleInstall} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
                Install App
              </button>
              <button onClick={() => setShowPrompt(false)} className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors text-center">
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
