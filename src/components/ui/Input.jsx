import { cn } from '../../lib/utils';

export function Input({ 
  label, 
  hint, 
  error,
  className,
  ...props 
}) {
  return (
    <label className="grid gap-1.5">
      {label && (
        <span className="text-sm font-medium text-[var(--color-text-muted)]">
          {label}
        </span>
      )}
      <input
        className={cn(
          'h-11 w-full rounded-xl border bg-[var(--color-surface)] px-3',
          'text-[var(--color-text)] placeholder:text-[var(--color-text-dim)]',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
          'transition-all duration-200',
          error 
            ? 'border-red-500/50 focus:ring-red-500/50' 
            : 'border-[var(--color-border)]',
          className
        )}
        {...props}
      />
      {hint && !error && (
        <span className="text-xs text-[var(--color-text-dim)]">{hint}</span>
      )}
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </label>
  );
}

export function Textarea({ 
  label, 
  hint,
  error, 
  className,
  ...props 
}) {
  return (
    <label className="grid gap-1.5">
      {label && (
        <span className="text-sm font-medium text-[var(--color-text-muted)]">
          {label}
        </span>
      )}
      <textarea
        className={cn(
          'min-h-[100px] w-full rounded-xl border bg-[var(--color-surface)] px-3 py-2',
          'text-[var(--color-text)] placeholder:text-[var(--color-text-dim)]',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
          'transition-all duration-200 resize-none',
          error 
            ? 'border-red-500/50 focus:ring-red-500/50' 
            : 'border-[var(--color-border)]',
          className
        )}
        {...props}
      />
      {hint && !error && (
        <span className="text-xs text-[var(--color-text-dim)]">{hint}</span>
      )}
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </label>
  );
}

export function Select({
  label,
  options = [],
  className,
  ...props
}) {
  return (
    <label className="grid gap-1.5">
      {label && (
        <span className="text-sm font-medium text-[var(--color-text-muted)]">
          {label}
        </span>
      )}
      <select
        className={cn(
          'h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3',
          'text-[var(--color-text)]',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
          'transition-all duration-200',
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
