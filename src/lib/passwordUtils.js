// Password Utility Functions for Password Vault

/**
 * Generate a strong random password
 * @param {number} length - Password length (8-32)
 * @param {object} options - Options for password generation
 * @returns {string} Generated password
 */
export function generateStrongPassword(length = 16, options = {}) {
    const {
        uppercase = true,
        lowercase = true,
        numbers = true,
        symbols = true
    } = options;

    let charset = '';
    let password = '';

    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // Build charset based on options
    if (uppercase) charset += uppercaseChars;
    if (lowercase) charset += lowercaseChars;
    if (numbers) charset += numberChars;
    if (symbols) charset += symbolChars;

    // Ensure at least one character type is selected
    if (charset.length === 0) {
        charset = lowercaseChars + numberChars; // Default to lowercase + numbers
    }

    // Generate password ensuring at least one of each selected type
    const ensureChars = [];
    if (uppercase) ensureChars.push(uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]);
    if (lowercase) ensureChars.push(lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]);
    if (numbers) ensureChars.push(numberChars[Math.floor(Math.random() * numberChars.length)]);
    if (symbols) ensureChars.push(symbolChars[Math.floor(Math.random() * symbolChars.length)]);

    // Fill remaining length with random characters
    const remainingLength = length - ensureChars.length;
    for (let i = 0; i < remainingLength; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Add ensured characters and shuffle
    password = (password + ensureChars.join(''))
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');

    return password;
}

/**
 * Calculate password strength score (0-100)
 * @param {string} password - Password to evaluate
 * @returns {object} { score, label, feedback }
 */
export function calculatePasswordStrength(password) {
    if (!password) {
        return { score: 0, label: 'None', feedback: 'Enter a password' };
    }

    let score = 0;
    const feedback = [];

    // Length scoring (0-40 points)
    const length = password.length;
    if (length >= 12) {
        score += 40;
    } else if (length >= 8) {
        score += 20;
        feedback.push('Use 12+ characters for better security');
    } else {
        score += 10;
        feedback.push('Password is too short (minimum 8 characters)');
    }

    // Character variety (0-30 points)
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password);

    const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSymbols].filter(Boolean).length;
    score += varietyCount * 7.5;

    if (!hasLowercase) feedback.push('Add lowercase letters');
    if (!hasUppercase) feedback.push('Add uppercase letters');
    if (!hasNumbers) feedback.push('Add numbers');
    if (!hasSymbols) feedback.push('Add symbols (!@#$%...)');

    // Uniqueness (0-20 points)
    const uniqueChars = new Set(password).size;
    const uniquenessRatio = uniqueChars / length;
    if (uniquenessRatio >= 0.7) {
        score += 20;
    } else if (uniquenessRatio >= 0.5) {
        score += 10;
    } else {
        feedback.push('Avoid repeating characters');
    }

    // Pattern detection (penalties)
    const commonPatterns = [
        /^123456/,
        /password/i,
        /qwerty/i,
        /abc123/i,
        /(.)\1{2,}/, // Repeated characters
    ];

    for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
            score -= 10;
            feedback.push('Avoid common patterns');
            break;
        }
    }

    // Sequential characters penalty
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
        score -= 5;
        if (!feedback.includes('Avoid common patterns')) {
            feedback.push('Avoid sequential characters');
        }
    }

    // Normalize score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine label
    let label = 'Weak';
    if (score >= 80) label = 'Strong';
    else if (score >= 60) label = 'Good';
    else if (score >= 40) label = 'Fair';

    return {
        score,
        label,
        feedback: feedback.slice(0, 3) // Limit to 3 feedback items
    };
}

/**
 * Simple XOR-based encryption for passwords
 * Note: For production, consider using Web Crypto API with a proper key derivation
 * @param {string} text - Text to encrypt
 * @param {string} key - Encryption key
 * @returns {string} Base64 encoded encrypted text
 */
export function encryptPassword(text, key) {
    if (!text || !key) return '';

    // Create a consistent key hash
    const keyHash = Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // XOR encryption
    const encrypted = Array.from(text)
        .map((char, i) => {
            const keyChar = key.charCodeAt(i % key.length);
            return String.fromCharCode(char.charCodeAt(0) ^ keyChar ^ (keyHash % 256));
        })
        .join('');

    // Convert to base64
    return btoa(encrypted);
}

/**
 * Decrypt password encrypted with encryptPassword
 * @param {string} encrypted - Base64 encoded encrypted text
 * @param {string} key - Decryption key
 * @returns {string} Decrypted text
 */
export function decryptPassword(encrypted, key) {
    if (!encrypted || !key) return '';

    try {
        // Decode from base64
        const decoded = atob(encrypted);

        // Create a consistent key hash
        const keyHash = Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // XOR decryption (same as encryption)
        const decrypted = Array.from(decoded)
            .map((char, i) => {
                const keyChar = key.charCodeAt(i % key.length);
                return String.fromCharCode(char.charCodeAt(0) ^ keyChar ^ (keyHash % 256));
            })
            .join('');

        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        return '';
    }
}

/**
 * Validate if password meets minimum criteria
 * @param {string} password - Password to validate
 * @returns {object} { isValid, errors }
 */
export function validatePasswordCriteria(password) {
    const errors = [];

    if (!password) {
        return { isValid: false, errors: ['Password is required'] };
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain lowercase letters');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain uppercase letters');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain numbers');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}
