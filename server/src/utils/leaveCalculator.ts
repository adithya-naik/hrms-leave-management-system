import { isWeekend, differenceInCalendarDays, eachDayOfInterval } from 'date-fns';
import { Holiday } from '@/models/Holiday';

export class LeaveCalculator {
  static async calculateLeaveDays(from: Date, to: Date): Promise<number> {
    const holidays = await Holiday.find({
      date: {
        $gte: from,
        $lte: to
      }
    });

    const holidayDates = holidays.map(h => h.date.toISOString().split('T')[0]);
    
    const daysInRange = eachDayOfInterval({ start: from, end: to });
    
    let workingDays = 0;
    
    for (const day of daysInRange) {
      const dayString = day.toISOString().split('T')[0];
      
      // Skip weekends and holidays
      if (!isWeekend(day) && !holidayDates.includes(dayString)) {
        workingDays++;
      }
    }
    
    return workingDays;
  }

  static async validateLeaveOverlap(userId: string, from: Date, to: Date, excludeId?: string): Promise<boolean> {
    const { LeaveRequest } = await import('@/models/LeaveRequest');
    
    const query: any = {
      userId,
      status: { $in: ['PENDING', 'APPROVED'] },
      deletedAt: null,
      $or: [
        { from: { $lte: to }, to: { $gte: from } }
      ]
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const overlappingLeave = await LeaveRequest.findOne(query);
    return !overlappingLeave;
  }

  static validateLeaveBalance(currentBalance: number, requestedDays: number): boolean {
    return currentBalance >= requestedDays;
  }
}