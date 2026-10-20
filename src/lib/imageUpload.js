// Shared client-side image validation + compression.
// Client checks are UX only; the storage bucket (5MB, image mime types, login required) is the real gate.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

// Returns an error key ('uploadInvalidType' | 'uploadTooLarge') or null when valid.
export function validateImageFile(file) {
    if (!file) return 'uploadInvalidType';
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'uploadInvalidType';
    if (file.size > MAX_IMAGE_BYTES) return 'uploadTooLarge';
    return null;
}

export function sanitizeFileName(name) {
    const base = String(name || 'image').split(/[\\/]/).pop() || 'image';
    return base.replace(/[^\w.-]+/g, '_').slice(0, 80) || 'image';
}

// Downscales to at most 1080px on the longest side and re-encodes as JPEG.
export function compressImageFile(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const MAX = 1080;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
                if (width > height) {
                    height = Math.round((height * MAX) / width);
                    width = MAX;
                } else {
                    width = Math.round((width * MAX) / height);
                    height = MAX;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
            canvas.toBlob((blob) => {
                if (!blob) { reject(new Error('Image compression failed')); return; }
                const safeName = sanitizeFileName(file.name).replace(/\.\w+$/, '') + '.jpg';
                resolve(new File([blob], safeName, { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.9);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
        img.src = url;
    });
}

// Validates, compresses and returns a File ready for backend UploadFile.
export async function prepareImageForUpload(file, t) {
    const errorKey = validateImageFile(file);
    if (errorKey) throw new Error(t(errorKey));
    return compressImageFile(file);
}
