import { cn } from '../../lib/utils';

export function PageWrapper({
  children,
  className,
  noPadding = false,
  noBottomPadding = false
}) {
  return (
    <main className={cn(
      'min-h-screen bg-[var(--color-bg)]',
      !noPadding && 'px-4 md:px-6 lg:px-8',
      !noBottomPadding && 'pb-28 md:pb-8', // Space for bottom nav on mobile, less on desktop
      className
    )}>
      {/* Responsive container: mobile-first, expands on larger screens */}
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        {children}
      </div>
    </main>
  );
}
