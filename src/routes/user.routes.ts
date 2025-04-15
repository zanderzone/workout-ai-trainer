import express from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import userController from "../controllers/user.controller";
import asyncHandler from "express-async-handler";

const router = express.Router();

// Public routes (no auth required)
router.post("/", asyncHandler(userController.createUser));

// Protected routes
router.use(authenticateJWT);
router.get("/:userId", asyncHandler(userController.getUser));
router.put("/:userId", asyncHandler(userController.updateUserById));
router.put("/fitness-profile", asyncHandler(userController.updateFitnessProfile));
router.get("/fitness-profile", asyncHandler(userController.getFitnessProfile));
router.post("/fitness-profile/reset", asyncHandler(userController.resetFitnessProfile));

export default router;
