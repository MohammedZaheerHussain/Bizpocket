const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Prompts for different scan types
const PROMPTS = {
    business_card: `You are an expert at extracting information from business cards. Carefully analyze the image/text and extract ALL visible information.

Return ONLY a valid JSON object with these fields:
{
  "name": "Full name of the person",
  "company": "Company/organization name",
  "title": "Job title/position",
  "phone": "All phone numbers separated by comma",
  "email": "Email address",
  "website": "Website URL (without http://)",
  "address": "Complete physical address",
  "social": "Any social media handles"
}

Rules:
- Only include fields that are clearly visible
- Use null for genuinely missing fields
- Fix obvious OCR errors (e.g., "0" vs "O", "1" vs "I")
- For phone numbers, format with country code if visible
- Clean up spacing issues`,

    receipt: `You are an expert at extracting information from receipts and bills. Carefully analyze the image/text and extract ALL transaction details.

Return ONLY a valid JSON object with these fields:
{
  "merchant": "Store/vendor/restaurant name",
  "date": "Date in YYYY-MM-DD format",
  "total": 0.00,
  "subtotal": 0.00,
  "tax": 0.00,
  "items": [{"name": "Item name", "price": 0.00, "quantity": 1}],
  "payment_method": "Cash/Card/UPI/etc",
  "currency": "INR"
}

Rules:
- All amounts must be NUMBERS, not strings
- Parse Indian formats: 1,58,028.40 = 158028.40
- Default currency to INR for Indian receipts
- Include all line items you can identify
- Fix OCR errors in numbers carefully`,

    invoice: `You are an expert at extracting information from business invoices. Carefully analyze the image/text and extract ALL invoice details.

Return ONLY a valid JSON object with these fields:
{
  "merchant": "Seller/vendor company name",
  "buyer": "Buyer/customer name if visible",
  "invoice_number": "Invoice/Bill number",
  "date": "Invoice date in YYYY-MM-DD format",
  "due_date": "Due date in YYYY-MM-DD format if visible",
  "total": 0.00,
  "subtotal": 0.00,
  "tax": 0.00,
  "cgst": 0.00,
  "sgst": 0.00,
  "items": [{"name": "Item/product name", "hsn": "HSN code if visible", "price": 0.00, "quantity": 1, "amount": 0.00}],
  "currency": "INR"
}

Rules:
- All amounts must be NUMBERS
- Parse amounts like ₹1,58,028.40 or Rs.1,58,028.40 correctly
- Extract GST details (CGST, SGST) separately
- Include HSN codes for items if visible
- Extract item quantities and unit prices carefully`,

    linkedin_qr: `You are an expert at extracting information from LinkedIn QR code cards. Analyze this image carefully.

The image shows a LinkedIn profile card with a QR code. Extract ALL visible information.

Return ONLY a valid JSON object:
{
  "name": "Full name of the person",
  "headline": "Their professional headline/title",
  "company": "Company name if visible in headline",
  "certifications": "Any certifications mentioned",
  "linkedin_url": "If you can see/decode any URL, include it",
  "notes": "Any other relevant details visible"
}

IMPORTANT:
- Extract the name exactly as shown
- The headline usually contains their job title and company
- Look for certifications after "Certified in" text
- If company is in headline (like "at Company"), extract it separately
- Use null for fields that are not visible`,

    other: `You are extracting information from a document. Analyze carefully and extract any relevant structured data.

Return a JSON object with appropriate field names for:
- Names, contacts, dates
- Amounts, quantities, prices
- Reference numbers, IDs
- Any other important information

Ensure all numeric values are returned as numbers, not strings.`
};

// Convert image file to base64
async function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Extract using Vision API (PRIMARY METHOD)
export async function extractWithVision(imageFile, scanType = 'other') {
    if (!GROQ_API_KEY) {
        throw new Error('Groq API key not configured');
    }

    const prompt = PROMPTS[scanType] || PROMPTS.other;
    const base64Image = await imageToBase64(imageFile);

    // Determine MIME type
    const mimeType = imageFile.type || 'image/jpeg';

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt + '\n\nAnalyze this image and extract the information. Return ONLY the JSON object.'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.1,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Vision API failed');
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                success: true,
                data: parsed,
                method: 'vision'
            };
        }

        throw new Error('Could not parse Vision API response');
    } catch (error) {
        console.error('Vision API error:', error);
        throw error;
    }
}

// Structure text with AI (FALLBACK METHOD - used with OCR text)
export async function structureWithAI(rawText, scanType = 'other') {
    if (!GROQ_API_KEY) {
        console.warn('Groq API key not configured, returning raw text');
        return { raw_text: rawText };
    }

    const prompt = PROMPTS[scanType] || PROMPTS.other;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: prompt
                    },
                    {
                        role: 'user',
                        content: `Here is the OCR text from a ${scanType.replace('_', ' ')}. Note: This text may have OCR errors - please correct them intelligently.

OCR TEXT:
${rawText}

Extract the information and return ONLY the JSON object.`
                    }
                ],
                temperature: 0.1,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'AI processing failed');
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return { raw_text: rawText };
    } catch (error) {
        console.error('AI structuring error:', error);
        return { raw_text: rawText, error: error.message };
    }
}

// Auto-detect scan type from text
export function detectScanType(text) {
    const lowerText = text.toLowerCase();

    // Invoice indicators (check first as invoices often contain receipt keywords too)
    const invoiceKeywords = ['invoice', 'inv no', 'invoice number', 'tax invoice', 'bill no', 'gstin', 'gst no', 'hsn', 'due date', 'payment terms', 'bill to', 'ship to'];
    const invoiceScore = invoiceKeywords.filter(k => lowerText.includes(k)).length;

    // Receipt indicators
    const receiptKeywords = ['total', 'subtotal', 'receipt', 'change', 'cash', 'paid', 'qty', 'thank you'];
    const receiptScore = receiptKeywords.filter(k => lowerText.includes(k)).length;

    // Business card indicators
    const cardKeywords = ['@', '.com', 'tel:', 'mobile:', 'email:', 'www.', 'manager', 'director', 'ceo', 'founder', 'engineer', 'consultant'];
    const cardScore = cardKeywords.filter(k => lowerText.includes(k)).length;

    // Determine type based on scores
    if (invoiceScore >= 2) return 'invoice';
    if (receiptScore >= 3 && invoiceScore < 2) return 'receipt';
    if (cardScore >= 2) return 'business_card';

    // Fallback heuristics
    if (lowerText.includes('tax invoice') || lowerText.includes('gstin')) return 'invoice';
    if (lowerText.includes('₹') || lowerText.includes('rs.') || lowerText.includes('total')) return 'receipt';
    if (lowerText.includes('@') && lowerText.includes('.')) return 'business_card';

    return 'other';
}

// Combined extraction: Edge Function → Client Vision → OCR fallback
export async function smartExtract(imageFile, scanType = 'other', onProgress) {
    // Convert image to base64 for Edge Function
    const base64Image = await imageToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';

    // ============================================
    // TIER 1: Edge Function (Secure, Recommended)
    // ============================================
    try {
        onProgress?.('Analyzing with secure AI...');

        // Dynamic import to avoid bundling issues
        const { extractWithEdgeFunction } = await import('./supabase.js');
        const result = await extractWithEdgeFunction(base64Image, mimeType, scanType);

        if (result.success) {
            return {
                success: true,
                data: result.data,
                method: 'edge-vision',
                rawText: null
            };
        }
        throw new Error(result.error || 'Edge function failed');
    } catch (edgeError) {
        console.warn('Edge Function failed, trying client-side:', edgeError.message);

        // ============================================
        // TIER 2: Client-side Vision API (Fallback)
        // ============================================
        try {
            onProgress?.('Trying direct AI Vision...');
            const result = await extractWithVision(imageFile, scanType);
            return {
                ...result,
                rawText: null
            };
        } catch (visionError) {
            console.warn('Vision API failed, falling back to OCR:', visionError.message);

            // ============================================
            // TIER 3: OCR + AI Structuring (Last Resort)
            // ============================================
            onProgress?.('Using OCR fallback...');

            const { extractText } = await import('./ocr.js');

            onProgress?.('Extracting text with OCR...');
            const rawText = await extractText(imageFile);

            if (!rawText.trim()) {
                throw new Error('Could not extract text from image');
            }

            const detectedType = detectScanType(rawText);
            const finalType = scanType !== 'other' ? scanType : detectedType;

            onProgress?.('Structuring data with AI...');
            const structured = await structureWithAI(rawText, finalType);

            return {
                success: true,
                data: structured,
                method: 'ocr+ai',
                rawText: rawText,
                detectedType: detectedType
            };
        }
    }
}
