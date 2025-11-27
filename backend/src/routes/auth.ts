import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Login (public)
router.post('/login', AuthController.login);

// Register (public - can be restricted later)
router.post('/register', AuthController.register);

// Get current user (requires authentication)
router.get('/me', authenticate, AuthController.getCurrentUser);

// Google OAuth
router.get('/google/url', AuthController.getGoogleAuthUrl);
router.get('/google/callback', AuthController.googleCallback);
router.post('/google/login', AuthController.googleLogin);

export default router;

