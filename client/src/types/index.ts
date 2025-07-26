export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type LeaveType = 'SICK' | 'CASUAL' | 'VACATION' | 'ACADEMIC' | 'WFH' | 'COMP_OFF';

export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  _id: string;
  userId: string;
  user?: Pick<User, '_id' | 'firstName' | 'lastName' | 'employeeId' | 'department'>;
  leaveType: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  approver?: Pick<User, '_id' | 'firstName' | 'lastName'>;
  history: {
    action: LeaveStatus | 'UPDATED';
    by: string;
    at: string;
    comment?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Holiday {
  _id: string;
  name: string;
  date: string;
  type: 'NATIONAL' | 'REGIONAL' | 'COMPANY';
  createdAt: string;
}

export interface DashboardStats {
  totalEmployees: number;
  pendingApprovals: number;
  totalLeaveRequests: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
}

export interface LeaveBalance {
  userId: string;
  leaveType: LeaveType;
  balance: number;
  used: number;
  allocated: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}