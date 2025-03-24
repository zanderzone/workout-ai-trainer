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
        console.log('Starting Google token exchange...');
        console.log('Request parameters:', {
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

        console.log('Token exchange response received:', {
            accessToken: tokenResponse.data.access_token ? 'present' : 'missing',
            idToken: tokenResponse.data.id_token ? 'present' : 'missing',
            refreshToken: tokenResponse.data.refresh_token ? 'present' : 'missing',
            expiresIn: tokenResponse.data.expires_in,
            tokenType: tokenResponse.data.token_type
        });

        // Get user info using the access token
        console.log('Fetching Google user info...');
        const userInfoResponse = await axios.get<GoogleUserInfo>(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
                headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
            }
        );

        console.log('User info received:', {
            id: userInfoResponse.data.id,
            email: userInfoResponse.data.email,
            name: userInfoResponse.data.name,
            givenName: userInfoResponse.data.given_name,
            familyName: userInfoResponse.data.family_name
        });

        return {
            tokens: tokenResponse.data,
            userInfo: userInfoResponse.data
        };
    } catch (error: any) {
        console.error('Error in Google token exchange:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
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
        debugApple('Starting Apple token exchange...');
        debugApple('Code received:', code ? 'present' : 'missing');
        debugApple('Configuration:', {
            clientId: appleConfig.clientId,
            teamId: appleConfig.teamId,
            keyId: appleConfig.keyId,
            callbackUrl: appleConfig.callbackUrl,
            privateKeyPresent: !!appleConfig.privateKey
        });

        // Check if we're in test mode
        if (process.env.MOCK_APPLE_TOKENS && process.env.MOCK_APPLE_USER_INFO) {
            return {
                tokens: JSON.parse(process.env.MOCK_APPLE_TOKENS),
                userInfo: JSON.parse(process.env.MOCK_APPLE_USER_INFO)
            };
        }

        debugApple('Generating client secret...');
        const clientSecret = await generateAppleClientSecret();
        debugApple('Client secret generated successfully');

        debugApple('Making token exchange request to Apple...');
        const params = new URLSearchParams();
        params.append('code', code);
        params.append('client_id', appleConfig.servicesId);
        params.append('client_secret', clientSecret);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', appleConfig.callbackUrl);

        debugApple('Token exchange parameters:', Object.fromEntries(params));

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

        debugApple('Token exchange successful. Response:', {
            accessToken: response.data.access_token ? 'present' : 'missing',
            tokenType: response.data.token_type,
            expiresIn: response.data.expires_in,
            refreshToken: response.data.refresh_token ? 'present' : 'missing',
            idToken: response.data.id_token ? 'present' : 'missing'
        });

        // Decode the ID token to get user info
        const decodedToken = jwt.decode(response.data.id_token) as AppleUserInfo;
        if (!decodedToken) {
            throw new Error('Failed to decode Apple ID token');
        }

        debugApple('Successfully decoded ID token:', {
            sub: decodedToken.sub,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            name: decodedToken.name ? 'present' : 'missing'
        });

        return {
            tokens: response.data,
            userInfo: decodedToken
        };
    } catch (error: any) {
        debugApple('Error in Apple token exchange:');
        debugApple('Error message:', error.message);
        if (error.response) {
            debugApple('Response status:', error.response.status);
            debugApple('Response data:', error.response.data);
            debugApple('Response headers:', error.response.headers);
        } else if (error.request) {
            debugApple('No response received. Request:', error.request);
        }
        throw new Error('Failed to exchange Apple token: ' + (error.response?.data?.error || error.message));
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

// Update generateAppleClientSecret to use the config
async function generateAppleClientSecret(): Promise<string> {
    try {
        console.log('Generating Apple client secret...');
        console.log('Apple config:', {
            clientId: appleConfig.clientId,
            servicesId: appleConfig.servicesId,
            teamId: appleConfig.teamId,
            keyId: appleConfig.keyId,
            callbackUrl: appleConfig.callbackUrl
        });

        const clientSecret = jwt.sign({}, appleConfig.privateKey, {
            algorithm: 'ES256',
            expiresIn: '1h',
            audience: 'https://appleid.apple.com',
            issuer: appleConfig.teamId,
            subject: appleConfig.servicesId, // Use Services ID as the subject
            header: {
                alg: 'ES256',
                kid: appleConfig.keyId,
                typ: 'JWT'
            }
        });

        // Log the decoded token for debugging
        const decoded = jwt.decode(clientSecret, { complete: true });
        console.log('Decoded client secret:', JSON.stringify(decoded, null, 2));

        return clientSecret;
    } catch (error) {
        debugApple('Error generating Apple client secret: %O', error);
        throw new Error('Failed to generate Apple client secret');
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

// Utility function to check if a token is expiring soon
export function isTokenExpiringSoon(expiresIn: number, thresholdSeconds = 300): boolean {
    return expiresIn <= thresholdSeconds;
} 