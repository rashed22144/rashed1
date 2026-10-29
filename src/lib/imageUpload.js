// Shared client-side image validation (early UX errors only).
// Compression + upload live in backend.integrations.Core.UploadFile
// (src/api/backendClient.js) so every upload goes through one place.
// The storage bucket (5MB, image mime types, login required) is the real gate.
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
