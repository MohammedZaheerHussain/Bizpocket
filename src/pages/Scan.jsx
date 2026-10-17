import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, CreditCard, Receipt, FileText, X, Check, RotateCcw, Sparkles, Eye, Cpu, Shield, Linkedin } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { uploadImage, insertScan, saveExtractionFeedback } from '../lib/supabase';
import { compressImage, createPreviewUrl, revokePreviewUrl } from '../lib/ocr';
import { smartExtract } from '../lib/ai';
import { cn, getErrorMessage } from '../lib/utils';

const SCAN_TYPES = [
  { id: 'business_card', label: 'Business Card', icon: CreditCard, color: 'purple' },
  { id: 'receipt', label: 'Receipt', icon: Receipt, color: 'green' },
  { id: 'invoice', label: 'Invoice', icon: FileText, color: 'amber' },
  { id: 'linkedin_qr', label: 'LinkedIn QR', icon: Linkedin, color: 'blue' }
];

export default function Scan() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // State machine: select | capture | processing | review
  const [step, setStep] = useState('select');
  const [scanType, setScanType] = useState('business_card');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [originalExtractedData, setOriginalExtractedData] = useState(null); // For feedback tracking
  const [rawText, setRawText] = useState('');
  const [editedData, setEditedData] = useState({});
  const [extractionMethod, setExtractionMethod] = useState(null); // 'edge-vision', 'vision', or 'ocr+ai'

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    try {
      // Compress image
      const compressed = await compressImage(selectedFile);
      setFile(compressed);

      // Create preview
      const url = createPreviewUrl(compressed);
      setPreviewUrl(url);

      setStep('capture');
    } catch (error) {
      toast.error('Failed to process image');
      console.error(error);
    }
  }, [toast]);

  // Handle camera capture
  const handleCamera = () => {
    cameraInputRef.current?.click();
  };

  // Handle gallery upload
  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  // Process the image using Vision API with OCR fallback
  const handleProcess = async () => {
    if (!file || !user) return;

    setProcessing(true);
    setStep('processing');

    try {
      // Step 1: Upload image to storage
      setProcessingStep('Uploading image...');
      const imageUrl = await uploadImage(file, user.id);

      // Step 2: Smart extraction - Vision API first, OCR fallback
      const result = await smartExtract(file, scanType, (status) => {
        setProcessingStep(status);
      });

      if (!result.success) {
        throw new Error('Could not extract data from image. Please try a clearer photo.');
      }

      // Track extraction method
      setExtractionMethod(result.method);
      setRawText(result.rawText || '');

      // For LinkedIn QR, ALWAYS try to decode the actual QR code (regardless of what Vision AI extracted)
      let linkedinUrl = result.data.linkedin_url || '';
      if (scanType === 'linkedin_qr') {
        try {
          setProcessingStep('Decoding QR code...');
          const { decodeQRFromImage } = await import('../lib/qrcode.js');
          const qrResult = await decodeQRFromImage(file);
          if (qrResult.success) {
            // Check if it's a LinkedIn URL
            if (qrResult.data && qrResult.data.includes('linkedin.com')) {
              linkedinUrl = qrResult.data;
              console.log('LinkedIn URL decoded from QR:', linkedinUrl);
            }
          }
        } catch (qrError) {
          console.warn('QR decode failed:', qrError);
        }
      }

      // Clean up nulls for display
      const cleanedData = Object.fromEntries(
        Object.entries(result.data).filter(([, v]) => v !== null && v !== undefined && v !== '')
      );

      // IMPORTANT: Always add LinkedIn URL if we decoded it from QR
      if (linkedinUrl && linkedinUrl.includes('linkedin.com')) {
        cleanedData.linkedin_url = linkedinUrl;
        console.log('LinkedIn URL added to data:', linkedinUrl);
      }

      // If user selected LinkedIn QR but no URL was found, warn them
      if (scanType === 'linkedin_qr' && !cleanedData.linkedin_url) {
        console.warn('LinkedIn QR selected but no LinkedIn URL found in QR code');
      }

      setExtractedData({ ...cleanedData, image_url: imageUrl });
      setOriginalExtractedData(cleanedData); // Save original for feedback comparison
      setEditedData(cleanedData);
      setScanType(scanType); // Use the user-selected type, not auto-detected
      setStep('review');

    } catch (error) {
      toast.error(getErrorMessage(error));
      setStep('capture');
    } finally {
      setProcessing(false);
      setProcessingStep('');
    }
  };

  // Save the scan
  const handleSave = async () => {
    if (!user || !extractedData) return;

    setProcessing(true);
    try {
      const scanData = {
        user_id: user.id,
        type: scanType,
        raw_text: rawText,
        structured_json: editedData,
        image_url: extractedData.image_url
      };

      const savedScan = await insertScan(scanData);

      // Check if user made any corrections (for feedback learning)
      if (originalExtractedData) {
        const changedFields = Object.keys(editedData).filter(key => {
          const original = originalExtractedData[key];
          const edited = editedData[key];
          return JSON.stringify(original) !== JSON.stringify(edited);
        });

        // Save feedback if corrections were made
        if (changedFields.length > 0) {
          await saveExtractionFeedback({
            scanId: savedScan.id,
            userId: user.id,
            originalExtraction: originalExtractedData,
            userCorrection: editedData,
            fieldCorrections: changedFields,
            extractionMethod: extractionMethod,
            scanType: scanType
          });
          console.log('Feedback saved for fields:', changedFields);
        }
      }

      toast.success('Scan saved successfully!');

      // Cleanup
      if (previewUrl) revokePreviewUrl(previewUrl);

      navigate('/history');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  };

  // Reset and start over
  const handleReset = () => {
    if (previewUrl) revokePreviewUrl(previewUrl);
    setFile(null);
    setPreviewUrl('');
    setExtractedData(null);
    setRawText('');
    setEditedData({});
    setExtractionMethod(null);
    setStep('select');
  };

  // Update edited data
  const updateField = (key, value) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
  };

  // Render based on step
  return (
    <>
      <Header
        title="Scan"
        showBack={step !== 'select'}
        action={step !== 'select' && step !== 'processing' && (
          <button onClick={handleReset} className="p-2 text-[var(--color-text-muted)]">
            <X className="w-5 h-5" />
          </button>
        )}
      />
      <PageWrapper className="pt-4">
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />

        {/* Step 1: Select Type */}
        {step === 'select' && (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              What are you scanning?
            </h2>

            <div className="space-y-3 mb-8">
              {SCAN_TYPES.map(({ id, label, icon: Icon, color }) => (
                <Card
                  key={id}
                  hover
                  onClick={() => setScanType(id)}
                  className={cn(
                    'flex items-center gap-4 transition-all cursor-pointer',
                    scanType === id && `ring-2 ring-${color}-500/50`
                  )}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    color === 'purple' && 'bg-purple-500/10',
                    color === 'green' && 'bg-emerald-500/10',
                    color === 'amber' && 'bg-amber-500/10',
                    color === 'blue' && 'bg-blue-500/10'
                  )}>
                    <Icon className={cn(
                      'w-6 h-6',
                      color === 'purple' && 'text-purple-400',
                      color === 'green' && 'text-emerald-400',
                      color === 'amber' && 'text-amber-400',
                      color === 'blue' && 'text-blue-400'
                    )} />
                  </div>
                  <span className="font-medium text-[var(--color-text)]">{label}</span>
                  {scanType === id && (
                    <Check className="w-5 h-5 text-purple-400 ml-auto" />
                  )}
                </Card>
              ))}
            </div>

            <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">
              Capture Method
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={handleCamera} className="h-24 flex-col gap-2">
                <Camera className="w-6 h-6" />
                <span>Camera</span>
              </Button>
              <Button variant="secondary" onClick={handleUpload} className="h-24 flex-col gap-2">
                <Upload className="w-6 h-6" />
                <span>Gallery</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Preview Capture */}
        {step === 'capture' && (
          <div className="animate-fadeIn">
            <div className="relative rounded-2xl overflow-hidden mb-6">
              <img
                src={previewUrl}
                alt="Captured"
                className="w-full aspect-[3/4] object-cover"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleReset}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4" />
                Retake
              </Button>
              <Button
                onClick={handleProcess}
                loading={processing}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4" />
                Process
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="animate-fadeIn flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <Spinner size="xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">{processingStep}</p>
          </div>
        )}

        {/* Step 4: Review & Edit */}
        {step === 'review' && (
          <div className="animate-fadeIn">
            {/* Preview thumbnail */}
            {extractedData?.image_url && (
              <div className="flex gap-4 mb-4">
                <img
                  src={extractedData.image_url}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--color-text)]">
                    Review Extracted Data
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Edit any fields that need correction
                  </p>
                </div>
              </div>
            )}

            {/* Extraction method indicator */}
            <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-[var(--color-surface-2)]">
              {extractionMethod === 'edge-vision' ? (
                <>
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Extracted using <span className="text-emerald-400 font-medium">Secure AI</span> (Edge Function)
                  </span>
                </>
              ) : extractionMethod === 'vision' ? (
                <>
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Extracted using <span className="text-purple-400 font-medium">AI Vision</span> (client-side)
                  </span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Extracted using <span className="text-amber-400 font-medium">OCR + AI</span> (fallback)
                  </span>
                </>
              )}
            </div>

            {/* Business Card Fields */}
            {scanType === 'business_card' && (
              <div className="space-y-4 mb-6">
                <Input
                  label="Name"
                  value={editedData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Full name"
                />
                <Input
                  label="Company"
                  value={editedData.company || ''}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Company name"
                />
                <Input
                  label="Title"
                  value={editedData.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Job title"
                />
                <Input
                  label="Phone"
                  value={editedData.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
                <Input
                  label="Email"
                  value={editedData.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                />
                <Input
                  label="Website"
                  value={editedData.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="www.example.com"
                />
                <Textarea
                  label="Address"
                  value={editedData.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Full address"
                />
              </div>
            )}

            {/* Receipt/Invoice Fields */}
            {(scanType === 'receipt' || scanType === 'invoice') && (
              <div className="space-y-4 mb-6">
                <Input
                  label="Merchant / Vendor"
                  value={editedData.merchant || ''}
                  onChange={(e) => updateField('merchant', e.target.value)}
                  placeholder="Store or vendor name"
                />
                <Input
                  label="Date"
                  type="date"
                  value={editedData.date || ''}
                  onChange={(e) => updateField('date', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Total Amount"
                    type="number"
                    value={editedData.total || ''}
                    onChange={(e) => updateField('total', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <Input
                    label="Tax"
                    type="number"
                    value={editedData.tax || ''}
                    onChange={(e) => updateField('tax', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <Input
                  label="Currency"
                  value={editedData.currency || 'INR'}
                  onChange={(e) => updateField('currency', e.target.value)}
                  placeholder="INR"
                />
                <Textarea
                  label="Items (Optional)"
                  value={typeof editedData.items === 'string'
                    ? editedData.items
                    : JSON.stringify(editedData.items || [], null, 2)}
                  onChange={(e) => updateField('items', e.target.value)}
                  placeholder="Item list"
                />
              </div>
            )}

            {/* LinkedIn QR Fields */}
            {scanType === 'linkedin_qr' && (
              <div className="space-y-4 mb-6">
                <Input
                  label="Name"
                  value={editedData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Full name"
                />
                <Input
                  label="Headline"
                  value={editedData.headline || ''}
                  onChange={(e) => updateField('headline', e.target.value)}
                  placeholder="Professional title/headline"
                />
                <Input
                  label="Company"
                  value={editedData.company || ''}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Company name"
                />
                <Input
                  label="Certifications"
                  value={editedData.certifications || ''}
                  onChange={(e) => updateField('certifications', e.target.value)}
                  placeholder="Certifications mentioned"
                />
                <div>
                  <Input
                    label="LinkedIn URL"
                    value={editedData.linkedin_url || ''}
                    onChange={(e) => updateField('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                  />
                  {editedData.linkedin_url && (
                    <a
                      href={editedData.linkedin_url.startsWith('http') ? editedData.linkedin_url : `https://${editedData.linkedin_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/20 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      Open LinkedIn Profile
                    </a>
                  )}
                  {!editedData.linkedin_url && (
                    <p className="text-xs text-amber-400 mt-2">
                      ⚠️ No LinkedIn URL found in QR code. Please enter manually if needed.
                    </p>
                  )}
                </div>
                <Textarea
                  label="Notes"
                  value={editedData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Any additional notes"
                />
              </div>
            )}

            {/* Raw text accordion - only show when using OCR fallback */}
            {rawText && extractionMethod === 'ocr+ai' && (
              <details className="mb-6">
                <summary className="text-sm text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text)]">
                  View raw OCR text
                </summary>
                <pre className="mt-2 p-3 bg-[var(--color-surface)] rounded-xl text-xs text-[var(--color-text-dim)] whitespace-pre-wrap overflow-x-auto">
                  {rawText}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleReset}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                loading={processing}
                className="flex-1"
              >
                <Check className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>
        )}
      </PageWrapper>
    </>
  );
}
