// Utility function for combining class names
export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

// Format currency
export function formatMoney(amount, currency = 'INR') {
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(Number(amount || 0));
    } catch {
        return `${currency} ${Number(amount || 0).toFixed(2)}`;
    }
}

// Format relative time
export function timeAgo(date) {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return then.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
    });
}

// Format date
export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Truncate text
export function truncate(str, length = 30) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

// Capitalize first letter
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Get initials from name
export function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase();
}

// Get scan type display name
export function getScanTypeLabel(type) {
    const labels = {
        business_card: 'Business Card',
        receipt: 'Receipt',
        invoice: 'Invoice',
        linkedin_qr: 'LinkedIn QR',
        other: 'Document'
    };
    return labels[type] || 'Document';
}

// Get scan type color
export function getScanTypeColor(type) {
    const colors = {
        business_card: 'purple',
        receipt: 'green',
        invoice: 'amber',
        linkedin_qr: 'blue',
        other: 'slate'
    };
    return colors[type] || 'slate';
}

// Safe error message extraction
export function getErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'Something went wrong';
}

// Debounce function
export function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
