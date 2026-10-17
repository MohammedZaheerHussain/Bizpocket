import { Html5Qrcode } from 'html5-qrcode';

// Helper function to preprocess image for better QR detection
async function preprocessImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas for image processing
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Set canvas size to image size
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw image
                ctx.drawImage(img, 0, 0);

                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Increase contrast for better QR detection
                const factor = 1.5;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * factor);     // Red
                    data[i + 1] = Math.min(255, data[i + 1] * factor); // Green
                    data[i + 2] = Math.min(255, data[i + 2] * factor); // Blue
                }

                ctx.putImageData(imageData, 0, 0);

                // Convert canvas back to blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, { type: file.type }));
                    } else {
                        resolve(file); // Return original if processing fails
                    }
                }, file.type || 'image/jpeg');
            };
            img.onerror = () => resolve(file); // Return original on error
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(file); // Return original on error
        reader.readAsDataURL(file);
    });
}

// Decode QR code from image file with multiple attempts
export async function decodeQRFromImage(imageFile) {
    let tempDiv = null;
    let html5QrCode = null;

    try {
        // Create a unique ID for this scan with random component to avoid conflicts
        const readerId = `qr-reader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Remove any existing QR reader divs to prevent conflicts
        const existingDivs = document.querySelectorAll('[id^="qr-reader-"]');
        existingDivs.forEach(div => {
            try {
                if (div.parentNode) {
                    div.parentNode.removeChild(div);
                }
            } catch (e) {
                console.warn('Failed to remove old QR reader div:', e);
            }
        });

        // Create a hidden div for the scanner
        tempDiv = document.createElement('div');
        tempDiv.id = readerId;
        tempDiv.style.display = 'none';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        // Wait a bit for DOM to settle
        await new Promise(resolve => setTimeout(resolve, 150));

        html5QrCode = new Html5Qrcode(readerId);

        // Try 1: Scan original image
        try {
            console.log('Attempt 1: Scanning original image...');
            const result = await html5QrCode.scanFile(imageFile, false);
            console.log('QR decode successful (original):', result);
            return {
                success: true,
                data: result,
                isLinkedIn: result.includes('linkedin.com')
            };
        } catch (error1) {
            console.warn('Attempt 1 failed:', error1.message);

            // Try 2: Scan preprocessed image with enhanced contrast
            try {
                console.log('Attempt 2: Scanning preprocessed image...');
                await html5QrCode.clear();
                await new Promise(resolve => setTimeout(resolve, 100));

                const processedFile = await preprocessImage(imageFile);
                const result = await html5QrCode.scanFile(processedFile, false);
                console.log('QR decode successful (preprocessed):', result);
                return {
                    success: true,
                    data: result,
                    isLinkedIn: result.includes('linkedin.com')
                };
            } catch (error2) {
                console.warn('Attempt 2 failed:', error2.message);
                throw new Error('Could not decode QR code after multiple attempts');
            }
        }
    } catch (error) {
        console.error('QR decode error:', error.message || error);
        return {
            success: false,
            error: error.message || 'QR code not found in image'
        };
    } finally {
        // Always cleanup - very important!
        if (html5QrCode) {
            try {
                await html5QrCode.clear();
                console.log('QR scanner cleared successfully');
            } catch (e) {
                console.warn('QR clear error (ignoring):', e.message);
            }
        }

        if (tempDiv && document.body.contains(tempDiv)) {
            try {
                document.body.removeChild(tempDiv);
                console.log('QR reader div removed successfully');
            } catch (e) {
                console.warn('Failed to remove QR reader div:', e);
            }
        }

        // Extra cleanup - wait a bit before allowing next scan
        await new Promise(resolve => setTimeout(resolve, 150));
    }
}

// Extract LinkedIn username from URL
export function extractLinkedInUsername(url) {
    if (!url) return null;

    // Match patterns like linkedin.com/in/username
    const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
    return match ? match[1] : null;
}

// Validate if string is a LinkedIn URL
export function isLinkedInUrl(str) {
    return str && str.includes('linkedin.com');
}
