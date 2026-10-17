// This file runs on Supabase Edge Functions (Deno runtime)
// TypeScript errors about 'Deno' are expected in local IDE - they work when deployed

// Declare Deno types for local IDE
declare const Deno: {
    serve: (handler: (req: Request) => Promise<Response>) => void;
    env: {
        get: (key: string) => string | undefined;
    };
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Get prompts based on scan type
function getPrompt(scanType: string): string {
    const prompts: Record<string, string> = {
        invoice: `You are an expert at extracting information from business invoices. Analyze this image carefully.

Return ONLY a valid JSON object:
{
  "merchant": "Seller/vendor company name",
  "buyer": "Buyer/customer name if visible",
  "invoice_number": "Invoice/Bill number",
  "date": "Invoice date (YYYY-MM-DD)",
  "due_date": "Due date (YYYY-MM-DD) if visible",
  "total": 0.00,
  "subtotal": 0.00,
  "tax": 0.00,
  "cgst": 0.00,
  "sgst": 0.00,
  "items": [{"name": "Item name", "hsn": "HSN code", "price": 0.00, "quantity": 1, "amount": 0.00}],
  "currency": "INR",
  "gstin": "GSTIN number if visible"
}

CRITICAL RULES:
- All amounts MUST be numbers, NOT strings
- Parse Indian number format: 1,58,028.40 = 158028.40
- Extract CGST and SGST separately
- Include HSN codes for items
- Default currency to INR`,

        receipt: `You are an expert at extracting receipt information. Analyze this image.

Return ONLY a valid JSON object:
{
  "merchant": "Store/vendor name",
  "date": "Date (YYYY-MM-DD)",
  "total": 0.00,
  "subtotal": 0.00,
  "tax": 0.00,
  "items": [{"name": "Item", "price": 0.00, "quantity": 1}],
  "payment_method": "Cash/Card/UPI",
  "currency": "INR"
}

All amounts must be numbers.`,

        business_card: `You are an expert at extracting business card information.

Return ONLY a valid JSON object:
{
  "name": "Full name",
  "company": "Company name",
  "title": "Job title",
  "phone": "Phone numbers",
  "email": "Email address",
  "website": "Website URL",
  "address": "Physical address"
}

Use null for missing fields.`,

        linkedin_qr: `You are an expert at extracting information from LinkedIn QR code cards. Analyze this image carefully.

Return ONLY a valid JSON object:
{
  "name": "Full name of the person",
  "headline": "Their professional headline/title",
  "company": "Company name if visible in headline",
  "certifications": "Any certifications mentioned",
  "linkedin_url": "LinkedIn profile URL if visible",
  "notes": "Any other relevant details visible"
}

Extract the name and headline exactly as shown on the card.`,

        other: `Extract structured information from this document. Return as JSON.`,
    };

    return prompts[scanType] || prompts.other;
}

// Deno serve handler
Deno.serve(async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        // Get API key from environment (stored as secret)
        const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
        if (!GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY not configured");
        }

        // Parse request body
        const { imageBase64, mimeType = "image/jpeg", scanType = "invoice" } = await req.json();

        if (!imageBase64) {
            throw new Error("imageBase64 is required");
        }

        const prompt = getPrompt(scanType);

        // Call Groq Vision API
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt + "\n\nAnalyze this image and return ONLY the JSON object.",
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`,
                                },
                            },
                        ],
                    },
                ],
                temperature: 0.1,
                max_tokens: 2048,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Groq API error:", errorData);
            throw new Error(errorData.error?.message || "Vision API failed");
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Could not parse AI response");
        }

        const extracted = JSON.parse(jsonMatch[0]);

        return new Response(
            JSON.stringify({
                success: true,
                data: extracted,
                method: "edge-vision",
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Edge function error:", errorMessage);

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
});
