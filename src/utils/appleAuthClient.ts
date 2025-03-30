import jwt from 'jsonwebtoken';
import axios from 'axios';
import { AppleConfig } from '../config/apple.config';

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    id_token: string;
}

export class AppleAuthClient {
    private config: AppleConfig;
    private privateKey: string;

    constructor(config: AppleConfig) {
        this.config = config;
        this.privateKey = this.config.privateKey;
    }

    private generateClientSecret(): string {
        const now = Math.floor(Date.now() / 1000);
        const clientSecret = jwt.sign({
            iss: this.config.teamId,
            iat: now,
            exp: now + 15777000, // 6 months
            aud: 'https://appleid.apple.com',
            sub: this.config.servicesId
        }, this.privateKey, {
            algorithm: 'ES256',
            header: {
                kid: this.config.keyId,
                typ: undefined,
                alg: 'ES256'
            }
        });
        return clientSecret;
    }

    public async getAuthorizationToken(code: string): Promise<TokenResponse> {
        const clientSecret = this.generateClientSecret();

        const params = new URLSearchParams();
        params.append('client_id', this.config.servicesId);
        params.append('client_secret', clientSecret);
        params.append('code', code);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', this.config.callbackUrl);

        try {
            const response = await axios.post<TokenResponse>(
                'https://appleid.apple.com/auth/token',
                params.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Failed to exchange Apple authorization code:', error);
            throw new Error('Failed to exchange Apple authorization code');
        }
    }
} 