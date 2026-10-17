import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash parameters from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check query params (some providers use these)
        const queryParams = new URLSearchParams(window.location.search);
        const error = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          return;
        }

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            setStatus('error');
            setMessage(sessionError.message);
            return;
          }

          setStatus('success');
          if (type === 'signup' || type === 'email_confirm') {
            setMessage('Email verified successfully! Welcome to BizPocket.');
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 2000);
          } else if (type === 'recovery') {
            setMessage('Verification successful! You can now reset your password.');
            // Redirect to reset password page for password recovery
            setTimeout(() => {
              navigate('/reset-password', { replace: true });
            }, 1500);
          } else {
            setMessage('Authentication successful!');
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 2000);
          }
        } else {
          // No tokens, might be a different flow
          setStatus('success');
          setMessage('Verification complete! Redirecting...');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1500);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="text-center max-w-sm">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <Loader className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">
              Verifying...
            </h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">
              Success!
            </h1>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">
              Verification Failed
            </h1>
          </>
        )}

        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          {message}
        </p>

        {status === 'error' && (
          <Button onClick={() => navigate('/auth')} fullWidth>
            Back to Login
          </Button>
        )}
      </div>
    </div>
  );
}
