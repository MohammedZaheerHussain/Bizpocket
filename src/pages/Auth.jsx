import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Wallet, ScanLine } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PWAInstallButton } from '../components/ui/PWAInstallButton';
import { supabase, signIn, signUp } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/utils';

export default function Auth() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = location.state?.from || '/dashboard';

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
        await signUp(email, password);
        toast.success('Account created! Please check your email to verify.');
        navigate('/dashboard', { replace: true });
      }

    } catch (error) {
      toast.error(getErrorMessage(error));
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
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>


    </div>
  );
}
