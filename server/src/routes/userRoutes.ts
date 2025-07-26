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
  getDashboardStats,
  getAllUsersWithDetails
} from '../controllers/userController';
import { authenticate, requireAdmin, requireManagerOrAdmin } from '../middleware/auth';
import { validateUser, validateUserUpdate, validatePasswordUpdate } from '../middleware/validation';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ==========================================
// SPECIFIC ROUTES MUST COME FIRST!
// ==========================================

// Dashboard stats (admin/manager only)
router.get('/dashboard-stats', requireAdmin, getDashboardStats);

// Get current user (available to all authenticated users)
router.get('/me', getCurrentUser);

// Get managers (for dropdowns)
router.get('/managers', getManagers);

// Get all users with details - MUST BE BEFORE /:id route
router.get('/all-details', requireAdmin, getAllUsersWithDetails);

// ==========================================
// PARAMETERIZED ROUTES COME LAST!
// ==========================================

// CRUD operations (admin only)
router.get('/', requireAdmin, getUsers);
router.get('/:id', requireAdmin, getUserById); // This MUST come after specific routes
router.post('/', requireAdmin, validateUser, createUser);
router.put('/:id', requireAdmin, validateUserUpdate, updateUser);
router.put('/:id/password', requireAdmin, validatePasswordUpdate, updateUserPassword);
router.put('/:id/deactivate', requireAdmin, deactivateUser);
router.put('/:id/activate', requireAdmin, activateUser);
router.delete('/:id', requireAdmin, deleteUser);

export default router;
