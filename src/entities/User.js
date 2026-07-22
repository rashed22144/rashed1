import { backend } from '@/api/backendClient';

// نفس واجهة الـ User القديمة (User.me / User.updateMyUserData) لكن فوق Supabase مباشرة
export const User = {
    ...backend.entities.User,
    me: backend.auth.me,
    updateMyUserData: backend.auth.updateMe,
    logout: backend.auth.logout,
};
