import { Router } from 'express';
import {
  getDashboardStats,
  getUsers,
  updateUser,
  getHolidays,
  createHoliday
} from '@/controllers/adminController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.patch('/users/:id', authorize('ADMIN'), updateUser);

// Holiday management
router.get('/holidays', getHolidays);
router.post('/holidays', authorize('ADMIN'), createHoliday);

export default router;