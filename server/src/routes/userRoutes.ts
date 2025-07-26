import express from 'express';
import {
  getUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  updateUserPassword,
  deactivateUser,
  activateUser,
  deleteUser,
  getManagers,
  getDashboardStats
} from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateUser, validateUserUpdate, validatePasswordUpdate } from '../middleware/validation';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Dashboard stats (admin/manager only)
router.get('/dashboard-stats', requireAdmin, getDashboardStats);

// Get current user (available to all authenticated users)
router.get('/me', getCurrentUser);

// Get managers (for dropdowns)
router.get('/managers', getManagers);

// CRUD operations (admin only)
router.get('/', requireAdmin, getUsers);
router.get('/:id', requireAdmin, getUserById);
router.post('/', requireAdmin, validateUser, createUser);
router.put('/:id', requireAdmin, validateUserUpdate, updateUser);
router.put('/:id/password', requireAdmin, validatePasswordUpdate, updateUserPassword);
router.put('/:id/deactivate', requireAdmin, deactivateUser);
router.put('/:id/activate', requireAdmin, activateUser);
router.delete('/:id', requireAdmin, deleteUser);

export default router;
