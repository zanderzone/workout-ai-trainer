import express from "express";
import passport from "passport";
import { generateToken } from "../auth";

const router = express.Router();

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = generateToken(req.user);
    res.json({ token, user: req.user });
  }
);

// Apple OAuth
router.get("/apple", passport.authenticate("apple"));
router.post("/apple/callback",
  passport.authenticate("apple", { session: false }),
  (req, res) => {
    const token = generateToken(req.user);
    res.json({ token, user: req.user });
  }
);

export default router;
