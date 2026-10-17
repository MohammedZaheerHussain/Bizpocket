import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Trash2, Key } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { PasswordStrengthIndicator, PasswordGenerator } from './PasswordComponents';
import { calculatePasswordStrength } from '../../lib/passwordUtils';

/**
 * Password Entry Modal
 * Add or Edit password vault entries
 */
export function PasswordEntryModal({ entry = null, onSave, onDelete, onClose }) {
    const [formData, setFormData] = useState({
        website_name: '',
        website_url: '',
        username: '',
        password: '',
        notes: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [loading, setLoading] = useState(false);

    // Populate form if editing
    useEffect(() => {
        if (entry) {
            setFormData({
                website_name: entry.website_name || '',
                website_url: entry.website_url || '',
                username: entry.username || '',
                password: entry.password || '', // Will be decrypted by parent
                notes: entry.notes || ''
            });
        }
    }, [entry]);

    // Update password strength when password changes
    useEffect(() => {
        if (formData.password) {
            const strength = calculatePasswordStrength(formData.password);
            setPasswordStrength(strength);
        } else {
            setPasswordStrength(null);
        }
    }, [formData.password]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.website_name || !formData.username || !formData.password) {
            return;
        }

        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                password_strength: passwordStrength?.score || 0
            };
            await onSave(dataToSave);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!entry?.id) return;

        if (confirm('Are you sure you want to delete this password?')) {
            setLoading(true);
            try {
                await onDelete(entry.id);
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePasswordGenerated = (password) => {
        setFormData({ ...formData, password });
        setShowGenerator(false);
    };

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="w-full max-w-md bg-[var(--color-surface)] rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] p-6 pb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[var(--color-text)]">
                                {entry ? 'Edit Password' : 'Add Password'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center hover:bg-[var(--color-surface-3)] transition-colors"
                            >
                                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <Input
                            label="Website Name *"
                            placeholder="e.g., Google, Facebook"
                            value={formData.website_name}
                            onChange={(e) => setFormData({ ...formData, website_name: e.target.value })}
                            required
                        />

                        <Input
                            label="Website URL"
                            type="url"
                            placeholder="https://example.com"
                            value={formData.website_url}
                            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        />

                        <Input
                            label="Username / Email *"
                            placeholder="username@example.com"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />

                        {/* Password Field with Generator */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                                Password *
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Enter password"
                                        required
                                        className="w-full px-4 py-2.5 pr-10 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowGenerator(true)}
                                    className="px-4 py-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-500/20 transition-colors"
                                    title="Generate Password"
                                >
                                    <Key className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Password Strength */}
                            {formData.password && (
                                <div className="mt-2">
                                    <PasswordStrengthIndicator
                                        password={formData.password}
                                        strength={passwordStrength}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Optional notes..."
                                rows={3}
                                className="w-full px-4 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            {entry && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleDelete}
                                    loading={loading}
                                    className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={loading}
                                className="flex-1"
                            >
                                {entry ? 'Update' : 'Save'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Password Generator */}
            {showGenerator && (
                <PasswordGenerator
                    onPasswordGenerated={handlePasswordGenerated}
                    onClose={() => setShowGenerator(false)}
                />
            )}
        </>
    );
}
