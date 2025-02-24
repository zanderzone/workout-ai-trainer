import express from "express";
import workoutController from "../controllers/workout.controller";
import { authenticateJWT } from "../auth";

const router = express.Router();

// Append additional weeks to an existing workout
router.patch("/:workoutId/next-weeks", authenticateJWT, workoutController.addNextWeeks);

// Fetch an existing workout
router.get("/:workoutId", authenticateJWT, workoutController.getWorkout);

// Create a new workout
router.post("/", authenticateJWT, workoutController.createWorkout);

export default router;
