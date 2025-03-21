import axios from 'axios';
import { GoogleTokenResponse, GoogleUserInfo, AppleTokenResponse, AppleUserInfo } from '@src/utils/oauth';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Mock OAuth functions
const mockGoogleTokens: GoogleTokenResponse = {
    access_token: 'mock_google_access_token',
    id_token: 'mock_google_id_token',
    refresh_token: 'mock_google_refresh_token',
    expires_in: 3600,
    token_type: 'Bearer'
};

const mockGoogleUserInfo: GoogleUserInfo = {
    id: 'mock_google_user_id',
    email: 'test@example.com',
    verified_email: true,
    name: 'Test User',
    given_name: 'Test',
    family_name: 'User',
    picture: 'https://example.com/picture.jpg'
};

const mockAppleTokens: AppleTokenResponse = {
    access_token: 'mock_apple_access_token',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'mock_apple_refresh_token',
    id_token: 'mock_apple_id_token'
};

const mockAppleUserInfo: AppleUserInfo = {
    sub: 'mock_apple_user_id',
    email: 'test@example.com',
    email_verified: true,
    name: {
        firstName: 'Test',
        lastName: 'User'
    }
};

// Set up environment variables for mocking
process.env.MOCK_GOOGLE_TOKENS = JSON.stringify(mockGoogleTokens);
process.env.MOCK_GOOGLE_USER_INFO = JSON.stringify(mockGoogleUserInfo);
process.env.MOCK_APPLE_TOKENS = JSON.stringify(mockAppleTokens);
process.env.MOCK_APPLE_USER_INFO = JSON.stringify(mockAppleUserInfo);

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(message);
    }
}

async function testOAuthFlow(provider: 'google' | 'apple') {
    try {
        console.log(`\nTesting ${provider} OAuth flow...`);

        // 1. Test initial redirect
        const authResponse = await axios.get(`${API_URL}/auth/${provider}`, {
            maxRedirects: 0,
            validateStatus: (status) => status === 302
        });

        assert(authResponse.status === 302, `Expected redirect status 302, got ${authResponse.status}`);
        const location = authResponse.headers.location;
        assert(location !== undefined, 'No redirect URL provided');

        // 2. Verify redirect URL structure
        const redirectUrl = new URL(location);
        if (provider === 'google') {
            assert(redirectUrl.hostname === 'accounts.google.com', 'Invalid Google OAuth hostname');
            assert(redirectUrl.pathname === '/o/oauth2/v2/auth', 'Invalid Google OAuth path');
        } else {
            assert(redirectUrl.hostname === 'appleid.apple.com', 'Invalid Apple Sign In hostname');
            assert(redirectUrl.pathname === '/auth/authorize', 'Invalid Apple Sign In path');
        }

        // 3. Extract state from redirect URL for callback test
        const state = redirectUrl.searchParams.get('state');
        assert(state !== null, 'No state parameter in redirect URL');

        // 4. Test callback with invalid state (should fail)
        try {
            const invalidCallbackConfig = {
                method: provider === 'google' ? 'get' : 'post',
                url: `${API_URL}/auth/${provider}/callback`,
                ...(provider === 'google'
                    ? { params: { code: 'invalid_code', state: 'invalid_state' } }
                    : { data: { code: 'invalid_code', state: 'invalid_state' } })
            };
            await axios(invalidCallbackConfig);
            assert(false, 'Expected invalid state to be rejected');
        } catch (error: any) {
            assert(error.response?.status === 400, `Expected 400 status for invalid state, got ${error.response?.status}`);
        }

        // 5. Test callback with valid state but invalid code (should fail)
        try {
            const invalidCodeConfig = {
                method: provider === 'google' ? 'get' : 'post',
                url: `${API_URL}/auth/${provider}/callback`,
                ...(provider === 'google'
                    ? { params: { code: 'invalid_code', state } }
                    : { data: { code: 'invalid_code', state } })
            };
            await axios(invalidCodeConfig);
            assert(false, 'Expected invalid code to be rejected');
        } catch (error: any) {
            assert(error.response?.status === 401, `Expected 401 status for invalid code, got ${error.response?.status}`);
        }

        console.log(`✓ ${provider} OAuth flow tests passed`);
        return true;
    } catch (error) {
        console.error(`✗ ${provider} OAuth flow error:`, error);
        return false;
    }
}

async function runTests() {
    console.log('\n=== Testing OAuth Authentication Flows ===\n');

    const googleResult = await testOAuthFlow('google');
    const appleResult = await testOAuthFlow('apple');

    if (!googleResult || !appleResult) {
        process.exit(1);
    }

    console.log('\n✓ All OAuth flow tests completed successfully!\n');
}

// Run the tests
runTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});