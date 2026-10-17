import { X } from 'lucide-react';
import { Button } from './Button';

/**
 * Save Password Prompt
 * Appears after successful login/signup to suggest saving credentials
 */
export function SavePasswordPrompt({ websiteName = 'BizPocket', username, password, onSave, onDismiss }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onDismiss}
        >
            <div
                className="w-full max-w-sm bg-[var(--color-surface)] rounded-t-3xl sm:rounded-3xl shadow-xl p-6 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[var(--color-text)]">Save Password?</h3>
                    <button
                        onClick={onDismiss}
                        className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center hover:bg-[var(--color-surface-3)] transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                    </button>
                </div>

                {/* Info */}
                <div className="mb-6">
                    <p className="text-sm text-[var(--color-text-muted)] mb-4">
                        Would you like to save your password for <span className="font-semibold text-[var(--color-text)]">{websiteName}</span>?
                    </p>

                    <div className="space-y-2 p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
                        <div>
                            <p className="text-xs text-[var(--color-text-dim)] mb-1">Username</p>
                            <p className="text-sm text-[var(--color-text)] font-medium">{username}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--color-text-dim)] mb-1">Password</p>
                            <p className="text-sm text-[var(--color-text)] font-mono">••••••••</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onDismiss}
                        className="flex-1"
                    >
                        Not Now
                    </Button>
                    <Button
                        onClick={onSave}
                        className="flex-1"
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
