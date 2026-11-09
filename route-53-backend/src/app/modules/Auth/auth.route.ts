import express from 'express';
import { AuthControllers } from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import validateRequest from '../../utils/validateRequest';
import { AuthValidation } from './auth.validation';

const router = express.Router();

router.post(
  '/register',
  validateRequest(AuthValidation.registerSchema),
  AuthControllers.register,
);

router.post(
  '/login',
  validateRequest(AuthValidation.loginSchema),
  AuthControllers.login,
);

router.post('/refresh', AuthControllers.refresh);

router.post('/logout', AuthControllers.logout);

router.get('/me', requireAuth, AuthControllers.getMe);
router.get('/profile', requireAuth, AuthControllers.getMe);

export const AuthRoutes = router;
