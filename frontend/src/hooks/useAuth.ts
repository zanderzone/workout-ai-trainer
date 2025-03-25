import { useState, useEffect } from 'react';
import { checkAuthStatus } from '@/lib/api';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        let mounted = true;

        async function validateAuth() {
            try {
                const { isAuthenticated } = await checkAuthStatus();

                if (!mounted) return;

                setAuthState({
                    isAuthenticated,
                    isLoading: false,
                    error: null,
                });
            } catch (error) {
                if (!mounted) return;
                console.error('Auth check failed:', error);
                setAuthState({
                    isAuthenticated: false,
                    isLoading: false,
                    error: 'Authentication check failed. Please try again.',
                });
            }
        }

        validateAuth();

        return () => {
            mounted = false;
        };
    }, []);

    return authState;
} 