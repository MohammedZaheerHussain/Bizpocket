import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Key, Copy, Eye, EyeOff, ExternalLink, Shield } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Spinner';
import { RetryCard } from '../components/ui/ErrorBoundary';
import { PasswordEntryModal } from '../components/ui/PasswordEntryModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
    getPasswordVaultEntries,
    insertPasswordVaultEntry,
    updatePasswordVaultEntry,
    deletePasswordVaultEntry,
    updatePasswordVaultLastUsed
} from '../lib/supabase';
import { encryptPassword, decryptPassword, copyToClipboard } from '../lib/passwordUtils';
import { getErrorMessage } from '../lib/utils';

export default function PasswordVault() {
    const { user } = useAuth();
    const toast = useToast();
    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [visiblePasswords, setVisiblePasswords] = useState(new Set());

    // Encryption key derived from user ID (in production, consider more secure approach)
    const encryptionKey = user?.id || 'default-key';

    const fetchEntries = useCallback(async () => {
        if (!user) {
            setError('You must be logged in to access the password vault.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getPasswordVaultEntries(user.id);
            setEntries(data);
            setFilteredEntries(data);
        } catch (err) {
            console.error('Failed to fetch password vault:', err);

            // Provide specific error messages based on the error
            let errorMessage = 'Failed to load passwords. ';

            if (err.message?.includes('relation "password_vault" does not exist') ||
                err.message?.includes('does not exist')) {
                errorMessage = 'Password Vault is not set up yet. The database table needs to be created. Please contact support or check the setup instructions.';
            } else if (err.message?.includes('JWT') || err.message?.includes('auth')) {
                errorMessage = 'Authentication error. Please try logging out and logging back in.';
            } else if (err.message?.includes('permission') || err.message?.includes('policy')) {
                errorMessage = 'Permission denied. Please check your account permissions.';
            } else if (err.message) {
                errorMessage += err.message;
            } else {
                errorMessage += 'Please try again.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    // Filter entries based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredEntries(entries);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = entries.filter(
                (entry) =>
                    entry.website_name?.toLowerCase().includes(query) ||
                    entry.username?.toLowerCase().includes(query) ||
                    entry.website_url?.toLowerCase().includes(query)
            );
            setFilteredEntries(filtered);
        }
    }, [searchQuery, entries]);

    const handleAddNew = () => {
        setSelectedEntry(null);
        setShowModal(true);
    };

    const handleEdit = (entry) => {
        // Decrypt password before editing
        const decryptedEntry = {
            ...entry,
            password: decryptPassword(entry.password_encrypted, encryptionKey)
        };
        setSelectedEntry(decryptedEntry);
        setShowModal(true);
    };

    const handleSave = async (formData) => {
        try {
            // Encrypt password before saving
            const encryptedPassword = encryptPassword(formData.password, encryptionKey);

            const dataToSave = {
                user_id: user.id,
                website_name: formData.website_name,
                website_url: formData.website_url || null,
                username: formData.username,
                password_encrypted: encryptedPassword,
                password_strength: formData.password_strength,
                notes: formData.notes || null,
                favicon_url: formData.website_url
                    ? `https://www.google.com/s2/favicons?domain=${formData.website_url}&sz=64`
                    : null
            };

            if (selectedEntry?.id) {
                // Update existing
                await updatePasswordVaultEntry(selectedEntry.id, dataToSave);
                toast.success('Password updated successfully');
            } else {
                // Insert new
                await insertPasswordVaultEntry(dataToSave);
                toast.success('Password saved successfully');
            }

            setShowModal(false);
            setSelectedEntry(null);
            fetchEntries();
        } catch (err) {
            console.error('Failed to save password:', err);
            toast.error(getErrorMessage(err));
        }
    };

    const handleDelete = async (id) => {
        try {
            await deletePasswordVaultEntry(id);
            toast.success('Password deleted successfully');
            setShowModal(false);
            setSelectedEntry(null);
            fetchEntries();
        } catch (err) {
            console.error('Failed to delete password:', err);
            toast.error(getErrorMessage(err));
        }
    };

    const handleCopyPassword = async (entry) => {
        try {
            const decryptedPassword = decryptPassword(entry.password_encrypted, encryptionKey);
            const success = await copyToClipboard(decryptedPassword);

            if (success) {
                toast.success('Password copied to clipboard');
                // Update last used timestamp
                await updatePasswordVaultLastUsed(entry.id);
            } else {
                toast.error('Failed to copy password');
            }
        } catch (err) {
            console.error('Failed to copy password:', err);
            toast.error('Failed to copy password');
        }
    };

    const handleCopyUsername = async (username) => {
        const success = await copyToClipboard(username);
        if (success) {
            toast.success('Username copied to clipboard');
        } else {
            toast.error('Failed to copy username');
        }
    };

    const togglePasswordVisibility = (id) => {
        setVisiblePasswords((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const getPasswordDisplay = (entry) => {
        if (visiblePasswords.has(entry.id)) {
            return decryptPassword(entry.password_encrypted, encryptionKey);
        }
        return '••••••••';
    };

    // Show error state with retry
    if (error && !loading) {
        return (
            <>
                <Header title="Password Vault" />
                <PageWrapper className="pt-4">
                    <Card className="mb-4 border-red-500/30 bg-red-500/10">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-5 h-5 text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-[var(--color-text)] mb-2">
                                    Password Vault Error
                                </h3>
                                <p className="text-sm text-[var(--color-text-muted)] mb-3">
                                    {error}
                                </p>
                                {error.includes('database table') && (
                                    <div className="p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] text-xs mb-3">
                                        <p className="font-semibold mb-2">Setup Required:</p>
                                        <ol className="list-decimal list-inside space-y-1 text-[var(--color-text-dim)]">
                                            <li>Open Supabase Dashboard</li>
                                            <li>Go to SQL Editor</li>
                                            <li>Run the password_vault setup script</li>
                                            <li>Refresh this page</li>
                                        </ol>
                                    </div>
                                )}
                                <button
                                    onClick={fetchEntries}
                                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </Card>
                </PageWrapper>
            </>
        );
    }

    return (
        <>
            <Header title="Password Vault" />
            <PageWrapper className="pt-4">
                {/* Info Banner */}
                <Card className="mb-4 bg-purple-500/10 border-purple-500/30">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[var(--color-text)] mb-1">
                                Secure Password Storage
                            </h3>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Your passwords are encrypted and stored securely. Only you can access them.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Search Bar */}
                <div className="mb-4 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-dim)]" />
                    <input
                        type="text"
                        placeholder="Search passwords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                    />
                </div>

                {/* Add New Button */}
                <button
                    onClick={handleAddNew}
                    className="w-full mb-4 p-4 gradient-primary rounded-xl flex items-center justify-center gap-2 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
                >
                    <Plus className="w-5 h-5" />
                    Add New Password
                </button>

                {/* Password List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="flex items-center gap-4">
                                <Skeleton className="w-12 h-12 rounded-xl" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <Card className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                            <Key className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-[var(--color-text)] mb-2">
                            {searchQuery ? 'No passwords found' : 'No passwords yet'}
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)] mb-4">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Start by adding your first password'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={handleAddNew}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Password
                            </button>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredEntries.map((entry) => (
                            <Card key={entry.id} className="overflow-hidden">
                                <div className="flex items-start gap-3">
                                    {/* Favicon */}
                                    <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {entry.favicon_url ? (
                                            <img
                                                src={entry.favicon_url}
                                                alt=""
                                                className="w-8 h-8"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = '<svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>';
                                                }}
                                            />
                                        ) : (
                                            <Key className="w-6 h-6 text-purple-400" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-[var(--color-text)] truncate">
                                                    {entry.website_name}
                                                </h3>
                                                {entry.website_url && (
                                                    <a
                                                        href={entry.website_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 truncate"
                                                    >
                                                        {new URL(entry.website_url).hostname}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleEdit(entry)}
                                                className="text-sm text-purple-400 hover:text-purple-300 font-medium flex-shrink-0"
                                            >
                                                Edit
                                            </button>
                                        </div>

                                        {/* Username */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm text-[var(--color-text-muted)] truncate flex-1">
                                                {entry.username}
                                            </span>
                                            <button
                                                onClick={() => handleCopyUsername(entry.username)}
                                                className="text-purple-400 hover:text-purple-300 p-1"
                                                title="Copy username"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Password */}
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm text-[var(--color-text)] flex-1">
                                                {getPasswordDisplay(entry)}
                                            </span>
                                            <button
                                                onClick={() => togglePasswordVisibility(entry.id)}
                                                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1"
                                                title={visiblePasswords.has(entry.id) ? 'Hide password' : 'Show password'}
                                            >
                                                {visiblePasswords.has(entry.id) ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleCopyPassword(entry)}
                                                className="text-purple-400 hover:text-purple-300 p-1"
                                                title="Copy password"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </PageWrapper>

            {/* Password Entry Modal */}
            {showModal && (
                <PasswordEntryModal
                    entry={selectedEntry}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedEntry(null);
                    }}
                />
            )}
        </>
    );
}
