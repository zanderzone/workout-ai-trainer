import express from "express";
import workoutController from "../controllers/workout.controller";
import { authenticateJWT } from "../auth";

const router = express.Router();

// Create a new workout
router.post("/", authenticateJWT, workoutController.createWorkout);

// Fetch an existing workout
router.get("/:userId", authenticateJWT, workoutController.getWorkout);

// Add additional weeks to an existing workout
router.patch("/:workoutId/next-weeks", authenticateJWT, workoutController.addNextWeeks);

export default router;
