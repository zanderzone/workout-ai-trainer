import express from 'express';
import { authController } from '../controllers/auth.controller';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Apple Sign In routes
router.get('/apple', authController.appleAuth);
router.post('/apple/callback', asyncHandler(authController.appleCallback));

// Auth status check
router.get('/status', asyncHandler(authController.checkAuthStatus));

export default router;
