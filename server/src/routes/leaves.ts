import { Router } from 'express';
import {
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveRequest,
  deleteLeaveRequest
} from '@/controllers/leaveController';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, leaveRequestSchema, leaveUpdateSchema } from '@/middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getLeaveRequests);
router.post('/', validate(leaveRequestSchema), createLeaveRequest);
router.patch('/:id', validate(leaveUpdateSchema), updateLeaveRequest);
router.delete('/:id', deleteLeaveRequest);

export default router;