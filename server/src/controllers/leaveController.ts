import { Response } from 'express';
import { LeaveRequest } from '@/models/LeaveRequest';
import { User } from '@/models/User';
import { AuthRequest, LeaveType } from '@/types';
import { LeaveCalculator } from '@/utils/leaveCalculator';

export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { leaveType, from, to, reason } = req.body;
    const userId = req.user?.userId!;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Validate dates
    if (fromDate >= toDate) {
      return res.status(400).json({
        success: false,
        message: 'From date must be before to date'
      });
    }

    if (fromDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply for leave in the past'
      });
    }

    // Calculate leave days
    const days = await LeaveCalculator.calculateLeaveDays(fromDate, toDate);

    if (days === 0) {
      return res.status(400).json({
        success: false,
        message: 'No working days in the selected date range'
      });
    }

    // Check for overlapping leaves
    const isValidRange = await LeaveCalculator.validateLeaveOverlap(userId, fromDate, toDate);
    if (!isValidRange) {
      return res.status(400).json({
        success: false,
        message: 'Leave request overlaps with existing leave'
      });
    }

    // Get user and check balance (except for WFH)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (leaveType !== 'WFH') {
      const balanceKey = leaveType.toLowerCase() as keyof typeof user.leaveBalances;
      const currentBalance = user.leaveBalances[balanceKey];
      
      if (!LeaveCalculator.validateLeaveBalance(currentBalance, days)) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType.toLowerCase()} leave balance. Available: ${currentBalance} days`
        });
      }
    }

    // Create leave request
    const leaveRequest = new LeaveRequest({
      userId,
      leaveType,
      from: fromDate,
      to: toDate,
      days,
      reason,
      history: [{
        action: 'PENDING',
        by: userId,
        at: new Date()
      }]
    });

    await leaveRequest.save();

    // Populate user data
    await leaveRequest.populate('userId', 'firstName lastName employeeId department');

    res.status(201).json({
      success: true,
      data: leaveRequest,
      message: 'Leave request created successfully'
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const userRole = req.user?.role!;
    const { page = 1, limit = 10, status, leaveType, startDate, endDate } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    // Build query based on user role
    let query: any = { deletedAt: null };

    if (userRole === 'EMPLOYEE') {
      query.userId = userId;
    } else if (userRole === 'MANAGER') {
      // Manager can see their team's requests
      const teamMembers = await User.find({ managerId: userId }).select('_id');
      const teamIds = teamMembers.map(member => member._id);
      teamIds.push(userId); // Include manager's own requests
      query.userId = { $in: teamIds };
    }
    // ADMIN can see all requests (no additional filter)

    // Apply filters
    if (status) {
      query.status = status;
    }
    if (leaveType) {
      query.leaveType = leaveType;
    }
    if (startDate && endDate) {
      query.from = { $gte: new Date(startDate as string) };
      query.to = { $lte: new Date(endDate as string) };
    }

    const [leaveRequests, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('userId', 'firstName lastName employeeId department')
        .populate('approverId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LeaveRequest.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: leaveRequests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const userId = req.user?.userId!;
    const userRole = req.user?.role!;

    const leaveRequest = await LeaveRequest.findById(id).populate('userId');
    
    if (!leaveRequest || leaveRequest.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Authorization check
    if (userRole === 'EMPLOYEE' && leaveRequest.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own leave requests'
      });
    }

    // Employees can only cancel their own pending requests
    if (userRole === 'EMPLOYEE' && status && status !== 'CANCELLED') {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your leave requests'
      });
    }

    if (userRole === 'EMPLOYEE' && leaveRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending leave requests'
      });
    }

    // Update leave request
    if (status) {
      leaveRequest.status = status;
      
      if (status === 'APPROVED' || status === 'REJECTED') {
        leaveRequest.approverId = userId;
        
        // Update user balance if approved (except WFH)
        if (status === 'APPROVED' && leaveRequest.leaveType !== 'WFH') {
          const user = await User.findById(leaveRequest.userId);
          if (user) {
            const balanceKey = leaveRequest.leaveType.toLowerCase() as keyof typeof user.leaveBalances;
            user.leaveBalances[balanceKey] -= leaveRequest.days;
            await user.save();
          }
        }
      }
    }

    // Add to history
    leaveRequest.history.push({
      action: status || 'UPDATED',
      by: userId,
      at: new Date(),
      comment
    });

    await leaveRequest.save();

    res.json({
      success: true,
      data: leaveRequest,
      message: 'Leave request updated successfully'
    });
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId!;
    const userRole = req.user?.role!;

    const leaveRequest = await LeaveRequest.findById(id);
    
    if (!leaveRequest || leaveRequest.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Authorization check
    if (userRole === 'EMPLOYEE' && leaveRequest.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own leave requests'
      });
    }

    // Soft delete
    leaveRequest.deletedAt = new Date();
    await leaveRequest.save();

    res.json({
      success: true,
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    console.error('Delete leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};