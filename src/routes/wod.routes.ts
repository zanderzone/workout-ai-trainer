import express from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import WodController from '../controllers/wod.controller';
import { OpenAIWorkoutAdapter } from '../adapters/openai-workout.adapter';
import { WodModel } from '../models/wod.model';
import { wodService, userService } from '../services/database.service';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// Initialize dependencies
const openaiAdapter = new OpenAIWorkoutAdapter();
const wodModel = new WodModel(openaiAdapter, wodService, userService);
const wodController = new WodController(wodModel);

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// WOD routes
router.post('/', asyncHandler((req, res) => wodController.generateWod(req, res)));
router.get('/:id', asyncHandler((req, res) => wodController.getWod(req, res)));

export default router;