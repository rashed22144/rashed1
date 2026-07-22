import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { backend } from '@/api/backendClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // يجلب/ينشئ صف المستخدم بجدول users بمطابقة الجلسة الحالية
    const refreshUser = useCallback(async () => {
        try {
            const me = await backend.auth.me();
            setCurrentUser(me);
        } catch {
            setCurrentUser(null);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        // الحالة الأولية عند فتح الموقع
        supabase.auth.getSession().then(async ({ data }) => {
            if (data?.session) {
                await refreshUser();
            }
            if (isMounted) setIsLoading(false);
        });

        // الاستماع لأي تغيّر بحالة الجلسة (تسجيل دخول/خروج) بأي صفحة بالموقع
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                await refreshUser();
            } else {
                setCurrentUser(null);
            }
            if (isMounted) setIsLoading(false);
        });

        return () => {
            isMounted = false;
            listener?.subscription?.unsubscribe();
        };
    }, [refreshUser]);

    const loginWithGoogle = () => backend.auth.loginWithGoogle();

    const logout = async () => {
        await backend.auth.logout();
        setCurrentUser(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, isLoading, loginWithGoogle, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        return { currentUser: null, isLoading: false, loginWithGoogle: () => {}, logout: () => {}, refreshUser: () => {} };
    }
    return ctx;
}
