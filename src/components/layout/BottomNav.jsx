import { NavLink } from 'react-router-dom';
import { Home, ScanLine, History, Key, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/scan', icon: ScanLine, label: 'Scan' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/password-vault', icon: Key, label: 'Passwords' },
  { to: '/settings', icon: Settings, label: 'Settings' }
];

export function BottomNav() {
  return (
    <>
      {/* Mobile Bottom Nav - hidden on desktop */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)] md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-purple-400'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'p-1.5 rounded-xl transition-all duration-200',
                    isActive && 'bg-purple-500/20'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex-col z-40">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--color-border)]">
          <h1 className="text-xl font-bold gradient-text">BizPocket</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Scan & Organize</p>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-purple-500/10 text-purple-400'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-5 h-5', isActive && 'text-purple-400')} />
                  <span className="font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-dim)] text-center">
            © 2026 BizPocket
          </p>
        </div>
      </aside>
    </>
  );
}
