import mongoose, { Schema } from 'mongoose';
import { ILeaveRequest, LeaveStatus, LeaveType } from '@/types';

const leaveRequestSchema = new Schema<ILeaveRequest>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: String,
    enum: Object.values(['SICK', 'CASUAL', 'VACATION', 'ACADEMIC', 'WFH', 'COMP_OFF'] as LeaveType[]),
    required: true
  },
  from: {
    type: Date,
    required: true
  },
  to: {
    type: Date,
    required: true
  },
  days: {
    type: Number,
    required: true,
    min: 0.5
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: Object.values(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as LeaveStatus[]),
    default: 'PENDING'
  },
  approverId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  history: [{
    action: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'UPDATED'],
      required: true
    },
    by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    at: {
      type: Date,
      default: Date.now
    },
    comment: {
      type: String,
      maxlength: 200
    }
  }],
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
leaveRequestSchema.index({ userId: 1, createdAt: -1 });
leaveRequestSchema.index({ status: 1, createdAt: -1 });
leaveRequestSchema.index({ approverId: 1 });
leaveRequestSchema.index({ from: 1, to: 1 });
leaveRequestSchema.index({ deletedAt: 1 });

// Compound index for overlap detection
leaveRequestSchema.index({ 
  userId: 1, 
  from: 1, 
  to: 1, 
  status: 1,
  deletedAt: 1 
});

// Virtual for populated user data
leaveRequestSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

leaveRequestSchema.virtual('approver', {
  ref: 'User',
  localField: 'approverId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON output
leaveRequestSchema.set('toJSON', { virtuals: true });

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);