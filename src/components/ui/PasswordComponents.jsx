import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { generateStrongPassword, copyToClipboard } from '../../lib/passwordUtils';

/**
 * Password Strength Indicator Component
 * Displays visual strength bar and feedback
 */
export function PasswordStrengthIndicator({ password, strength }) {
    if (!password) return null;

    const { score = 0, label = 'Weak', feedback = [] } = strength || {};

    // Determine color based on score
    const getColor = () => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getTextColor = () => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-blue-400';
        if (score >= 40) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-2">
            {/* Strength Bar */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getColor()} transition-all duration-300`}
                        style={{ width: `${score}%` }}
                    />
                </div>
                <span className={`text-xs font-medium ${getTextColor()}`}>
                    {label}
                </span>
            </div>

            {/* Feedback */}
            {feedback.length > 0 && (
                <ul className="space-y-1">
                    {feedback.map((item, i) => (
                        <li key={i} className="text-xs text-[var(--color-text-muted)] flex items-start gap-1">
                            <span className="text-[var(--color-text-dim)] mt-0.5">•</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/**
 * Password Generator Component
 * Allows customization and generation of strong passwords
 */
export function PasswordGenerator({ onPasswordGenerated, onClose }) {
    const [length, setLength] = useState(16);
    const [options, setOptions] = useState({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true
    });
    const [generatedPassword, setGeneratedPassword] = useState('');

    // Generate password on mount and when options change
    useEffect(() => {
        generatePassword();
    }, [length, options]);

    const generatePassword = () => {
        const password = generateStrongPassword(length, options);
        setGeneratedPassword(password);
    };

    const handleUsePassword = () => {
        if (onPasswordGenerated) {
            onPasswordGenerated(generatedPassword);
        }
        if (onClose) {
            onClose();
        }
    };

    const handleCopy = async () => {
        const success = await copyToClipboard(generatedPassword);
        if (success) {
            // Could add a toast notification here
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}>
            <div
                className="w-full max-w-md bg-[var(--color-surface)] rounded-t-3xl sm:rounded-3xl shadow-xl p-6 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[var(--color-text)]">Password Generator</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center hover:bg-[var(--color-surface-3)] transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                    </button>
                </div>

                {/* Generated Password */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] font-mono text-sm">
                        <input
                            type="text"
                            value={generatedPassword}
                            readOnly
                            className="flex-1 bg-transparent text-[var(--color-text)] outline-none"
                        />
                        <button
                            onClick={handleCopy}
                            className="text-purple-400 hover:text-purple-300 transition-colors text-xs font-sans"
                        >
                            Copy
                        </button>
                    </div>
                </div>

                {/* Length Slider */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-[var(--color-text)]">Length</label>
                        <span className="text-sm text-[var(--color-text-muted)]">{length}</span>
                    </div>
                    <input
                        type="range"
                        min="8"
                        max="32"
                        value={length}
                        onChange={(e) => setLength(Number(e.target.value))}
                        className="w-full h-2 bg-[var(--color-surface-2)] rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    {[
                        { key: 'uppercase', label: 'Uppercase (A-Z)' },
                        { key: 'lowercase', label: 'Lowercase (a-z)' },
                        { key: 'numbers', label: 'Numbers (0-9)' },
                        { key: 'symbols', label: 'Symbols (!@#$...)' }
                    ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={options[key]}
                                onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                                className="w-5 h-5 rounded border-[var(--color-border)] bg-[var(--color-surface-2)] text-purple-500 focus:ring-2 focus:ring-purple-500/20"
                            />
                            <span className="text-sm text-[var(--color-text)]">{label}</span>
                        </label>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button variant="outline" onClick={generatePassword} className="flex-1">
                        Regenerate
                    </Button>
                    <Button onClick={handleUsePassword} className="flex-1">
                        Use Password
                    </Button>
                </div>
            </div>
        </div>
    );
}
