import express from 'express';
import asyncHandler from 'express-async-handler';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = express.Router();

// Test route that requires authentication
router.get('/protected', authenticateJWT, asyncHandler(async (req, res) => {
    res.json({
        message: 'Protected route accessed successfully',
        user: req.user
    });
}));

// Test route that doesn't require authentication
router.get('/public', asyncHandler(async (_req, res) => {
    res.json({
        message: 'Public route accessed successfully'
    });
}));

export default router; 