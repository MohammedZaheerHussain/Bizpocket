import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { sendPasswordResetEmail } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(email);
            setEmailSent(true);
            toast.success('Password reset email sent! Check your inbox.');
        } catch (error) {
            // For security, we show success even if email doesn't exist
            // This prevents email enumeration attacks
            console.error('Password reset error:', error);
            setEmailSent(true);
            toast.success('If an account exists with this email, you will receive a password reset link.');
        } finally {
            setLoading(false);
        }
    };

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
                        Reset your password
                    </p>
                </div>

                {!emailSent ? (
                    <>
                        {/* Instructions */}
                        <div className="mb-6 p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                type="email"
                                label="Email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                autoFocus
                            />

                            <Button
                                type="submit"
                                fullWidth
                                loading={loading}
                                className="mt-6"
                            >
                                Send Reset Link
                            </Button>
                        </form>
                    </>
                ) : (
                    <>
                        {/* Success Message */}
                        <div className="mb-6 p-6 bg-green-500/10 rounded-xl border border-green-500/20">
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Mail className="w-6 h-6 text-green-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                                    Check Your Email
                                </h3>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    We've sent a password reset link to <strong className="text-[var(--color-text)]">{email}</strong>
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-3">
                                    Didn't receive the email? Check your spam folder or try again.
                                </p>
                            </div>
                        </div>

                        {/* Resend Button */}
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() => setEmailSent(false)}
                            className="mb-4"
                        >
                            Send Another Email
                        </Button>
                    </>
                )}

                {/* Back to Login */}
                <Link
                    to="/auth"
                    className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-purple-400 mt-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
