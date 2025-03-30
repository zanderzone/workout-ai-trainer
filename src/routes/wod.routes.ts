import express from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import wodController from '../controllers/wod.controller';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// WOD routes
router.post('/', asyncHandler(wodController.generateWod));
router.get('/:id', asyncHandler(wodController.getWod));

export default router;