import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Edit, Phone, Mail, Globe, MapPin, Building, User, Calendar, DollarSign, Save, X, Linkedin } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Textarea } from '../components/ui/Input';
import { Modal, ModalActions } from '../components/ui/Modal';
import { FullPageLoader } from '../components/ui/Spinner';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';
import { getScan, updateScan, deleteScan } from '../lib/supabase';
import { formatMoney, formatDate, getScanTypeLabel, getScanTypeColor, getErrorMessage } from '../lib/utils';

export default function ScanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currency } = useTheme();

  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const data = await getScan(id);
        setScan(data);
        setEditedData(data.structured_json || {});
      } catch {
        toast.error('Scan not found');
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchScan();
  }, [id, navigate, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateScan(id, { structured_json: editedData });
      setScan(updated);
      setIsEditing(false);
      toast.success('Changes saved');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteScan(id);
      toast.success('Scan deleted');
      navigate('/history');
    } catch (error) {
      toast.error(getErrorMessage(error));
      setDeleting(false);
    }
  };

  const updateField = (key, value) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <FullPageLoader message="Loading scan..." />;
  if (!scan) return null;

  const json = isEditing ? editedData : (scan.structured_json || {});
  const isCard = scan.type === 'business_card';
  const isReceipt = scan.type === 'receipt' || scan.type === 'invoice';
  const isLinkedIn = scan.type === 'linkedin_qr';

  return (
    <>
      <Header
        title={getScanTypeLabel(scan.type)}
        showBack
        backTo="/history"
        action={
          !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <Edit className="w-5 h-5" />
            </button>
          )
        }
      />
      <PageWrapper className="pt-4">
        {/* Image */}
        {scan.image_url && (
          <Card className="p-0 overflow-hidden mb-4">
            <img
              src={scan.image_url}
              alt="Scan"
              className="w-full max-h-64 object-contain bg-black/20"
            />
          </Card>
        )}

        {/* Type Badge & Date */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant={getScanTypeColor(scan.type)}>
            {getScanTypeLabel(scan.type)}
          </Badge>
          <span className="text-sm text-[var(--color-text-muted)]">
            {formatDate(scan.created_at)}
          </span>
        </div>

        {/* Edit Mode */}
        {isEditing ? (
          <div className="space-y-4">
            {isCard && (
              <>
                <Input label="Name" value={json.name || ''} onChange={(e) => updateField('name', e.target.value)} />
                <Input label="Company" value={json.company || ''} onChange={(e) => updateField('company', e.target.value)} />
                <Input label="Title" value={json.title || ''} onChange={(e) => updateField('title', e.target.value)} />
                <Input label="Phone" value={json.phone || ''} onChange={(e) => updateField('phone', e.target.value)} />
                <Input label="Email" value={json.email || ''} onChange={(e) => updateField('email', e.target.value)} />
                <Input label="Website" value={json.website || ''} onChange={(e) => updateField('website', e.target.value)} />
                <Textarea label="Address" value={json.address || ''} onChange={(e) => updateField('address', e.target.value)} />
              </>
            )}
            {isReceipt && (
              <>
                <Input label="Merchant" value={json.merchant || ''} onChange={(e) => updateField('merchant', e.target.value)} />
                <Input label="Date" type="date" value={json.date || ''} onChange={(e) => updateField('date', e.target.value)} />
                <Input label="Total" type="number" value={json.total || ''} onChange={(e) => updateField('total', parseFloat(e.target.value) || 0)} />
                <Input label="Tax" type="number" value={json.tax || ''} onChange={(e) => updateField('tax', parseFloat(e.target.value) || 0)} />
                <Input label="Currency" value={json.currency || 'INR'} onChange={(e) => updateField('currency', e.target.value)} />
              </>
            )}
            {isLinkedIn && (
              <>
                <Input label="Name" value={json.name || ''} onChange={(e) => updateField('name', e.target.value)} />
                <Input label="Headline" value={json.headline || ''} onChange={(e) => updateField('headline', e.target.value)} />
                <Input label="Company" value={json.company || ''} onChange={(e) => updateField('company', e.target.value)} />
                <Input label="Certifications" value={json.certifications || ''} onChange={(e) => updateField('certifications', e.target.value)} />
                <Input label="LinkedIn URL" value={json.linkedin_url || ''} onChange={(e) => updateField('linkedin_url', e.target.value)} />
                <Textarea label="Notes" value={json.notes || ''} onChange={(e) => updateField('notes', e.target.value)} />
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => { setIsEditing(false); setEditedData(scan.structured_json || {}); }} className="flex-1">
                <X className="w-4 h-4" /> Cancel
              </Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                <Save className="w-4 h-4" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Business Card View */}
            {isCard && (
              <Card className="space-y-4">
                {json.name && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                      <p className="text-lg font-semibold text-[var(--color-text)]">{json.name}</p>
                      {json.title && <p className="text-sm text-[var(--color-text-muted)]">{json.title}</p>}
                    </div>
                  </div>
                )}
                {json.company && (
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-[var(--color-text-dim)]" />
                    <p className="text-[var(--color-text)]">{json.company}</p>
                  </div>
                )}
                {json.phone && (
                  <a href={`tel:${json.phone}`} className="flex items-center gap-3 text-purple-400 hover:text-purple-300">
                    <Phone className="w-5 h-5" />
                    <p>{json.phone}</p>
                  </a>
                )}
                {json.email && (
                  <a href={`mailto:${json.email}`} className="flex items-center gap-3 text-purple-400 hover:text-purple-300">
                    <Mail className="w-5 h-5" />
                    <p>{json.email}</p>
                  </a>
                )}
                {json.website && (
                  <a href={json.website.startsWith('http') ? json.website : `https://${json.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-purple-400 hover:text-purple-300">
                    <Globe className="w-5 h-5" />
                    <p>{json.website}</p>
                  </a>
                )}
                {json.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[var(--color-text-dim)] mt-0.5" />
                    <p className="text-[var(--color-text-muted)]">{json.address}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Receipt View */}
            {isReceipt && (
              <Card className="space-y-4">
                {json.merchant && (
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-text)]">{json.merchant}</p>
                  </div>
                )}
                {json.date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[var(--color-text-dim)]" />
                    <p className="text-[var(--color-text-muted)]">{formatDate(json.date)}</p>
                  </div>
                )}
                <div className="border-t border-[var(--color-border)] pt-4">
                  {json.subtotal && (
                    <div className="flex justify-between mb-2">
                      <span className="text-[var(--color-text-muted)]">Subtotal</span>
                      <span className="text-[var(--color-text)]">{formatMoney(json.subtotal, json.currency || currency)}</span>
                    </div>
                  )}
                  {json.tax > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-[var(--color-text-muted)]">Tax</span>
                      <span className="text-[var(--color-text)]">{formatMoney(json.tax, json.currency || currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-[var(--color-text)]">Total</span>
                    <span className="text-emerald-400">{formatMoney(json.total || 0, json.currency || currency)}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* LinkedIn QR View */}
            {isLinkedIn && (
              <Card className="space-y-4">
                {json.name && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-lg font-semibold text-[var(--color-text)]">{json.name}</p>
                      {json.headline && <p className="text-sm text-[var(--color-text-muted)]">{json.headline}</p>}
                    </div>
                  </div>
                )}
                {json.company && (
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-[var(--color-text-dim)]" />
                    <p className="text-[var(--color-text)]">{json.company}</p>
                  </div>
                )}
                {json.certifications && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center mt-0.5">
                      <span className="text-xs text-blue-400 font-semibold">✓</span>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-dim)] uppercase tracking-wide mb-1">Certifications</p>
                      <p className="text-[var(--color-text)]">{json.certifications}</p>
                    </div>
                  </div>
                )}
                {json.linkedin_url && (
                  <a
                    href={json.linkedin_url.startsWith('http') ? json.linkedin_url : `https://${json.linkedin_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    <Linkedin className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Open LinkedIn Profile</p>
                      <p className="text-xs text-blue-400/70 truncate break-all">{json.linkedin_url}</p>
                    </div>
                  </a>
                )}
                {json.notes && (
                  <div className="flex items-start gap-3 pt-2 border-t border-[var(--color-border)]">
                    <div className="w-5 h-5 mt-0.5">
                      <span className="text-[var(--color-text-dim)]">📝</span>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-dim)] uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-[var(--color-text-muted)]">{json.notes}</p>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Delete Button */}
            <div className="mt-6">
              <Button
                variant="danger"
                fullWidth
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4" />
                Delete Scan
              </Button>
            </div>
          </>
        )}

        {/* Raw Text */}
        {scan.raw_text && !isEditing && (
          <details className="mt-6">
            <summary className="text-sm text-[var(--color-text-muted)] cursor-pointer">
              View raw OCR text
            </summary>
            <pre className="mt-2 p-3 bg-[var(--color-surface)] rounded-xl text-xs text-[var(--color-text-dim)] whitespace-pre-wrap">
              {scan.raw_text}
            </pre>
          </details>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Scan?"
        >
          <p className="text-[var(--color-text-muted)]">
            This action cannot be undone. The scan and its data will be permanently deleted.
          </p>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">
              Delete
            </Button>
          </ModalActions>
        </Modal>
      </PageWrapper>
    </>
  );
}
