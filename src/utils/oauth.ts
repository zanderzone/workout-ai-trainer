import axios from 'axios';
import jwt from 'jsonwebtoken';
import { googleConfig } from '../config/google.config';
import { appleConfig } from '../config/apple.config';
import debug from 'debug';

// Create debuggers for different parts of the OAuth flow
const debugGoogle = debug('oauth:google');
const debugApple = debug('oauth:apple');
const debugToken = debug('oauth:token');

export interface GoogleTokenResponse {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
}

export interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
}

export interface AppleTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    id_token: string;
}

export interface AppleUserInfo {
    sub: string; // The unique identifier for the user
    email: string;
    email_verified: boolean;
    name?: {
        firstName: string;
        lastName: string;
    };
}

export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await axios.get<GoogleUserInfo>(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
            headers: { Authorization: `Bearer ${accessToken}` }
        }
    );
    return response.data;
}

export async function exchangeGoogleToken(code: string): Promise<{ tokens: GoogleTokenResponse; userInfo: GoogleUserInfo }> {
    try {
        debugGoogle('Exchanging Google authorization code for tokens');

        // Check if we're in test mode
        if (process.env.MOCK_GOOGLE_TOKENS && process.env.MOCK_GOOGLE_USER_INFO) {
            return {
                tokens: JSON.parse(process.env.MOCK_GOOGLE_TOKENS),
                userInfo: JSON.parse(process.env.MOCK_GOOGLE_USER_INFO)
            };
        }

        // Exchange authorization code for tokens
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

        // Get user info using the access token
        debugGoogle('Fetching Google user info');
        const userInfoResponse = await axios.get<GoogleUserInfo>(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
                headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
            }
        );

        return {
            tokens: tokenResponse.data,
            userInfo: userInfoResponse.data
        };
    } catch (error: any) {
        debugGoogle('Error in Google token exchange: %O', error.response?.data || error.message);
        throw new Error('Failed to exchange Google token');
    }
}

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
        debugToken('Error refreshing Google token: %O', error.response?.data || error.message);
        throw new Error('Failed to refresh Google token');
    }
}

export async function exchangeAppleToken(code: string): Promise<{ tokens: AppleTokenResponse; userInfo: AppleUserInfo }> {
    try {
        debugApple('Exchanging Apple authorization code for tokens');

        // Check if we're in test mode
        if (process.env.MOCK_APPLE_TOKENS && process.env.MOCK_APPLE_USER_INFO) {
            return {
                tokens: JSON.parse(process.env.MOCK_APPLE_TOKENS),
                userInfo: JSON.parse(process.env.MOCK_APPLE_USER_INFO)
            };
        }

        const clientSecret = await generateAppleClientSecret();
        const response = await axios.post<AppleTokenResponse>(
            'https://appleid.apple.com/auth/token',
            {
                code,
                client_id: appleConfig.clientId,
                client_secret: clientSecret,
                grant_type: 'authorization_code',
                redirect_uri: appleConfig.callbackUrl
            }
        );

        // Decode the ID token to get user info
        const decodedToken = jwt.decode(response.data.id_token) as AppleUserInfo;
        if (!decodedToken) {
            throw new Error('Failed to decode Apple ID token');
        }

        return {
            tokens: response.data,
            userInfo: decodedToken
        };
    } catch (error: any) {
        debugApple('Error in Apple token exchange: %O', error.response?.data || error.message);
        throw new Error('Failed to exchange Apple token');
    }
}

export async function refreshAppleToken(refreshToken: string): Promise<AppleTokenResponse> {
    try {
        debugToken('Refreshing Apple access token');
        const clientSecret = await generateAppleClientSecret();

        const response = await axios.post<AppleTokenResponse>(
            'https://appleid.apple.com/auth/token',
            {
                refresh_token: refreshToken,
                client_id: appleConfig.clientId,
                client_secret: clientSecret,
                grant_type: 'refresh_token'
            }
        );
        debugToken('Successfully refreshed Apple token');
        return response.data;
    } catch (error: any) {
        debugToken('Error refreshing Apple token: %O', error.response?.data || error.message);
        throw new Error('Failed to refresh Apple token');
    }
}

async function generateAppleClientSecret(): Promise<string> {
    try {
        // Read private key from file or environment variable
        const privateKey = process.env.APPLE_PRIVATE_KEY || '';

        // Create the client secret (a JWT)
        const clientSecret = jwt.sign({}, privateKey, {
            algorithm: 'ES256',
            expiresIn: '1h',
            audience: 'https://appleid.apple.com',
            issuer: appleConfig.teamId,
            subject: appleConfig.clientId,
            keyid: appleConfig.keyId
        });

        return clientSecret;
    } catch (error) {
        debugApple('Error generating Apple client secret: %O', error);
        throw new Error('Failed to generate Apple client secret');
    }
}

// Utility function to check if a token is expiring soon
export function isTokenExpiringSoon(expiresIn: number, thresholdSeconds = 300): boolean {
    return expiresIn <= thresholdSeconds;
} 