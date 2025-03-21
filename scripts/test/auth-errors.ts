import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testAuthErrors() {
    try {
        console.log('Starting authentication error tests...\n');

        // Test 1: Register with invalid email
        console.log('1. Testing registration with invalid email...');
        try {
            await axios.post(`${API_URL}/auth/register`, {
                email: 'invalid-email',
                password: 'TestPassword123!',
                firstName: 'Test',
                lastName: 'User'
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Expected error:', error.response?.data);
            }
        }
        console.log('----------------------------------------\n');

        // Test 2: Login with wrong password
        console.log('2. Testing login with wrong password...');
        try {
            await axios.post(`${API_URL}/auth/login`, {
                email: 'test@example.com',
                password: 'WrongPassword123!'
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Expected error:', error.response?.data);
            }
        }
        console.log('----------------------------------------\n');

        // Test 3: Access protected route without token
        console.log('3. Testing protected route access without token...');
        try {
            await axios.get(`${API_URL}/wod/history`);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Expected error:', error.response?.data);
            }
        }
        console.log('----------------------------------------\n');

        // Test 4: Access protected route with invalid token
        console.log('4. Testing protected route access with invalid token...');
        try {
            await axios.get(`${API_URL}/wod/history`, {
                headers: {
                    Authorization: 'Bearer invalid-token'
                }
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Expected error:', error.response?.data);
            }
        }
        console.log('----------------------------------------\n');

        console.log('All error tests completed successfully! 🎉');

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

// Run the test
testAuthErrors(); 