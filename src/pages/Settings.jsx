import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, DollarSign, Download, Trash2, ChevronRight, User, Key } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, ModalActions } from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { signOut, getScans } from '../lib/supabase';
import { getErrorMessage } from '../lib/utils';

const CURRENCIES = [
  { value: 'INR', label: '₹ INR - Indian Rupee' },
  { value: 'USD', label: '$ USD - US Dollar' },
  { value: 'EUR', label: '€ EUR - Euro' },
  { value: 'GBP', label: '£ GBP - British Pound' },
  { value: 'AED', label: 'د.إ AED - UAE Dirham' }
];

export default function Settings() {
  const { user } = useAuth();
  const { theme, currency, setTheme, setCurrency, toggleTheme, isDark } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast.error(getErrorMessage(error));
      setLoggingOut(false);
    }
  };

  const handleExport = async () => {
    if (!user) return;

    setExporting(true);
    try {
      const scans = await getScans(user.id);

      // Convert to CSV
      const headers = ['Type', 'Date', 'Name/Merchant', 'Company', 'Phone', 'Email', 'Total', 'Currency'];
      const rows = scans.map(s => {
        const json = s.structured_json || {};
        return [
          s.type,
          new Date(s.created_at).toISOString().split('T')[0],
          json.name || json.merchant || '',
          json.company || '',
          json.phone || '',
          json.email || '',
          json.total || '',
          json.currency || 'INR'
        ].join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `bizpocket-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Header title="Settings" />
      <PageWrapper className="pt-4">
        {/* Profile */}
        <Card className="mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[var(--color-text)]">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {user?.email}
              </p>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3 mt-6">
          Preferences
        </h3>

        <Card className="divide-y divide-[var(--color-border)]">
          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
              <span className="text-[var(--color-text)]">Theme</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <span className="text-sm">{isDark ? 'Dark' : 'Light'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Currency */}
          <div className="py-3">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-[var(--color-text)]">Currency</span>
            </div>
            <Select
              options={CURRENCIES}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
        </Card>

        {/* Data */}
        <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3 mt-6">
          Data
        </h3>

        <Card className="divide-y divide-[var(--color-border)]">
          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text)]">Export Data (CSV)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
          </button>
        </Card>

        {/* Security */}
        <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3 mt-6">
          Security
        </h3>

        <Card>
          <button
            onClick={() => navigate('/password-vault')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <p className="text-[var(--color-text)] font-medium">Password Vault</p>
                <p className="text-xs text-[var(--color-text-muted)]">Manage saved passwords</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
          </button>
        </Card>

        {/* Account */}
        <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3 mt-6">
          Account
        </h3>

        <Card>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </Card>

        {/* App Info */}
        <div className="text-center mt-8 text-xs text-[var(--color-text-dim)]">
          <p>BizPocket v1.0.0</p>
          <p className="mt-1">Made by Developers @ S2_Integrators</p>
        </div>

        {/* Logout Modal */}
        <Modal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          title="Log Out?"
        >
          <p className="text-[var(--color-text-muted)]">
            Are you sure you want to log out of your account?
          </p>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout} loading={loggingOut} className="flex-1">
              Log Out
            </Button>
          </ModalActions>
        </Modal>
      </PageWrapper>
    </>
  );
}
