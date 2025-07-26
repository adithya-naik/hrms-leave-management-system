import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { generateEmployeeId } from '../utils/helpers';
import { LeaveRequest } from '../models/LeaveRequest';
import { emailService } from '../services/emailService';

interface AuthRequest extends Request {
  user?: any;
}

// Get all users with filtering and pagination
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      department,
      role,
      status
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department && department !== 'all') {
      filter.department = department;
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status && status !== 'all') {
      filter.isActive = status === 'active';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(filter)
      .populate('managerId', 'firstName lastName employeeId')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

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
      message: 'Failed to fetch users'
    });
  }
};

// Get single user by ID
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id)
      .populate('managerId', 'firstName lastName employeeId')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

// Get current user
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    const user = await User.findById(userId)
      .populate('managerId', 'firstName lastName employeeId')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure leave balances exist with defaults
    if (!user.leaveBalances || Object.keys(user.leaveBalances).length === 0) {
      user.leaveBalances = {
        vacation: 21,
        sick: 12,
        casual: 12,
        academic: 5
      };
      await user.save();
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data'
    });
  }
};

// Create new user
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role = 'EMPLOYEE',
      department,
      managerId,
      leaveBalances
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate employee ID
    const employeeId = await generateEmployeeId(department);

    // Check if employee ID already exists
    const existingEmployeeId = await User.findOne({ employeeId });
    if (existingEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Generated employee ID already exists. Please try again.'
      });
    }

    // Validate manager if provided
    if (managerId && managerId !== 'none' && !mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid manager ID'
      });
    }

    if (managerId && managerId !== 'none') {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Manager not found'
        });
      }
    }

    // Generate temporary password if not provided
    const tempPassword = password || crypto.randomBytes(8).toString('hex');

    // Create user data
    const userData: any = {
      firstName,
      lastName,
      email,
      password: tempPassword, // Will be hashed by pre-save middleware
      employeeId,
      role,
      department,
      managerId: managerId === 'none' ? null : managerId,
      leaveBalances: leaveBalances || {
        sick: 12,
        casual: 12,
        vacation: 21,
        academic: 5
      }
    };

    const user = new User(userData);
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(
        email,
        `${firstName} ${lastName}`,
        tempPassword,
        employeeId,
        department
      );
      console.log(`📧 Welcome email sent to: ${email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail user creation if email fails
    }

    const populatedUser = await User.findById(user._id)
      .populate('managerId', 'firstName lastName employeeId')
      .select('-password');

    res.status(201).json({
      success: true,
      message: 'User created successfully and welcome email sent',
      data: populatedUser
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData.employeeId;

    // Handle managerId
    if (updateData.managerId === 'none') {
      updateData.managerId = null;
    }

    // Validate manager if provided
    if (updateData.managerId && updateData.managerId !== user.managerId?.toString()) {
      if (!mongoose.Types.ObjectId.isValid(updateData.managerId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager ID'
        });
      }

      const manager = await User.findById(updateData.managerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Manager not found'
        });
      }
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email,
        _id: { $ne: id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('managerId', 'firstName lastName employeeId')
      .select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

// Update user password
export const updateUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password'
    });
  }
};

// Soft delete user (deactivate)
export const deactivateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deactivation
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user'
    });
  }
};

// Activate user
export const activateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'User activated successfully'
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user'
    });
  }
};

// Hard delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Get managers for dropdown
export const getManagers = async (req: AuthRequest, res: Response) => {
  try {
    const managers = await User.find({
      role: { $in: ['MANAGER', 'ADMIN'] },
      isActive: true
    })
      .select('firstName lastName employeeId')
      .sort({ firstName: 1 });

    res.json({
      success: true,
      data: managers
    });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch managers'
    });
  }
};

// Get all users with detailed information
export const getAllUsersWithDetails = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      department,
      role,
      status
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department && department !== 'all') {
      filter.department = department;
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status && status !== 'all') {
      filter.isActive = status === 'active';
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Fetch users with populated manager details
    const users = await User.find(filter)
      .populate({
        path: 'managerId',
        select: 'firstName lastName employeeId email department',
        match: { isActive: true } // Only populate active managers
      })
      .select('-password') // Exclude password field
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    // Calculate additional stats for each user using aggregation for better performance
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        
        try {
          // Use Promise.all for parallel queries for better performance
          const [
            totalLeaveRequests,
            pendingLeaves,
            approvedLeaves,
            rejectedLeaves,
            // Get recent leave requests
            recentLeaves
          ] = await Promise.all([
            LeaveRequest.countDocuments({
              userId: user._id,
              deletedAt: null
            }),
            LeaveRequest.countDocuments({
              userId: user._id,
              status: 'PENDING',
              deletedAt: null
            }),
            LeaveRequest.countDocuments({
              userId: user._id,
              status: 'APPROVED',
              deletedAt: null
            }),
            LeaveRequest.countDocuments({
              userId: user._id,
              status: 'REJECTED',
              deletedAt: null
            }),
            LeaveRequest.find({
              userId: user._id,
              deletedAt: null
            })
              .sort({ createdAt: -1 })
              .limit(3)
              .select('leaveType status from to days createdAt')
          ]);

          // Calculate total leave balance from your schema
          const leaveBalances = userObj.leaveBalances || {
            vacation: 21,
            sick: 12,
            casual: 12,
            academic: 5
          };

          const totalLeaveBalance = leaveBalances.vacation + 
                                  leaveBalances.sick + 
                                  leaveBalances.casual + 
                                  leaveBalances.academic;

          // Calculate used leave days (approved leaves)
          const usedLeaveDays = await LeaveRequest.aggregate([
            {
              $match: {
                userId: user._id,
                status: 'APPROVED',
                deletedAt: null
              }
            },
            {
              $group: {
                _id: null,
                totalDays: { $sum: '$days' }
              }
            }
          ]);

          const totalUsedDays = usedLeaveDays.length > 0 ? usedLeaveDays[0].totalDays : 0;
          const remainingBalance = totalLeaveBalance - totalUsedDays;

          return {
            ...userObj,
            stats: {
              totalLeaveRequests,
              pendingLeaves,
              approvedLeaves,
              rejectedLeaves,
              totalLeaveBalance,
              totalUsedDays,
              remainingBalance,
              recentLeaves
            },
            // Add computed fields
            fullName: `${userObj.firstName} ${userObj.lastName}`,
            managerInfo: userObj.managerId ? {
              id: userObj.managerId._id,
              name: `${userObj.managerId.firstName} ${userObj.managerId.lastName}`,
              employeeId: userObj.managerId.employeeId,
              email: userObj.managerId.email
            } : null,
            // Account status info
            accountInfo: {
              isActive: userObj.isActive,
              lastLogin: userObj.lastLogin,
              memberSince: userObj.createdAt,
              lastUpdated: userObj.updatedAt
            }
          };
        } catch (leaveError) {
          console.error(`Error fetching leave stats for user ${user._id}:`, leaveError);
          
          // Return user with default stats if leave requests fail
          const leaveBalances = userObj.leaveBalances || {
            vacation: 21,
            sick: 12,
            casual: 12,
            academic: 5
          };

          return {
            ...userObj,
            stats: {
              totalLeaveRequests: 0,
              pendingLeaves: 0,
              approvedLeaves: 0,
              rejectedLeaves: 0,
              totalLeaveBalance: leaveBalances.vacation + leaveBalances.sick + leaveBalances.casual + leaveBalances.academic,
              totalUsedDays: 0,
              remainingBalance: leaveBalances.vacation + leaveBalances.sick + leaveBalances.casual + leaveBalances.academic,
              recentLeaves: []
            },
            fullName: `${userObj.firstName} ${userObj.lastName}`,
            managerInfo: userObj.managerId ? {
              id: userObj.managerId._id,
              name: `${userObj.managerId.firstName} ${userObj.managerId.lastName}`,
              employeeId: userObj.managerId.employeeId
            } : null,
            accountInfo: {
              isActive: userObj.isActive,
              lastLogin: userObj.lastLogin,
              memberSince: userObj.createdAt,
              lastUpdated: userObj.updatedAt
            }
          };
        }
      })
    );

    // Calculate summary statistics
    const summaryStats = {
      totalUsers: total,
      activeUsers: usersWithStats.filter(user => user.isActive).length,
      inactiveUsers: usersWithStats.filter(user => !user.isActive).length,
      totalPendingLeaves: usersWithStats.reduce((sum, user) => sum + user.stats.pendingLeaves, 0),
      departmentBreakdown: usersWithStats.reduce((acc, user) => {
        acc[user.department] = (acc[user.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      roleBreakdown: usersWithStats.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      data: usersWithStats,
      summary: summaryStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get all users with details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get dashboard stats
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalEmployees = await User.countDocuments({ isActive: true });
    
    // Import LeaveRequest model if exists
    let pendingApprovals = 0;
    let totalLeaveRequests = 0;
    let approvedThisMonth = 0;
    let rejectedThisMonth = 0;

    try {
      const LeaveRequest = mongoose.model('LeaveRequest');
      pendingApprovals = await LeaveRequest.countDocuments({ status: 'PENDING' });
      totalLeaveRequests = await LeaveRequest.countDocuments();
      
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      approvedThisMonth = await LeaveRequest.countDocuments({
        status: 'APPROVED',
        updatedAt: { $gte: currentMonth }
      });
      
      rejectedThisMonth = await LeaveRequest.countDocuments({
        status: 'REJECTED',
        updatedAt: { $gte: currentMonth }
      });
    } catch (error) {
      // LeaveRequest model might not exist yet
      console.log('LeaveRequest model not found, using default stats');
    }

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
      message: 'Failed to fetch dashboard stats'
    });
  }
};
