const mockRemove = jest.fn();
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn(() => ({ data: { publicUrl: 'https://proj.supabase.co/storage/v1/object/public/uploads/new.webp' } }));

jest.mock('../lib/supabaseClient', () => ({
    supabase: {
        storage: {
            from: jest.fn(() => ({ remove: mockRemove, upload: mockUpload, getPublicUrl: mockGetPublicUrl })),
        },
        from: jest.fn(),
        auth: { getUser: jest.fn() },
        rpc: jest.fn(),
    },
}));

// eslint-disable-next-line import/first
import { backend, parseUploadObjectName, removeUploadedFile } from './backendClient';
// eslint-disable-next-line import/first
import { supabase } from '../lib/supabaseClient';

const UPLOADS = 'https://proj.supabase.co/storage/v1/object/public/uploads/';

describe('parseUploadObjectName', () => {
    test('extracts the object name from an uploads public URL', () => {
        expect(parseUploadObjectName(`${UPLOADS}1712345678-ab12.webp`)).toBe('1712345678-ab12.webp');
    });
    test('decodes encoded names and strips query strings', () => {
        expect(parseUploadObjectName(`${UPLOADS}my%20file.jpg?token=1`)).toBe('my file.jpg');
    });
    test('ignores foreign URLs and other buckets', () => {
        expect(parseUploadObjectName('https://images.unsplash.com/photo-1?w=600')).toBeNull();
        expect(parseUploadObjectName('https://proj.supabase.co/storage/v1/object/public/avatars/x.jpg')).toBeNull();
        expect(parseUploadObjectName('')).toBeNull();
        expect(parseUploadObjectName(null)).toBeNull();
        expect(parseUploadObjectName(undefined)).toBeNull();
    });
});

describe('removeUploadedFile', () => {
    beforeEach(() => {
        supabase.storage.from.mockImplementation(() => ({ remove: mockRemove, upload: mockUpload, getPublicUrl: mockGetPublicUrl }));
        mockRemove.mockReset();
    });

    test('removes only uploads-bucket objects', async () => {
        mockRemove.mockResolvedValue({ error: null });
        await removeUploadedFile(`${UPLOADS}old-avatar.webp`);
        expect(mockRemove).toHaveBeenCalledWith(['old-avatar.webp']);
    });

    test('ignores foreign URLs without calling storage', async () => {
        await removeUploadedFile('https://images.unsplash.com/photo-1');
        await removeUploadedFile('');
        expect(mockRemove).not.toHaveBeenCalled();
    });

    test('swallows storage errors (never blocks the UI)', async () => {
        mockRemove.mockRejectedValue(new Error('policy denied'));
        await expect(removeUploadedFile(`${UPLOADS}x.jpg`)).resolves.toBeUndefined();
    });
});

describe('UploadFile single pipeline', () => {
    const realCreateElement = document.createElement.bind(document);
    let canvas;
    let createSpy;

    beforeEach(() => {
        supabase.storage.from.mockImplementation(() => ({ remove: mockRemove, upload: mockUpload, getPublicUrl: mockGetPublicUrl }));
        mockUpload.mockReset().mockResolvedValue({ error: null });
        mockGetPublicUrl.mockReset().mockImplementation(() => ({ data: { publicUrl: 'https://proj.supabase.co/storage/v1/object/public/uploads/new.webp' } }));
        canvas = {
            width: 0,
            height: 0,
            getContext: () => ({ drawImage: jest.fn() }),
            toBlob: (cb, type) => cb(new Blob(['x'], { type })),
        };
        createSpy = jest.spyOn(document, 'createElement').mockImplementation((tag) => (tag === 'canvas' ? canvas : realCreateElement(tag)));
        URL.createObjectURL = jest.fn(() => 'blob:mock');
        URL.revokeObjectURL = jest.fn();
        global.Image = class {
            constructor() {
                setTimeout(() => { this.naturalWidth = 2000; this.naturalHeight = 1000; this.onload && this.onload(); }, 0);
            }
        };
    });

    afterEach(() => { createSpy && createSpy.mockRestore(); });

    test('rejects non-image files before any upload', async () => {
        await expect(backend.integrations.Core.UploadFile({ file: { type: 'application/pdf', size: 10 } }))
            .rejects.toThrow('Only image files');
        expect(mockUpload).not.toHaveBeenCalled();
    });

    test('rejects files over 5MB before any upload', async () => {
        await expect(backend.integrations.Core.UploadFile({ file: { type: 'image/png', size: 6 * 1024 * 1024 } }))
            .rejects.toThrow('5MB');
        expect(mockUpload).not.toHaveBeenCalled();
    });

    test('avatar kind downscales to 400px and uploads WebP', async () => {
        const result = await backend.integrations.Core.UploadFile({ file: { type: 'image/jpeg', size: 1000 }, kind: 'avatar' });
        expect(canvas.width).toBe(400);
        expect(canvas.height).toBe(200);
        expect(mockUpload).toHaveBeenCalledTimes(1);
        const [, blob] = mockUpload.mock.calls[0];
        expect(blob.type).toBe('image/webp');
        expect(result.file_url).toContain('/uploads/');
    });

    test('default kind downscales to 1080px', async () => {
        await backend.integrations.Core.UploadFile({ file: { type: 'image/jpeg', size: 1000 } });
        expect(canvas.width).toBe(1080);
    });

    test('PNG keeps PNG when WebP encoding is unsupported (transparency)', async () => {
        canvas.toBlob = (cb, type) => cb(type === 'image/webp' ? null : new Blob(['x'], { type }));
        await backend.integrations.Core.UploadFile({ file: { type: 'image/png', size: 1000 } });
        const [name, blob] = mockUpload.mock.calls[0];
        expect(blob.type).toBe('image/png');
        expect(name.endsWith('.png')).toBe(true);
    });
});
