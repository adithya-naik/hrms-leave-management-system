import { Router } from 'express';
import { login, register, getCurrentUser, refreshToken } from '@/controllers/authController';
import { authenticate } from '@/middleware/auth';
import { validate, loginSchema, registerSchema } from '@/middleware/validation';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getCurrentUser);

export default router;