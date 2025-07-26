import { Document } from 'mongoose';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type LeaveType = 'SICK' | 'CASUAL' | 'VACATION' | 'ACADEMIC' | 'WFH' | 'COMP_OFF';
export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  employeeId: string;
  role: UserRole;
  department: string;
  managerId?: string;
  leaveBalances: {
    sick: number;
    casual: number;
    vacation: number;
    academic: number;
  };
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ILeaveRequest extends Document {
  userId: string;
  leaveType: LeaveType;
  from: Date;
  to: Date;
  days: number;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  history: {
    action: LeaveStatus | 'UPDATED';
    by: string;
    at: Date;
    comment?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IHoliday extends Document {
  name: string;
  date: Date;
  type: 'NATIONAL' | 'REGIONAL' | 'COMPANY';
  description?: string;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
  };
}