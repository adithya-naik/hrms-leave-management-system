import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().min(1, 'Department is required'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional()
});

export const leaveRequestSchema = z.object({
  leaveType: z.enum(['SICK', 'CASUAL', 'VACATION', 'ACADEMIC', 'WFH', 'COMP_OFF']),
  from: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid from date'),
  to: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid to date'),
  reason: z.string().min(1, 'Reason is required').max(500)
});

export const leaveUpdateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  comment: z.string().max(200).optional()
});