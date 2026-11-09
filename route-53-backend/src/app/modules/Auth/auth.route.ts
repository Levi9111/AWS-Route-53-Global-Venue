import express from 'express';
import { AuthControllers } from './auth.controller';
import auth from '../../middlewares/auth.middleware';
import validateRequest from '../../utils/validateRequest';
import { AuthValidation } from './auth.validation';

const router = express.Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate user & receive JWT token(s)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@test.com
 *               password:
 *                 type: string
 *                 example: SecurePassword123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  validateRequest(AuthValidation.loginSchema),
  AuthControllers.login,
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out current user (clears auth cookies)
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', auth('ADMIN', 'USER'), AuthControllers.logout);

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', auth('ADMIN', 'USER'), AuthControllers.getProfile);

export const AuthRoutes = router;
