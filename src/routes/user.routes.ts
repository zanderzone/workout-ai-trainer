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

export default router;
