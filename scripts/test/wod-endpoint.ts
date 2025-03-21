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
const makeWodRequest = async (path: string, token?: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
    try {
        const response = await axios({
            method,
            url: `${API_URL}${path}`,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            data,
            validateStatus: () => true
        });
        return {
            status: response.status,
            message: response.data.message || response.data.error,
            data: response.data,
            success: response.status < 400
        };
    } catch (error: any) {
        return {
            status: error.response?.status || 500,
            message: error.response?.data?.message || error.message,
            data: null,
            success: false
        };
    }
};

async function testWodEndpoint() {
    console.log('\n=== Testing WOD Endpoint ===\n');

    // Test 1: Create WOD without token (should fail)
    console.log('Test 1: Create WOD without token');
    const result1 = await makeWodRequest('/wod', undefined, 'POST', {
        userId: 'test123',
        workoutOptions: {
            totalAvailableTime: '60 minutes',
            fitnessLevel: 'intermediate'
        }
    });
    console.log(`Status: ${result1.status}, Message: ${result1.message}`);
    if (result1.success) process.exit(1);

    // Test 2: Create WOD with valid token and data (should succeed)
    console.log('\nTest 2: Create WOD with valid token and data');
    const validToken = createTestToken();
    const validWodData = {
        userId: 'test123',
        userProfile: {
            fitnessLevel: 'intermediate',
            sex: 'male',
            ageRange: '25-34',
            goals: ['strength', 'endurance'],
            equipmentAvailable: ['barbell', 'plates']
        },
        workoutOptions: {
            totalAvailableTime: '60 minutes',
            includeWarmups: true,
            includeCooldown: true
        }
    };
    const result2 = await makeWodRequest('/wod', validToken, 'POST', validWodData);
    console.log(`Status: ${result2.status}, Message: ${result2.message}`);
    if (!result2.success) process.exit(1);
    if (result2.data) {
        console.log('Created WOD:', result2.data);
    }

    // Test 3: Get WOD with invalid ID (should fail)
    console.log('\nTest 3: Get WOD with invalid ID');
    const result3 = await makeWodRequest('/wod/invalid-id', validToken);
    console.log(`Status: ${result3.status}, Message: ${result3.message}`);
    if (result3.success) process.exit(1);

    // Test 4: Get WOD with valid ID (should succeed)
    if (result2.data?.wodId) {
        console.log('\nTest 4: Get WOD with valid ID');
        const result4 = await makeWodRequest(`/wod/${result2.data.wodId}`, validToken);
        console.log(`Status: ${result4.status}, Message: ${result4.message}`);
        if (!result4.success) process.exit(1);
        if (result4.data) {
            console.log('Retrieved WOD:', result4.data);
        }
    }

    // Test 5: Create WOD with invalid data (should fail)
    console.log('\nTest 5: Create WOD with invalid data');
    const invalidWodData = {
        userId: '', // Invalid: empty string
        workoutOptions: {
            totalAvailableTime: 'invalid time'
        }
    };
    const result5 = await makeWodRequest('/wod', validToken, 'POST', invalidWodData);
    console.log(`Status: ${result5.status}, Message: ${result5.message}`);
    if (result5.success) process.exit(1);

    console.log('\n✓ All WOD endpoint tests passed!\n');
}

// Run the tests
testWodEndpoint().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
}); 