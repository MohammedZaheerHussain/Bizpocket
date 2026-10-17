import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, CreditCard, Receipt, TrendingUp, Plus } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { RetryCard } from '../components/ui/ErrorBoundary';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { getScans } from '../lib/supabase';
import { formatMoney, timeAgo, getScanTypeLabel, getScanTypeColor } from '../lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const { currency } = useTheme();
  const [recentScans, setRecentScans] = useState([]);
  const [stats, setStats] = useState({ cards: 0, receipts: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const scans = await getScans(user.id);
      setRecentScans(scans.slice(0, 5));
      
      // Calculate stats
      const cards = scans.filter(s => s.type === 'business_card').length;
      const receipts = scans.filter(s => s.type === 'receipt' || s.type === 'invoice').length;
      const total = scans
        .filter(s => s.type === 'receipt' || s.type === 'invoice')
        .reduce((sum, s) => sum + (s.structured_json?.total || 0), 0);
      
      setStats({ cards, receipts, total });
    } catch (err) {
      console.error('Failed to fetch scans:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show error state with retry
  if (error && !loading) {
    return (
      <>
        <Header title="BizPocket" />
        <PageWrapper className="pt-4">
          <RetryCard message={error} onRetry={fetchData} />
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <Header title="BizPocket" />
      <PageWrapper className="pt-4">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text)]">
            Welcome back! 👋
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Scan and organize your business essentials
          </p>
        </div>

        {/* Quick Scan Button */}
        <Link to="/scan">
          <Card className="mb-6 gradient-primary border-0 group cursor-pointer">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <ScanLine className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Scan Now</h3>
                  <p className="text-sm text-white/70">Card or receipt</p>
                </div>
              </div>
              <Plus className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
            </div>
          </Card>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="text-center py-4">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-6 w-8 mx-auto" />
            ) : (
              <p className="text-xl font-bold text-[var(--color-text)]">{stats.cards}</p>
            )}
            <p className="text-xs text-[var(--color-text-muted)]">Cards</p>
          </Card>

          <Card className="text-center py-4">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-6 w-8 mx-auto" />
            ) : (
              <p className="text-xl font-bold text-[var(--color-text)]">{stats.receipts}</p>
            )}
            <p className="text-xs text-[var(--color-text-muted)]">Receipts</p>
          </Card>

          <Card className="text-center py-4 overflow-hidden">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-6 w-12 mx-auto" />
            ) : (
              <p className="text-sm font-bold text-[var(--color-text)] truncate px-1">
                {formatMoney(stats.total, currency)}
              </p>
            )}
            <p className="text-xs text-[var(--color-text-muted)]">Total</p>
          </Card>
        </div>

        {/* Recent Scans */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-[var(--color-text)]">Recent Scans</h3>
          <Link 
            to="/history" 
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : recentScans.length === 0 ? (
          <Card className="text-center py-8">
            <ScanLine className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-dim)]" />
            <p className="text-sm text-[var(--color-text-muted)]">
              No scans yet. Tap "Scan Now" to get started!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentScans.map(scan => (
              <Link key={scan.id} to={`/scan/${scan.id}`}>
                <Card hover className="flex items-center gap-4">
                  {scan.image_url ? (
                    <img 
                      src={scan.image_url} 
                      alt="" 
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center">
                      {scan.type === 'business_card' ? (
                        <CreditCard className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Receipt className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate">
                      {scan.structured_json?.name || 
                       scan.structured_json?.merchant || 
                       getScanTypeLabel(scan.type)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getScanTypeColor(scan.type)}>
                        {getScanTypeLabel(scan.type)}
                      </Badge>
                      <span className="text-xs text-[var(--color-text-dim)]">
                        {timeAgo(scan.created_at)}
                      </span>
                    </div>
                  </div>
                  {(scan.type === 'receipt' || scan.type === 'invoice') && scan.structured_json?.total && (
                    <p className="font-semibold text-emerald-400">
                      {formatMoney(scan.structured_json.total, currency)}
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </PageWrapper>
    </>
  );
}
