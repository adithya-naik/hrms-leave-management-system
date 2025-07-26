import mongoose, { Schema } from 'mongoose';
import { IHoliday } from '@/types';

const holidaySchema = new Schema<IHoliday>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['NATIONAL', 'REGIONAL', 'COMPANY'],
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300
  }
}, {
  timestamps: true
});

// Indexes
holidaySchema.index({ date: 1 });
holidaySchema.index({ type: 1 });

export const Holiday = mongoose.model<IHoliday>('Holiday', holidaySchema);