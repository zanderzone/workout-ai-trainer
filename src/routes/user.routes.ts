import express from "express";
import { authenticateJWT, validateSession } from "../middleware/auth.middleware";
import userController from "../controllers/user.controller";
import asyncHandler from "express-async-handler";

const router = express.Router();

// Public routes (no auth required)
router.post("/", asyncHandler(userController.createUser));

// Protected routes
router.use(authenticateJWT, validateSession);
router.get("/:userId", asyncHandler(userController.getUser));

export default router;
