import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { healthController } from '../controllers/health.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Health check route (no auth required)
router.get('/health', healthController.check);

// Auth routes (no auth required)
router.get('/auth/google', authController.googleAuth);
router.get('/auth/google/callback', authController.googleCallback);
router.post('/auth/apple', authController.appleAuth);
router.post('/auth/apple/callback', authController.appleCallback);

// Protected routes (require auth)
router.get('/api/me', authenticateJWT, (req, res) => {
    res.json(req.user);
});

// ... rest of the routes ...

export default router; 