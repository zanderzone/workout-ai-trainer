import { Router, Request, Response } from 'express';
import passport from 'passport';
import { generateToken } from '../auth';
import { User } from '../types/user.types';

const router = Router();

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req: Request, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication failed' });
      return;
    }
    const token = generateToken(req.user as User);
    res.json({
      token,
      user: req.user,
      message: 'Successfully authenticated with Google'
    });
  }
);

// Apple OAuth routes
router.get('/apple',
  passport.authenticate('apple', { scope: ['email', 'name'] })
);

router.post('/apple/callback',
  passport.authenticate('apple', { session: false }),
  (req: Request, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication failed' });
      return;
    }
    const token = generateToken(req.user as User);
    res.json({
      token,
      user: req.user,
      message: 'Successfully authenticated with Apple'
    });
  }
);

// Logout route
router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

// Test route to verify authentication
router.get('/test', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      message: 'Authenticated',
      user: req.user
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

export default router;
