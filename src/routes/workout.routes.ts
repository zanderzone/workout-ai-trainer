import express from "express";
import workoutController from "../controllers/workout.controller";

const router = express.Router();

router.post("/", workoutController.createWorkout);
router.get("/:userId", workoutController.getWorkout);

export default router;
