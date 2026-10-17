import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Wallet, ScanLine, MailCheck, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PWAInstallButton } from '../components/ui/PWAInstallButton';
import { supabase, signIn, signUp, resendVerificationEmail } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/utils';

export default function Auth() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState(null);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = location.state?.from || '/dashboard';

  useEffect(() => {
    if (location.state?.emailConfirmationSent) {
      setConfirmationNotice({
        email: location.state.email || '',
        message: location.state.message || 'A confirmation email has been sent. Please verify via email to proceed further.'
      });
    }
  }, [location.state]);

  // Check if Supabase is configured
  if (!supabase) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-bg)]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <ScanLine className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">
            Supabase Not Configured
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Please add your Supabase credentials to the <code className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)]">.env</code> file:
          </p>
          <div className="text-left bg-[var(--color-surface)] p-4 rounded-xl text-xs font-mono text-[var(--color-text-muted)]">
            <p>VITE_SUPABASE_URL=your_url</p>
            <p>VITE_SUPABASE_ANON_KEY=your_key</p>
          </div>
        </div>
      </div>
    );
  }

  const handleResendEmail = async () => {
    const targetEmail = confirmationNotice?.email || email;
    if (!targetEmail) {
      toast.error('Please enter your email address first');
      return;
    }

    setResending(true);
    try {
      await resendVerificationEmail(targetEmail);
      toast.success('Confirmation email resent! Please check your inbox.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      } else {
        const data = await signUp(email, password);
        // If email confirmation is enabled, session is null
        if (!data?.session) {
          setMode('signin');
          setConfirmationNotice({
            email,
            message: 'A confirmation email has been sent. Please verify via email to proceed further.'
          });
          toast.success('Confirmation email sent! Please check your inbox.');
        } else {
          toast.success('Account created!');
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (error) {
      const errMsg = error?.message || '';
      if (errMsg.toLowerCase().includes('email not confirmed')) {
        setConfirmationNotice({
          email,
          message: 'A confirmation email has been sent. Please verify via email to proceed further.'
        });
      } else {
        toast.error(getErrorMessage(error));
      }
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
            Scan & organize your business cards and receipts
          </p>

          {/* PWA Install Button */}
          <div className="mt-4 flex justify-center">
            <PWAInstallButton />
          </div>
        </div>

        {/* Friendly Confirmation Email Notice */}
        {confirmationNotice && (
          <div className="mb-6 p-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <MailCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">
                  Verify your email
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
                  {confirmationNotice.message}
                </p>
                {confirmationNotice.email && (
                  <p className="text-xs font-mono text-purple-300 mt-1 truncate">
                    {confirmationNotice.email}
                  </p>
                )}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={resending}
                    className="text-xs font-medium text-purple-400 hover:text-purple-300 disabled:opacity-50 underline transition-colors cursor-pointer"
                  >
                    {resending ? 'Sending...' : 'Resend confirmation email'}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmationNotice(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 -mr-1 transition-colors cursor-pointer"
                aria-label="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />

          {/* Forgot Password Link - Only show in signin mode */}
          {mode === 'signin' && (
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            loading={loading}
            className="mt-6"
          >
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setConfirmationNotice(null);
            }}
            className="text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
