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

// Auth validation schemas
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

// Leave request validation schemas
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

// User management validation schemas
export const createUserSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),
  email: z.string()
    .email('Valid email is required')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN'])
    .optional()
    .default('EMPLOYEE'),
  department: z.string()
    .min(1, 'Department is required')
    .trim(),
  managerId: z.string()
    .optional()
    .refine(val => !val || val === 'none' || z.string().regex(/^[0-9a-fA-F]{24}$/).safeParse(val).success, 'Invalid manager ID'),
  leaveBalances: z.object({
    sick: z.number().min(0).default(12),
    casual: z.number().min(0).default(12),
    vacation: z.number().min(0).default(21),
    academic: z.number().min(0).default(5)
  }).optional(),
  isActive: z.boolean().optional().default(true)
});

export const updateUserSchema = z.object({
  firstName: z.string()
    .min(1, 'First name cannot be empty')
    .max(50, 'First name must be less than 50 characters')
    .trim()
    .optional(),
  lastName: z.string()
    .min(1, 'Last name cannot be empty')
    .max(50, 'Last name must be less than 50 characters')
    .trim()
    .optional(),
  email: z.string()
    .email('Valid email is required')
    .toLowerCase()
    .trim()
    .optional(),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN'])
    .optional(),
  department: z.string()
    .min(1, 'Department cannot be empty')
    .trim()
    .optional(),
  managerId: z.string()
    .optional()
    .refine(val => !val || val === 'none' || z.string().regex(/^[0-9a-fA-F]{24}$/).safeParse(val).success, 'Invalid manager ID'),
  leaveBalances: z.object({
    sick: z.number().min(0).optional(),
    casual: z.number().min(0).optional(),
    vacation: z.number().min(0).optional(),
    academic: z.number().min(0).optional()
  }).optional(),
  isActive: z.boolean().optional()
});

export const updatePasswordSchema = z.object({
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters long')
});

// Validation middleware functions
export const validateUser = validate(createUserSchema);
export const validateUserUpdate = validate(updateUserSchema);
export const validatePasswordUpdate = validate(updatePasswordSchema);
export const validateLogin = validate(loginSchema);
export const validateRegister = validate(registerSchema);
export const validateLeaveRequest = validate(leaveRequestSchema);
export const validateLeaveUpdate = validate(leaveUpdateSchema);
