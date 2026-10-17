import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, CreditCard, Receipt, FileText, Filter, Linkedin } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Badge';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Spinner';
import { RetryCard } from '../components/ui/ErrorBoundary';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { getScans } from '../lib/supabase';
import { formatMoney, timeAgo, getScanTypeLabel, getScanTypeColor, debounce } from '../lib/utils';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'business_card', label: 'Cards' },
  { id: 'receipt', label: 'Receipts' },
  { id: 'invoice', label: 'Invoices' },
  { id: 'linkedin_qr', label: 'LinkedIn' }
];

export default function History() {
  const { user } = useAuth();
  const { currency } = useTheme();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchScans = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getScans(user.id);
      setScans(data);
    } catch (err) {
      console.error('Failed to fetch scans:', err);
      setError('Failed to load scans. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  // Filter and search scans
  const filteredScans = useMemo(() => {
    let result = scans;

    // Type filter
    if (filter !== 'all') {
      result = result.filter(s => s.type === filter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => {
        const json = s.structured_json || {};
        const searchableText = [
          json.name,
          json.company,
          json.merchant,
          json.email,
          json.phone,
          s.raw_text
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableText.includes(query);
      });
    }

    return result;
  }, [scans, filter, searchQuery]);

  // Group by date
  const groupedScans = useMemo(() => {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    filteredScans.forEach(scan => {
      const date = new Date(scan.created_at).toDateString();
      let label;

      if (date === today) label = 'Today';
      else if (date === yesterday) label = 'Yesterday';
      else label = new Date(scan.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      if (!groups[label]) groups[label] = [];
      groups[label].push(scan);
    });

    return groups;
  }, [filteredScans]);

  const handleSearchChange = debounce((value) => {
    setSearchQuery(value);
  }, 300);

  const getIcon = (type) => {
    switch (type) {
      case 'business_card': return CreditCard;
      case 'receipt': return Receipt;
      case 'invoice': return FileText;
      case 'linkedin_qr': return Linkedin;
      default: return FileText;
    }
  };

  // Show error state with retry
  if (error && !loading) {
    return (
      <>
        <Header title="History" />
        <PageWrapper className="pt-4">
          <RetryCard message={error} onRetry={fetchScans} />
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <Header title="History" />
      <PageWrapper className="pt-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-dim)]" />
          <input
            type="text"
            placeholder="Search scans..."
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
          {FILTER_OPTIONS.map(({ id, label }) => (
            <Chip
              key={id}
              active={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </Chip>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredScans.length === 0 ? (
          <Card className="text-center py-12">
            <Filter className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-dim)]" />
            <p className="text-[var(--color-text-muted)]">
              {searchQuery ? 'No scans match your search' : 'No scans yet'}
            </p>
          </Card>
        ) : (
          Object.entries(groupedScans).map(([date, items]) => (
            <div key={date} className="mb-6">
              <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">
                {date}
              </h3>
              <div className="space-y-3">
                {items.map(scan => {
                  const Icon = getIcon(scan.type);
                  const json = scan.structured_json || {};
                  const title = json.name || json.merchant || getScanTypeLabel(scan.type);

                  return (
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
                            <Icon className="w-5 h-5 text-[var(--color-text-muted)]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--color-text)] truncate">
                            {title}
                          </p>
                          {scan.type === 'linkedin_qr' && json.linkedin_url && (
                            <p className="text-xs text-blue-400 truncate mt-0.5">
                              {json.linkedin_url}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getScanTypeColor(scan.type)}>
                              {getScanTypeLabel(scan.type)}
                            </Badge>
                            <span className="text-xs text-[var(--color-text-dim)]">
                              {timeAgo(scan.created_at)}
                            </span>
                          </div>
                        </div>
                        {(scan.type === 'receipt' || scan.type === 'invoice') && json.total && (
                          <p className="font-semibold text-emerald-400 text-sm">
                            {formatMoney(json.total, currency)}
                          </p>
                        )}
                        {scan.type === 'linkedin_qr' && json.linkedin_url && (
                          <Linkedin className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </PageWrapper>
    </>
  );
}
