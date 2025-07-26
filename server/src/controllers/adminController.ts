import { Response } from 'express';
import { User } from '../models/User';
import { LeaveRequest } from '../models/LeaveRequest';
import { Holiday } from '../models/Holiday';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const [
      totalEmployees,
      pendingApprovals,
      totalLeaveRequests,
      approvedThisMonth,
      rejectedThisMonth
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      LeaveRequest.countDocuments({ status: 'PENDING', deletedAt: null }),
      LeaveRequest.countDocuments({ deletedAt: null }),
      LeaveRequest.countDocuments({
        status: 'APPROVED',
        updatedAt: { $gte: currentMonth, $lt: nextMonth },
        deletedAt: null
      }),
      LeaveRequest.countDocuments({
        status: 'REJECTED',
        updatedAt: { $gte: currentMonth, $lt: nextMonth },
        deletedAt: null
      })
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        pendingApprovals,
        totalLeaveRequests,
        approvedThisMonth,
        rejectedThisMonth
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, department, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = { isActive: true };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department && department !== 'all') {
      query.department = department;
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('managerId', 'firstName lastName employeeId')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow password updates through this endpoint
    delete updates.password;
    delete updates._id;
    delete updates.__v;

    // Validate user exists first
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deactivation
    if (updates.isActive === false && existingUser._id.toString() === req.user?.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('managerId', 'firstName lastName employeeId')
      .select('-password');

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map((err: any) => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email or Employee ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getHolidays = async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.query;
    
    let query: any = {};
    
    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      query.date = { $gte: startOfYear, $lte: endOfYear };
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });

    res.json({
      success: true,
      data: holidays
    });
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const { name, date, type, description } = req.body;

    // Validate required fields
    if (!name || !date) {
      return res.status(400).json({
        success: false,
        message: 'Name and date are required'
      });
    }

    // Check if holiday already exists on this date
    const existingHoliday = await Holiday.findOne({ date: new Date(date) });
    if (existingHoliday) {
      return res.status(400).json({
        success: false,
        message: 'A holiday already exists on this date'
      });
    }

    const holiday = new Holiday({
      name,
      date: new Date(date),
      type: type || 'PUBLIC',
      description
    });

    await holiday.save();

    res.status(201).json({
      success: true,
      data: holiday,
      message: 'Holiday created successfully'
    });
  } catch (error) {
    console.error('Create holiday error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map((err: any) => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
