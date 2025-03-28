import { AppleAuthClient } from '../../src/utils/appleAuthClient';
import { appleConfig } from '../../src/config/apple.config';
import fs from 'fs';
import path from 'path';

async function testAppleAuthConfig() {
    console.log('Testing Apple OAuth Configuration...\n');

    // Test 1: Verify config values
    console.log('1. Checking config values:');
    console.log('Client ID:', appleConfig.clientId);
    console.log('Services ID:', appleConfig.servicesId);
    console.log('Team ID:', appleConfig.teamId);
    console.log('Key ID:', appleConfig.keyId);
    console.log('Callback URL:', appleConfig.callbackUrl);
    console.log('Scope:', appleConfig.scope.join(', '));

    // Test 2: Verify private key content
    console.log('\n2. Checking private key content:');
    try {
        const privateKey = appleConfig.privateKey;
        console.log('✓ Private key content is present');
        console.log('Private key format:', privateKey.includes('-----BEGIN PRIVATE KEY-----') ? 'PEM' : 'Unknown');
        console.log('Private key length:', privateKey.length);
    } catch (error) {
        console.error('✗ Failed to access private key:', error);
    }

    // Test 3: Verify client secret generation
    console.log('\n3. Testing client secret generation:');
    try {
        const client = new AppleAuthClient(appleConfig);
        const clientSecret = (client as any).generateClientSecret();
        console.log('✓ Client secret generated successfully');
        console.log('Client secret length:', clientSecret.length);
    } catch (error) {
        console.error('✗ Failed to generate client secret:', error);
    }

    // Test 4: Verify callback URL format
    console.log('\n4. Checking callback URL format:');
    try {
        new URL(appleConfig.callbackUrl);
        console.log('✓ Callback URL is valid');
    } catch (error) {
        console.error('✗ Invalid callback URL:', error);
    }

    // Test 5: Verify required environment variables
    console.log('\n5. Checking required environment variables:');
    const requiredEnvVars = [
        'APPLE_CLIENT_ID',
        'APPLE_SERVICES_ID',
        'APPLE_TEAM_ID',
        'APPLE_KEY_ID',
        'APPLE_PRIVATE_KEY_PATH',
        'APPLE_CALLBACK_URL'
    ];

    for (const envVar of requiredEnvVars) {
        if (process.env[envVar]) {
            console.log(`✓ ${envVar} is set`);
        } else {
            console.error(`✗ ${envVar} is not set`);
        }
    }
}

// Run the tests
testAppleAuthConfig().catch(console.error); 