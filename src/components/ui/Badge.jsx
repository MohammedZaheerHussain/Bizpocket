import { cn } from '../../lib/utils';

const badgeVariants = {
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/10 text-red-400 border-red-500/30',
  slate: 'bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border)]'
};

export function Badge({ 
  children, 
  variant = 'slate',
  className 
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
      badgeVariants[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function Chip({ 
  children, 
  active = false, 
  onClick,
  className 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200',
        active 
          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
          : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)]',
        className
      )}
    >
      {children}
    </button>
  );
}
