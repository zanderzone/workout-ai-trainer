import { Session } from 'express-session';

export interface CustomSession extends Session {
    appleOAuthState?: string;
    googleOAuthState?: string;
}

declare module 'express-session' {
    interface SessionData {
        appleOAuthState?: string;
        googleOAuthState?: string;
    }
} 