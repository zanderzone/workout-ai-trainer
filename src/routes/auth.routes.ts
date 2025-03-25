import express from 'express';
import { authController } from '../controllers/auth.controller';
import userController from '../controllers/user.controller';
import asyncHandler from 'express-async-handler';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = express.Router();

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Apple OAuth routes
router.get('/apple', authController.appleAuth);
// Handle preflight requests for Apple callback
router.options('/apple/callback', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'https://appleid.apple.com');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
});
router.post('/apple/callback', (req, res, next) => {
    console.log('Apple callback route hit - middleware');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    res.header('Access-Control-Allow-Origin', 'https://appleid.apple.com');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    console.log('CORS headers set');
    next();
}, (req, res, next) => {
    console.log('Apple callback main handler starting');
    try {
        authController.appleCallback(req, res);
    } catch (error) {
        console.error('Error in Apple callback:', error);
        next(error);
    }
});
// router.post('/apple/callback', authController.appleCallback);
router.post('/apple/notifications', authController.handleAppleNotifications);

// Auth status check
router.get('/status', asyncHandler(authController.checkAuthStatus));

// Profile completion
router.post('/profile', authenticateJWT, asyncHandler(userController.updateUser));

export default router;
