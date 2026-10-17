import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { updatePassword, supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/utils';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [validToken, setValidToken] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();

    // Check if user has valid session from reset link
    useEffect(() => {
        const checkSession = async () => {
            if (!supabase) {
                setValidToken(false);
                return;
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();

                // If user has a valid session, they were authenticated via the reset link
                // The AuthCallback page handles the token verification and session setup
                if (session?.user) {
                    console.log('Valid session found for password reset');
                    setValidToken(true);
                } else {
                    console.log('No valid session for password reset');
                    setValidToken(false);
                    toast.error('Invalid or expired reset link. Please request a new one.');
                    setTimeout(() => navigate('/forgot-password'), 3000);
                }
            } catch (error) {
                console.error('Error checking session:', error);
                setValidToken(false);
                toast.error('Error validating reset link');
                setTimeout(() => navigate('/forgot-password'), 3000);
            }
        };

        checkSession();
    }, [navigate, toast]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await updatePassword(password);
            setResetSuccess(true);
            toast.success('Password updated successfully!');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/auth');
            }, 2000);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    // Show loading while checking token
    if (validToken === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                    <p className="text-sm text-[var(--color-text-muted)]">Verifying reset link...</p>
                </div>
            </div>
        );
    }

    // Show error if token is invalid
    if (validToken === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <Wallet className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">
                        Invalid Reset Link
                    </h1>
                    <p className="text-sm text-[var(--color-text-muted)]">
                        This password reset link is invalid or has expired. You will be redirected to request a new one.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center p-6 bg-[var(--color-bg)]">
            <div className="max-w-sm mx-auto w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold gradient-text">BizPocket</h1>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Set your new password
                    </p>
                </div>

                {!resetSuccess ? (
                    <>
                        {/* Instructions */}
                        <div className="mb-6 p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Enter a new password for your account. Make sure it's at least 6 characters long.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                type="password"
                                label="New Password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                autoFocus
                            />

                            <Input
                                type="password"
                                label="Confirm New Password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                            />

                            <Button
                                type="submit"
                                fullWidth
                                loading={loading}
                                className="mt-6"
                            >
                                Reset Password
                            </Button>
                        </form>
                    </>
                ) : (
                    <>
                        {/* Success Message */}
                        <div className="mb-6 p-6 bg-green-500/10 rounded-xl border border-green-500/20">
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                                    Password Reset Successful!
                                </h3>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    Your password has been updated. Redirecting to login...
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
