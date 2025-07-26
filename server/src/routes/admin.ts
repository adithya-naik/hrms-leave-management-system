import { Router } from 'express';
import {
  getDashboardStats,
  getUsers,
  updateUser,
  getHolidays,
  createHoliday
} from '../controllers/adminController';
import { authenticate, authorize, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication first
router.use(authenticate);

// Admin dashboard - accessible by both ADMIN and MANAGER
router.get('/dashboard', authorize('ADMIN', 'MANAGER'), getDashboardStats);

// User management - accessible by both ADMIN and MANAGER
router.get('/users', authorize('ADMIN', 'MANAGER'), getUsers);

// User update - ADMIN only
router.patch('/users/:id', requireAdmin, updateUser);

// Holiday management
router.get('/holidays', authorize('ADMIN', 'MANAGER'), getHolidays);
router.post('/holidays', requireAdmin, createHoliday);

export default router;
