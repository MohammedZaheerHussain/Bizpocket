import { cn } from '../../lib/utils';

export function Spinner({ size = 'md', className }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <svg 
      className={cn('animate-spin text-purple-500', sizes[size], className)} 
      viewBox="0 0 24 24" 
      fill="none"
    >
      <circle 
        cx="12" cy="12" r="10" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeOpacity="0.25" 
      />
      <path 
        d="M12 2a10 10 0 0 1 10 10" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
    </svg>
  );
}

export function FullPageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)]">
      <Spinner size="xl" />
      <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
    </div>
  );
}

export function Skeleton({ className }) {
  return (
    <div className={cn('skeleton rounded-lg', className)} />
  );
}
