import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

// Detect if app is already installed
const isStandalone = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
};

// Detect iOS
const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export function PWAInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if already dismissed in this session
        const sessionDismissed = sessionStorage.getItem('pwa-install-dismissed');
        if (sessionDismissed) {
            setDismissed(true);
            return;
        }

        // Don't show if already installed
        if (isStandalone()) {
            setDismissed(true);
            return;
        }

        // For Chrome/Edge/Samsung Internet (Android, Desktop)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS()) {
            // Show iOS instructions
            setShowIOSInstructions(true);
        } else if (deferredPrompt) {
            // Show native install prompt for Android/Desktop
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }

            setDeferredPrompt(null);
            handleDismiss();
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        setShowIOSInstructions(false);
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    };

    // Don't show button if dismissed or no way to install
    if (dismissed || (!deferredPrompt && !isIOS())) {
        return null;
    }

    // iOS Instructions Modal
    if (showIOSInstructions) {
        return (
            <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 animate-fadeIn">
                <div className="w-full max-w-md mx-4 mb-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 animate-slideUp">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="font-semibold text-[var(--color-text)]">Install BizPocket</h3>
                        <button
                            onClick={handleDismiss}
                            className="p-2 -mr-2 -mt-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-3 text-sm text-[var(--color-text)]">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-400 font-semibold">1</span>
                            </div>
                            <p>Tap the <strong>Share</strong> button at the bottom of Safari</p>
                        </div>

                        <div className="flex items-start gap-3 text-sm text-[var(--color-text)]">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-400 font-semibold">2</span>
                            </div>
                            <p>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                        </div>

                        <div className="flex items-start gap-3 text-sm text-[var(--color-text)]">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-400 font-semibold">3</span>
                            </div>
                            <p>Tap <strong>"Add"</strong> in the top right corner</p>
                        </div>
                    </div>

                    <div className="bg-[var(--color-surface-2)] rounded-xl p-3 mb-4">
                        <p className="text-xs text-[var(--color-text-muted)] text-center">
                            📱 Full-screen experience • Faster loading • Offline access
                        </p>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="w-full py-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        );
    }

    // Install Button
    return (
        <button
            onClick={handleInstallClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl transition-colors border border-purple-500/20"
        >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Install App</span>
        </button>
    );
}
