import axios from 'axios';
import jwt from 'jsonwebtoken';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test data
const testUser = {
    providerId: 'test123',
    email: 'test@example.com',
    provider: 'google',
    firstName: 'Test',
    lastName: 'User',
    profilePicture: 'https://example.com/picture.jpg',
    refreshToken: 'test-refresh-token',
    tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
    createdAt: new Date(),
    updatedAt: new Date()
};

// Helper function to create JWT tokens for testing
const createTestToken = (user = testUser) => {
    return jwt.sign(
        {
            providerId: user.providerId,
            email: user.email,
            provider: user.provider,
            refreshToken: user.refreshToken,
            tokenExpiresAt: user.tokenExpiresAt
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );
};

// Helper function to make authenticated requests
const makeAuthRequest = async (path: string, token?: string) => {
    try {
        const response = await axios.get(`${API_URL}${path}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            validateStatus: () => true
        });
        return {
            status: response.status,
            message: response.data.message,
            success: response.status < 400
        };
    } catch (error: any) {
        return {
            status: error.response?.status || 500,
            message: error.response?.data?.message || error.message,
            success: false
        };
    }
};

async function testAuthMiddleware() {
    console.log('\n=== Testing OAuth Auth Middleware ===\n');

    // Test 1: Access public route without token (should succeed)
    console.log('Test 1: Access public route without token');
    const result1 = await makeAuthRequest('/test/public');
    console.log(`Status: ${result1.status}, Message: ${result1.message}`);
    if (!result1.success) process.exit(1);

    // Test 2: Access protected route without token (should fail)
    console.log('\nTest 2: Access protected route without token');
    const result2 = await makeAuthRequest('/test/protected');
    console.log(`Status: ${result2.status}, Message: ${result2.message}`);
    if (result2.success) process.exit(1);

    // Test 3: Access protected route with valid token (should succeed)
    console.log('\nTest 3: Access protected route with valid token');
    const validToken = createTestToken();
    const result3 = await makeAuthRequest('/test/protected', validToken);
    console.log(`Status: ${result3.status}, Message: ${result3.message}`);
    if (!result3.success) process.exit(1);

    // Test 4: Access protected route with expiring token (should refresh)
    console.log('\nTest 4: Access protected route with expiring token');
    const expiringToken = createTestToken({
        ...testUser,
        tokenExpiresAt: new Date(Date.now() + 60 * 1000) // 1 minute from now
    });
    const result4 = await makeAuthRequest('/test/protected', expiringToken);
    console.log(`Status: ${result4.status}, Message: ${result4.message}`);
    if (!result4.success) process.exit(1);

    // Test 5: Access protected route with invalid provider (should fail)
    console.log('\nTest 5: Access protected route with invalid provider');
    const invalidProviderToken = jwt.sign(
        {
            providerId: testUser.providerId,
            email: testUser.email,
            provider: 'invalid',
            refreshToken: testUser.refreshToken,
            tokenExpiresAt: testUser.tokenExpiresAt
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );
    const result5 = await makeAuthRequest('/test/protected', invalidProviderToken);
    console.log(`Status: ${result5.status}, Message: ${result5.message}`);
    if (result5.success) process.exit(1);

    // Test 6: Access protected route with missing refresh token (should fail)
    console.log('\nTest 6: Access protected route with missing refresh token');
    const noRefreshToken = jwt.sign(
        {
            providerId: testUser.providerId,
            email: testUser.email,
            provider: testUser.provider,
            tokenExpiresAt: testUser.tokenExpiresAt
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );
    const result6 = await makeAuthRequest('/test/protected', noRefreshToken);
    console.log(`Status: ${result6.status}, Message: ${result6.message}`);
    if (result6.success) process.exit(1);

    console.log('\n✓ All auth middleware tests passed!\n');
}

// Run the tests
testAuthMiddleware().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
}); 