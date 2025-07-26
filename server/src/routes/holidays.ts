import { Router } from 'express';
import { getHolidays, createHoliday } from '@/controllers/adminController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getHolidays);
router.post('/', authorize('ADMIN'), createHoliday);

export default router;