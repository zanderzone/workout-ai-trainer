import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email?: string;
    sub?: string;
    exp?: number;
}

interface AuthState {
    isAuthenticated: boolean;
    userId: string | null;
    email: string | null;
    name: string | null;
    tokenExpiry: number | null;
}

type TokenExpiredCallback = () => void;
type AuthStateChangeCallback = (state: AuthState) => void;

export class TokenService {
    private static instance: TokenService;
    private tokenExpiredCallbacks: Set<TokenExpiredCallback> = new Set();
    private authStateChangeCallbacks: Set<AuthStateChangeCallback> = new Set();
    private currentAuthState: AuthState = {
        isAuthenticated: false,
        userId: null,
        email: null,
        name: null,
        tokenExpiry: null
    };

    private constructor() {
        // Initialize auth state from stored token
        this.initializeAuthState();
        // Set up token expiry check interval
        this.setupTokenExpiryCheck();
    }

    public static getInstance(): TokenService {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }

    private initializeAuthState(): void {
        const token = this.getToken();
        if (token) {
            try {
                const decoded = this.decodeToken(token);
                this.updateAuthState(decoded);
            } catch (error) {
                this.clearAuthState();
            }
        }
    }

    private setupTokenExpiryCheck(): void {
        // Check token expiry every minute
        setInterval(() => {
            if (this.isTokenExpired()) {
                this.handleTokenExpiry();
            }
        }, 60000);
    }

    private decodeToken(token: string): DecodedToken {
        return jwtDecode<DecodedToken>(token);
    }

    private updateAuthState(decoded: DecodedToken): void {
        const newState: AuthState = {
            isAuthenticated: true,
            userId: decoded.sub || null,
            email: decoded.email || null,
            name: decoded.displayName || decoded.firstName || null,
            tokenExpiry: decoded.exp ? decoded.exp * 1000 : null // Convert to milliseconds
        };

        this.currentAuthState = newState;
        this.notifyAuthStateChange();
    }

    private clearAuthState(): void {
        this.currentAuthState = {
            isAuthenticated: false,
            userId: null,
            email: null,
            name: null,
            tokenExpiry: null
        };
        this.notifyAuthStateChange();
    }

    private notifyAuthStateChange(): void {
        this.authStateChangeCallbacks.forEach(callback => {
            callback(this.currentAuthState);
        });
    }

    private handleTokenExpiry(): void {
        this.tokenExpiredCallbacks.forEach(callback => callback());
        this.clearAuthState();
        this.removeToken();
    }

    // Public methods

    public setToken(token: string): void {
        try {
            const decoded = this.decodeToken(token);
            localStorage.setItem('token', token);
            this.updateAuthState(decoded);
        } catch (error) {
            console.error('Invalid token:', error);
            this.removeToken();
        }
    }

    public getToken(): string | null {
        return localStorage.getItem('token');
    }

    public removeToken(): void {
        localStorage.removeItem('token');
        this.clearAuthState();
    }

    public isTokenValid(): boolean {
        const token = this.getToken();
        if (!token) return false;

        try {
            const decoded = this.decodeToken(token);
            return !this.isTokenExpired(decoded.exp);
        } catch {
            return false;
        }
    }

    public isTokenExpired(exp?: number): boolean {
        const expiry = exp || this.currentAuthState.tokenExpiry;
        if (!expiry) return true;
        return Date.now() >= expiry;
    }

    public async refreshToken(): Promise<void> {
        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const { token } = await response.json();
            this.setToken(token);
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.handleTokenExpiry();
            throw error;
        }
    }

    public isAuthenticated(): boolean {
        return this.currentAuthState.isAuthenticated;
    }

    public getAuthState(): AuthState {
        return { ...this.currentAuthState };
    }

    public onTokenExpired(callback: TokenExpiredCallback): () => void {
        this.tokenExpiredCallbacks.add(callback);
        return () => this.tokenExpiredCallbacks.delete(callback);
    }

    public onAuthStateChange(callback: AuthStateChangeCallback): () => void {
        this.authStateChangeCallbacks.add(callback);
        return () => this.authStateChangeCallbacks.delete(callback);
    }

    // Utility method to get auth headers for API requests
    public getAuthHeaders(): HeadersInit {
        const token = this.getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    getDecodedToken(): DecodedToken | null {
        const token = this.getToken();
        if (!token) return null;
        try {
            return jwtDecode<DecodedToken>(token);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    private getAuthStateFromToken(decoded: DecodedToken): AuthState {
        return {
            isAuthenticated: true,
            userId: decoded.sub || null,
            email: decoded.email || null,
            name: decoded.displayName || decoded.firstName || null,
            tokenExpiry: decoded.exp ? decoded.exp * 1000 : null // Convert to milliseconds
        };
    }
}

// Export singleton instance
export const tokenService = TokenService.getInstance();

// Export types
export type { AuthState, DecodedToken }; 