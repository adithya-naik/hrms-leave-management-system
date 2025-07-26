import { User } from '../models/User';

export const generateEmployeeId = async (department: string): Promise<string> => {
  const deptCode = getDepartmentCode(department);
  const year = new Date().getFullYear().toString().slice(-2);
  
  // Find the highest employee ID for this department and year
  const regex = new RegExp(`^${deptCode}${year}\\d{3}$`);
  const lastEmployee = await User.findOne({
    employeeId: { $regex: regex }
  }).sort({ employeeId: -1 });

  let sequence = 1;
  if (lastEmployee) {
    const lastSequence = parseInt(lastEmployee.employeeId.slice(-3));
    sequence = lastSequence + 1;
  }

  return `${deptCode}${year}${sequence.toString().padStart(3, '0')}`;
};

export const formatUserResponse = (user: any) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  return userObj;
};

export const getDepartmentCode = (department: string): string => {
  const codes: { [key: string]: string } = {
    'Engineering': 'ENG',
    'Marketing': 'MKT',
    'HR': 'HR',
    'Finance': 'FIN',
    'Operations': 'OPS',
    'Sales': 'SAL',
    'IT': 'IT',
    'Design': 'DSN',
    'Quality Assurance': 'QA',
    'Research': 'RES'
  };
  
  return codes[department] || department.substring(0, 3).toUpperCase();
};

export const calculateLeaveDays = (fromDate: Date, toDate: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  
  return Math.round(Math.abs((to.getTime() - from.getTime()) / oneDay)) + 1;
};

export const isValidLeaveBalance = (leaveType: string, days: number, userBalances: any): boolean => {
  const balanceMap: { [key: string]: string } = {
    'SICK': 'sick',
    'CASUAL': 'casual',
    'VACATION': 'vacation',
    'ACADEMIC': 'academic'
  };
  
  const balanceKey = balanceMap[leaveType];
  if (!balanceKey) return true; // WFH and COMP_OFF don't have balance checks
  
  return userBalances[balanceKey] >= days;
};

export const sanitizeUserData = (userData: any) => {
  const sanitized = { ...userData };
  delete sanitized.password;
  delete sanitized.__v;
  return sanitized;
};
