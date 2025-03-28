import axios from 'axios';
import jwt from 'jsonwebtoken';
import { googleConfig } from '../config/google.config';
import { appleConfig } from '../config/apple.config';
import debug from 'debug';
import fs from 'fs';
import path from 'path';

// Create debuggers for different parts of the OAuth flow
const debugGoogle = debug('oauth:google');
const debugApple = debug('oauth:apple');
const debugToken = debug('oauth:token');

/**
 * Custom error class for OAuth-related errors
 */
export class OAuthError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly provider: 'google' | 'apple'
    ) {
        super(message);
        this.name = 'OAuthError';
    }
}

/**
 * Response from Google's token endpoint
 */
export interface GoogleTokenResponse {
    /** OAuth access token */
    access_token: string;
    /** OpenID Connect ID token */
    id_token: string;
    /** OAuth refresh token (optional) */
    refresh_token?: string;
    /** Token expiration time in seconds */
    expires_in: number;
    /** Token type (usually "Bearer") */
    token_type: string;
}

/**
 * User information from Google's userinfo endpoint
 */
export interface GoogleUserInfo {
    /** Google user ID */
    id: string;
    /** User's email address */
    email: string;
    /** Whether the email is verified */
    verified_email: boolean;
    /** User's full name */
    name?: string;
    /** User's given name */
    given_name?: string;
    /** User's family name */
    family_name?: string;
    /** URL to user's profile picture */
    picture?: string;
}

/**
 * Response from Apple's token endpoint
 */
export interface AppleTokenResponse {
    /** OAuth access token */
    access_token: string;
    /** Token type (usually "Bearer") */
    token_type: string;
    /** Token expiration time in seconds */
    expires_in: number;
    /** OAuth refresh token */
    refresh_token: string;
    /** OpenID Connect ID token */
    id_token: string;
}

/**
 * User information decoded from Apple's ID token
 */
export interface AppleUserInfo {
    /** Unique identifier for the user */
    sub: string;
    /** User's email address */
    email: string;
    /** Whether the email is verified */
    email_verified: boolean;
    /** User's name information */
    name?: {
        firstName: string;
        lastName: string;
    };
}

/**
 * Fetches user information from Google's userinfo endpoint
 * @param accessToken - Valid Google access token
 * @returns User information from Google
 * @throws OAuthError if the request fails
 */
export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
        const response = await axios.get<GoogleUserInfo>(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );
        return response.data;
    } catch (error) {
        throw new OAuthError(
            'Failed to fetch user info',
            'user_info_failed',
            'google'
        );
    }
}

/**
 * Exchanges an authorization code for Google tokens and user information
 * @param code - Authorization code from Google
 * @returns Object containing tokens and user information
 * @throws OAuthError if the exchange fails
 */
export async function exchangeGoogleToken(code: string): Promise<{ tokens: GoogleTokenResponse; userInfo: GoogleUserInfo }> {
    try {
        debugGoogle('Starting Google token exchange...');
        debugGoogle('Request parameters:', {
            code: code ? 'present' : 'missing',
            clientId: googleConfig.clientId ? 'present' : 'missing',
            callbackUrl: googleConfig.callbackUrl,
            grantType: 'authorization_code'
        });

        // Check if we're in test mode
        if (process.env.MOCK_GOOGLE_TOKENS && process.env.MOCK_GOOGLE_USER_INFO) {
            return {
                tokens: JSON.parse(process.env.MOCK_GOOGLE_TOKENS),
                userInfo: JSON.parse(process.env.MOCK_GOOGLE_USER_INFO)
            };
        }

        const tokenResponse = await axios.post<GoogleTokenResponse>(
            'https://oauth2.googleapis.com/token',
            {
                code,
                client_id: googleConfig.clientId,
                client_secret: googleConfig.clientSecret,
                redirect_uri: googleConfig.callbackUrl,
                grant_type: 'authorization_code'
            }
        );

        debugGoogle('Token exchange successful:', {
            accessToken: tokenResponse.data.access_token ? 'present' : 'missing',
            idToken: tokenResponse.data.id_token ? 'present' : 'missing',
            refreshToken: tokenResponse.data.refresh_token ? 'present' : 'missing'
        });

        const userInfo = await getUserInfo(tokenResponse.data.access_token);

        return {
            tokens: tokenResponse.data,
            userInfo
        };
    } catch (error: any) {
        debugGoogle('Error in Google token exchange:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new OAuthError(
            'Failed to exchange Google token',
            error.response?.data?.error || 'token_exchange_failed',
            'google'
        );
    }
}

/**
 * Refreshes a Google OAuth access token
 * @param refreshToken - Valid refresh token
 * @returns New token response
 * @throws OAuthError if the refresh fails
 */
export async function refreshGoogleToken(refreshToken: string): Promise<GoogleTokenResponse> {
    try {
        debugToken('Refreshing Google access token');
        const response = await axios.post<GoogleTokenResponse>(
            'https://oauth2.googleapis.com/token',
            {
                refresh_token: refreshToken,
                client_id: googleConfig.clientId,
                client_secret: googleConfig.clientSecret,
                grant_type: 'refresh_token'
            }
        );
        debugToken('Successfully refreshed Google token');
        return response.data;
    } catch (error: any) {
        debugToken('Error refreshing Google token:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new OAuthError(
            'Failed to refresh Google token',
            error.response?.data?.error || 'token_refresh_failed',
            'google'
        );
    }
}

/**
 * Exchanges an authorization code for Apple tokens and user information
 * @param code - Authorization code from Apple
 * @returns Object containing tokens and user information
 * @throws OAuthError if the exchange fails
 */
export async function exchangeAppleToken(code: string): Promise<{ tokens: AppleTokenResponse; userInfo: AppleUserInfo }> {
    try {
        console.log('Starting Apple token exchange...');
        console.log('Apple configuration:', {
            clientId: appleConfig.clientId,
            servicesId: appleConfig.servicesId,
            teamId: appleConfig.teamId,
            keyId: appleConfig.keyId,
            callbackUrl: appleConfig.callbackUrl,
            privateKeyLength: appleConfig.privateKey?.length || 0
        });

        // Generate client secret
        console.log('Generating client secret...');
        const clientSecret = await generateAppleClientSecret();
        console.log('Client secret generated successfully');

        // Prepare token exchange request
        const params = new URLSearchParams();
        params.append('code', code);
        params.append('client_id', appleConfig.servicesId);
        params.append('client_secret', clientSecret);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', appleConfig.callbackUrl);

        console.log('Making token exchange request with parameters:', {
            code: `${code.substring(0, 10)}...`,
            client_id: appleConfig.servicesId,
            grant_type: 'authorization_code',
            redirect_uri: appleConfig.callbackUrl
        });

        // Make the token exchange request
        const response = await axios.post<AppleTokenResponse>(
            'https://appleid.apple.com/auth/token',
            params.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            }
        );

        console.log('Token exchange response:', {
            status: response.status,
            statusText: response.statusText,
            data: {
                token_type: response.data.token_type,
                expires_in: response.data.expires_in,
                access_token: response.data.access_token ? '[PRESENT]' : '[MISSING]',
                refresh_token: response.data.refresh_token ? '[PRESENT]' : '[MISSING]',
                id_token: response.data.id_token ? '[PRESENT]' : '[MISSING]'
            }
        });

        // Decode the ID token
        const decodedToken = jwt.decode(response.data.id_token) as AppleUserInfo;
        if (!decodedToken) {
            throw new Error('Failed to decode Apple ID token');
        }

        console.log('Successfully decoded ID token:', {
            sub: decodedToken.sub,
            email: decodedToken.email,
            email_verified: decodedToken.email_verified,
            name: decodedToken.name ? '[PRESENT]' : '[MISSING]'
        });

        return {
            tokens: response.data,
            userInfo: decodedToken
        };
    } catch (error: any) {
        console.error('Error in Apple token exchange:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config ? {
                url: error.config.url,
                method: error.config.method,
                headers: error.config.headers
            } : undefined
        });
        throw new OAuthError(
            `Failed to exchange Apple token: ${error.message}`,
            error.response?.data?.error || 'token_exchange_failed',
            'apple'
        );
    }
}

/**
 * Refreshes an Apple OAuth access token
 * @param refreshToken - Valid refresh token
 * @returns New token response
 * @throws OAuthError if the refresh fails
 */
export async function refreshAppleToken(refreshToken: string): Promise<AppleTokenResponse> {
    try {
        debugToken('Refreshing Apple access token');
        const clientSecret = await generateAppleClientSecret();

        const response = await axios.post<AppleTokenResponse>(
            'https://appleid.apple.com/auth/token',
            {
                refresh_token: refreshToken,
                client_id: appleConfig.servicesId, // Use Services ID for refresh
                client_secret: clientSecret,
                grant_type: 'refresh_token'
            }
        );
        debugToken('Successfully refreshed Apple token');
        return response.data;
    } catch (error: any) {
        debugToken('Error refreshing Apple token:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new OAuthError(
            'Failed to refresh Apple token',
            error.response?.data?.error || 'token_refresh_failed',
            'apple'
        );
    }
}

/**
 * Generates a client secret JWT for Apple Sign In
 * @returns JWT string to use as client_secret
 * @throws Error if JWT generation fails
 */
async function generateAppleClientSecret(): Promise<string> {
    try {
        debugApple('Generating client secret...');
        debugApple('Apple config for client secret:', {
            clientId: appleConfig.clientId,
            servicesId: appleConfig.servicesId,
            teamId: appleConfig.teamId,
            keyId: appleConfig.keyId,
            privateKeyLength: appleConfig.privateKey?.length || 0
        });

        // Ensure private key is in PEM format
        let privateKey = appleConfig.privateKey;
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey;
        }
        if (!privateKey.includes('-----END PRIVATE KEY-----')) {
            privateKey = privateKey + '\n-----END PRIVATE KEY-----';
        }

        // Verify private key format
        const privateKeyLines = privateKey.split('\n');
        const hasHeader = privateKeyLines[0].includes('BEGIN PRIVATE KEY');
        const hasFooter = privateKeyLines[privateKeyLines.length - 1].includes('END PRIVATE KEY');

        debugApple('Private key validation:', {
            totalLines: privateKeyLines.length,
            hasHeader,
            hasFooter,
            firstLine: privateKeyLines[0],
            lastLine: privateKeyLines[privateKeyLines.length - 1]
        });

        const clientSecret = jwt.sign({}, privateKey, {
            algorithm: 'ES256',
            expiresIn: '1h',
            audience: 'https://appleid.apple.com',
            issuer: appleConfig.teamId,
            subject: appleConfig.servicesId,
            header: {
                alg: 'ES256',
                kid: appleConfig.keyId,
                typ: 'JWT'
            }
        });

        // Log the decoded token for debugging
        const decoded = jwt.decode(clientSecret, { complete: true });
        const payload = decoded?.payload as Record<string, any>;
        debugApple('Generated client secret details:', {
            header: decoded?.header,
            payload: payload ? {
                ...payload,
                iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined,
                exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined
            } : null
        });

        return clientSecret;
    } catch (error: any) {
        debugApple('Error generating Apple client secret:', {
            message: error.message,
            stack: error.stack,
            privateKeyPresent: !!appleConfig.privateKey,
            privateKeyLength: appleConfig.privateKey?.length || 0
        });
        throw new Error(`Failed to generate Apple client secret: ${error.message}`);
    }
}

// async function generateAppleClientSecret(): Promise<string> {
//     try {
//         // Read private key from file path
//         const privateKeyPath = process.env.APPLE_PRIVATE_KEY_PATH;
//         if (!privateKeyPath) {
//             throw new Error('APPLE_PRIVATE_KEY_PATH environment variable is not set');
//         }

//         const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

//         // Create the client secret (a JWT)
//         const clientSecret = jwt.sign({}, privateKey, {
//             algorithm: 'ES256',
//             expiresIn: '1h',
//             audience: 'https://appleid.apple.com',
//             issuer: appleConfig.teamId,
//             subject: appleConfig.clientId,
//             keyid: appleConfig.keyId
//         });

//         return clientSecret;
//     } catch (error) {
//         debugApple('Error generating Apple client secret: %O', error);
//         throw new Error('Failed to generate Apple client secret');
//     }
// }

/**
 * Checks if a token is expiring soon
 * @param expiresIn - Token expiration time in seconds
 * @param thresholdSeconds - Time threshold in seconds (default: 5 minutes)
 * @returns True if the token is expiring within the threshold
 */
export function isTokenExpiringSoon(expiresIn: number, thresholdSeconds = 300): boolean {
    return expiresIn <= thresholdSeconds;
} 