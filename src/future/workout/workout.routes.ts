/* eslint-disable */
// @ts-nocheck
// This file is part of the future workout feature and is temporarily disabled

import express from "express";
import workoutController from "../controllers/workout.controller";
import { authenticateJWT, validateSession } from "../middleware/auth.middleware";
import asyncHandler from "express-async-handler";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT, validateSession);

// Append additional weeks to an existing workout
router.patch("/:workoutId/next-weeks", workoutController.addNextWeeks);

// Fetch an existing workout
router.get("/:workoutId", asyncHandler(workoutController.getWorkout));

// Create a new workout
router.post("/", asyncHandler(workoutController.createWorkout));

export default router;
