import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PWAInstallButton } from '../ui/PWAInstallButton';
import { cn } from '../../lib/utils';

export function Header({
  title,
  showBack = false,
  backTo,
  action,
  className
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={cn(
      'sticky top-0 z-30 bg-[var(--color-bg)] border-b border-[var(--color-border)] safe-top',
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4 md:px-6 lg:px-8 max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-[var(--color-text)]">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <PWAInstallButton />
          {action && <div>{action}</div>}
        </div>
      </div>
    </header>
  );
}
