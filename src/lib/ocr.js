import Tesseract from 'tesseract.js';

let worker = null;

// Initialize Tesseract worker with optimized settings
async function getWorker() {
    if (!worker) {
        worker = await Tesseract.createWorker('eng', 1, {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            }
        });

        // Set optimized parameters for better accuracy
        await worker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Auto page segmentation
            preserve_interword_spaces: '1',
            tessedit_char_whitelist: '', // Allow all characters
        });
    }
    return worker;
}

// Preprocess image for better OCR accuracy
function preprocessImage(imageSource) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Use original dimensions but cap at reasonable size
            const maxDim = 2000;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
                const scale = maxDim / Math.max(width, height);
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }

            canvas.width = width;
            canvas.height = height;

            // Draw original image
            ctx.drawImage(img, 0, 0, width, height);

            // Get image data for processing
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // Apply preprocessing for better OCR
            for (let i = 0; i < data.length; i += 4) {
                // Convert to grayscale
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

                // Increase contrast
                let newValue = ((gray - 128) * 1.5) + 128;
                newValue = Math.max(0, Math.min(255, newValue));

                // Apply slight sharpening via contrast enhancement
                data[i] = newValue;
                data[i + 1] = newValue;
                data[i + 2] = newValue;
            }

            ctx.putImageData(imageData, 0, 0);

            // Return as blob URL for Tesseract
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(URL.createObjectURL(blob));
                } else {
                    resolve(imageSource); // Fallback to original
                }
            }, 'image/png');
        };

        img.onerror = () => {
            console.warn('Image preprocessing failed, using original');
            resolve(imageSource);
        };

        // Handle different input types
        if (typeof imageSource === 'string') {
            img.src = imageSource;
        } else if (imageSource instanceof File || imageSource instanceof Blob) {
            img.src = URL.createObjectURL(imageSource);
        } else {
            resolve(imageSource);
        }
    });
}

// Extract text from image with preprocessing
export async function extractText(imageSource) {
    const w = await getWorker();

    // Preprocess image for better accuracy
    let processedImage;
    try {
        processedImage = await preprocessImage(imageSource);
    } catch (e) {
        console.warn('Preprocessing failed:', e);
        processedImage = imageSource;
    }

    const result = await w.recognize(processedImage, {
        rotateAuto: true
    }, {
        text: true,
        blocks: true,
        hocr: false,
        tsv: false
    });

    // Clean up preprocessed image URL if created
    if (typeof processedImage === 'string' && processedImage.startsWith('blob:')) {
        URL.revokeObjectURL(processedImage);
    }

    // Post-process OCR text
    let text = result.data.text.trim();

    // Fix common OCR errors
    text = fixCommonOCRErrors(text);

    return text;
}

// Fix common OCR mistakes
function fixCommonOCRErrors(text) {
    return text
        // Fix common character substitutions
        .replace(/[|](?=\d)/g, '1')  // | before digit -> 1
        .replace(/(?<=\d)[|]/g, '1') // | after digit -> 1
        .replace(/[oO](?=\d{2,})/g, '0') // O before numbers -> 0
        .replace(/(?<=\d{2,})[oO]/g, '0') // O in numbers -> 0
        // Fix spacing issues
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        // Clean up artifacts
        .replace(/[^\S\n]+/g, ' ')
        .trim();
}

// Compress image before upload
export function compressImage(file, maxWidth = 1500, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if necessary
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name || 'scan.jpg', { type: 'image/jpeg' }));
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Create object URL for preview
export function createPreviewUrl(file) {
    return URL.createObjectURL(file);
}

// Revoke object URL
export function revokePreviewUrl(url) {
    URL.revokeObjectURL(url);
}

// Terminate worker when done
export async function terminateOCR() {
    if (worker) {
        await worker.terminate();
        worker = null;
    }
}
