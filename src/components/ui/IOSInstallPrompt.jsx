import { useState, useEffect } from 'react';
import { X, Share, PlusSquare, ArrowDown } from 'lucide-react';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';

// Detect if running on iOS
const isIOS = () => {
    if (!isBrowser) return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Detect if app is in standalone mode (installed as PWA)
const isStandalone = () => {
    if (!isBrowser) return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
};

// Check if this is Safari on iOS
const isIOSSafari = () => {
    if (!isBrowser) return false;
    const ua = navigator.userAgent;
    return isIOS() && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
};

export function IOSInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if we should show the prompt
        const shouldShow = isIOS() && !isStandalone() && !dismissed;

        // Check localStorage for previous dismissal
        const wasDismissed = localStorage.getItem('ios-install-dismissed');
        const dismissedTime = wasDismissed ? parseInt(wasDismissed) : 0;
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        // Show again after 7 days
        if (shouldShow && (!wasDismissed || daysSinceDismissed > 7)) {
            // Delay showing the prompt so it doesn't appear immediately
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [dismissed]);

    const handleDismiss = () => {
        setShowPrompt(false);
        setDismissed(true);
        localStorage.setItem('ios-install-dismissed', Date.now().toString());
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 animate-fadeIn">
            <div
                className="w-full max-w-md mx-4 mb-4 bg-[var(--color-surface)] rounded-2xl p-5 animate-slideUp"
                style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <img
                            src="/icon-192.png"
                            alt="BizPocket"
                            className="w-12 h-12 rounded-xl"
                        />
                        <div>
                            <h3 className="font-semibold text-[var(--color-text)]">Install BizPocket</h3>
                            <p className="text-sm text-[var(--color-text-muted)]">Add to Home Screen</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-2 -mr-2 -mt-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Instructions */}
                <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text)]">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-400 font-semibold">1</span>
                        </div>
                        <p>
                            Tap the <Share className="w-4 h-4 inline text-blue-400 mx-1" />
                            Share button in {isIOSSafari() ? 'Safari' : 'your browser'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-[var(--color-text)]">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-400 font-semibold">2</span>
                        </div>
                        <p>
                            Scroll down and tap <PlusSquare className="w-4 h-4 inline text-[var(--color-text)] mx-1" />
                            <strong>Add to Home Screen</strong>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-[var(--color-text)]">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-400 font-semibold">3</span>
                        </div>
                        <p>
                            Tap <strong>Add</strong> in the top right corner
                        </p>
                    </div>
                </div>

                {/* Benefits */}
                <div className="bg-[var(--color-surface-2)] rounded-xl p-3 mb-4">
                    <p className="text-xs text-[var(--color-text-muted)] text-center">
                        📱 Install for full-screen experience, faster loading & offline access
                    </p>
                </div>

                {/* Arrow pointing to share button location */}
                <div className="flex justify-center">
                    <ArrowDown className="w-6 h-6 text-purple-400 animate-bounce" />
                </div>

                {/* Dismiss button */}
                <button
                    onClick={handleDismiss}
                    className="w-full mt-3 py-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
}

// Hook to detect PWA install state
export function usePWAInstall() {
    const [isInstalled, setIsInstalled] = useState(false);
    const [canInstall, setCanInstall] = useState(false);

    useEffect(() => {
        setIsInstalled(isStandalone());
        setCanInstall(isIOS() && !isStandalone());

        // Listen for display mode changes
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handler = (e) => setIsInstalled(e.matches);
        mediaQuery.addEventListener('change', handler);

        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    return { isInstalled, canInstall, isIOS: isIOS() };
}
