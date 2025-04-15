import { useState, useEffect } from 'react';
import { tokenService, AuthState } from '@/lib/token';

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [name, setName] = useState<string | null>(null);

    useEffect(() => {
        // Initial auth state
        const initialState = tokenService.getAuthState();
        setIsAuthenticated(initialState.isAuthenticated);
        setUserId(initialState.userId);
        setEmail(initialState.email);
        setName(initialState.name);

        // Subscribe to auth state changes
        const unsubscribe = tokenService.onAuthStateChange((newState) => {
            setIsAuthenticated(newState.isAuthenticated);
            setUserId(newState.userId);
            setEmail(newState.email);
            setName(newState.name);
            setIsLoading(false);
        });

        // Subscribe to token expiry
        const unsubscribeExpiry = tokenService.onTokenExpired(() => {
            window.location.href = '/login?error=session_expired';
        });

        // Set loading to false after initial state is loaded
        // Use a microtask to ensure this happens after the current render cycle
        // but without causing tests to hang
        Promise.resolve().then(() => {
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
            unsubscribeExpiry();
        };
    }, []);

    const login = async (token: string) => {
        tokenService.setToken(token);
    };

    const logout = () => {
        tokenService.removeToken();
        window.location.href = '/login';
    };

    const refreshToken = async () => {
        try {
            await tokenService.refreshToken();
        } catch (error) {
            tokenService.removeToken();
            window.location.href = '/login';
        }
    };

    const getAuthHeaders = () => {
        return tokenService.getAuthHeaders();
    };

    return {
        isAuthenticated,
        isLoading,
        userId,
        email,
        name,
        login,
        logout,
        refreshToken,
        getAuthHeaders,
    };
}; 