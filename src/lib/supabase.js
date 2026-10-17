import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const STORAGE_BUCKET = 'scans';

// Upload image to Supabase Storage
export async function uploadImage(file, userId) {
    if (!supabase) throw new Error('Supabase not configured');

    const ext = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
            cacheControl: '3600',
            contentType: file.type || 'image/jpeg',
            upsert: false
        });

    if (error) throw error;

    const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

    return urlData.publicUrl;
}

// Auth helpers
export async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
}

export async function signUp(email, password) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
        }
    });
    if (error) throw error;
    return data;
}

export async function resendVerificationEmail(email) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
        }
    });
    if (error) throw error;
}

export async function signOut() {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
}

// Database helpers
export async function insertScan(scanData) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
        .from('scans')
        .insert(scanData)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function getScans(userId, type = null) {
    if (!supabase) throw new Error('Supabase not configured');
    let query = supabase
        .from('scans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function getScan(id) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

export async function updateScan(id, updates) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
        .from('scans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteScan(id) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase
        .from('scans')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// Profile helpers
export async function getProfile(userId) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

export async function updateProfile(userId, updates) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ============================================
// Edge Function: Secure Vision API Extraction
// ============================================

// Call Edge Function for secure extraction
export async function extractWithEdgeFunction(imageBase64, mimeType = 'image/jpeg', scanType = 'invoice') {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase.functions.invoke('extract-invoice', {
        body: {
            imageBase64,
            mimeType,
            scanType
        }
    });

    if (error) throw error;
    return data;
}

// ============================================
// Extraction Feedback (Learning)
// ============================================

// Save user corrections for learning
export async function saveExtractionFeedback({
    scanId,
    userId,
    originalExtraction,
    userCorrection,
    fieldCorrections = [],
    extractionMethod = 'vision',
    scanType = 'invoice',
    vendorMatched = null
}) {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
        .from('extraction_feedback')
        .insert({
            scan_id: scanId,
            user_id: userId,
            original_extraction: originalExtraction,
            user_correction: userCorrection,
            field_corrections: fieldCorrections,
            extraction_method: extractionMethod,
            scan_type: scanType,
            vendor_matched: vendorMatched
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to save feedback:', error);
        // Don't throw - feedback is not critical
        return null;
    }
    return data;
}

// ============================================
// Invoice Templates
// ============================================

// Get vendor template by matching patterns
export async function getVendorTemplate(text) {
    if (!supabase) return null;

    // Get all templates
    const { data: templates, error } = await supabase
        .from('invoice_templates')
        .select('*');

    if (error || !templates?.length) return null;

    const lowerText = text.toLowerCase();

    // Find matching template
    for (const template of templates) {
        const patterns = template.vendor_patterns || [];
        const matches = patterns.filter(p => lowerText.includes(p.toLowerCase()));

        // Match if at least 2 patterns found or GSTIN matches
        if (matches.length >= 2 || (template.gstin && lowerText.includes(template.gstin.toLowerCase()))) {
            // Increment usage count
            await supabase
                .from('invoice_templates')
                .update({ usage_count: (template.usage_count || 0) + 1 })
                .eq('id', template.id);

            return template;
        }
    }

    return null;
}

// ============================================
// Password Reset
// ============================================

// Send password reset email
export async function sendPasswordResetEmail(email) {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) throw error;
}

// Update user password (after reset)
export async function updatePassword(newPassword) {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) throw error;
}

// ============================================
// Password Vault
// ============================================

// Get all password vault entries for a user
export async function getPasswordVaultEntries(userId) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
        .from('password_vault')
        .select('*')
        .eq('user_id', userId)
        .order('last_used_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

// Get a single password vault entry
export async function getPasswordVaultEntry(id) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
        .from('password_vault')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

// Insert a new password vault entry
export async function insertPasswordVaultEntry(entryData) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
        .from('password_vault')
        .insert(entryData)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Update a password vault entry
export async function updatePasswordVaultEntry(id, updates) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
        .from('password_vault')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Delete a password vault entry
export async function deletePasswordVaultEntry(id) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase
        .from('password_vault')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// Update last used timestamp
export async function updatePasswordVaultLastUsed(id) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase
        .from('password_vault')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw error;
}

