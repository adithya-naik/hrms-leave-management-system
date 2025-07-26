import dotenv from 'dotenv';
import connectDB from '@/config/database';
import { User } from '@/models/User';
import { Holiday } from '@/models/Holiday';
import { LeaveRequest } from '@/models/LeaveRequest';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Seeding database...');

    // Clear existing data
    await User.deleteMany({});
    await Holiday.deleteMany({});
    await LeaveRequest.deleteMany({});

    // Create admin user
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@company.com',
      password: 'admin123',
      employeeId: 'ADMIN001',
      role: 'ADMIN',
      department: 'IT'
    });

    // Create manager
    const manager = new User({
      firstName: 'Manager',
      lastName: 'User',
      email: 'manager@company.com',
      password: 'manager123',
      employeeId: 'MGR001',
      role: 'MANAGER',
      department: 'HR'
    });

    // Create employees
    const employee1 = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@company.com',
      password: 'employee123',
      employeeId: 'EMP001',
      role: 'EMPLOYEE',
      department: 'Engineering'
    });

    const employee2 = new User({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@company.com',
      password: 'employee123',
      employeeId: 'EMP002',
      role: 'EMPLOYEE',
      department: 'Marketing'
    });

    const employee3 = new User({
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@company.com',
      password: 'employee123',
      employeeId: 'EMP003',
      role: 'EMPLOYEE',
      department: 'HR'
    });

    const employee4 = new User({
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob@company.com',
      password: 'employee123',
      employeeId: 'EMP004',
      role: 'EMPLOYEE',
      department: 'Finance'
    });

    await Promise.all([
      admin.save(),
      manager.save(),
      employee1.save(),
      employee2.save(),
      employee3.save(),
      employee4.save()
    ]);

    // Set manager for employees
    employee1.managerId = manager._id.toString();
    employee2.managerId = manager._id.toString();
    employee3.managerId = manager._id.toString();
    employee4.managerId = manager._id.toString();
    await Promise.all([
      employee1.save(), 
      employee2.save(), 
      employee3.save(), 
      employee4.save()
    ]);

    // Create holidays for 2024
    const holidays = [
      {
        name: 'New Year\'s Day',
        date: new Date('2024-01-01'),
        type: 'NATIONAL'
      },
      {
        name: 'Independence Day',
        date: new Date('2024-07-04'),
        type: 'NATIONAL'
      },
      {
        name: 'Christmas Day',
        date: new Date('2024-12-25'),
        type: 'NATIONAL'
      },
      {
        name: 'Company Foundation Day',
        date: new Date('2024-06-15'),
        type: 'COMPANY'
      },
      {
        name: 'Republic Day',
        date: new Date('2024-01-26'),
        type: 'NATIONAL'
      },
      {
        name: 'Gandhi Jayanti',
        date: new Date('2024-10-02'),
        type: 'NATIONAL'
      }
    ];

    await Holiday.insertMany(holidays);

    // Create sample leave requests
    const leaveRequests = [
      {
        userId: employee1._id,
        leaveType: 'VACATION',
        from: new Date('2024-02-15'),
        to: new Date('2024-02-19'),
        days: 5,
        reason: 'Family vacation to the mountains',
        status: 'APPROVED',
        approverId: manager._id,
        history: [
          {
            action: 'PENDING',
            by: employee1._id,
            at: new Date('2024-02-01')
          },
          {
            action: 'APPROVED',
            by: manager._id,
            at: new Date('2024-02-02'),
            comment: 'Approved for family vacation'
          }
        ]
      },
      {
        userId: employee2._id,
        leaveType: 'SICK',
        from: new Date('2024-01-22'),
        to: new Date('2024-01-22'),
        days: 1,
        reason: 'Medical appointment with specialist',
        status: 'PENDING',
        history: [
          {
            action: 'PENDING',
            by: employee2._id,
            at: new Date('2024-01-20')
          }
        ]
      },
      {
        userId: employee3._id,
        leaveType: 'CASUAL',
        from: new Date('2024-01-10'),
        to: new Date('2024-01-11'),
        days: 2,
        reason: 'Personal work - house repairs',
        status: 'REJECTED',
        approverId: manager._id,
        history: [
          {
            action: 'PENDING',
            by: employee3._id,
            at: new Date('2024-01-05')
          },
          {
            action: 'REJECTED',
            by: manager._id,
            at: new Date('2024-01-06'),
            comment: 'Insufficient notice period'
          }
        ]
      },
      {
        userId: employee4._id,
        leaveType: 'WFH',
        from: new Date('2024-01-08'),
        to: new Date('2024-01-08'),
        days: 1,
        reason: 'Working from home due to internet installation',
        status: 'APPROVED',
        approverId: manager._id,
        history: [
          {
            action: 'PENDING',
            by: employee4._id,
            at: new Date('2024-01-06')
          },
          {
            action: 'APPROVED',
            by: manager._id,
            at: new Date('2024-01-07')
          }
        ]
      },
      {
        userId: employee1._id,
        leaveType: 'ACADEMIC',
        from: new Date('2024-03-01'),
        to: new Date('2024-03-03'),
        days: 3,
        reason: 'Attending React conference for professional development',
        status: 'PENDING',
        history: [
          {
            action: 'PENDING',
            by: employee1._id,
            at: new Date('2024-02-25')
          }
        ]
      },
      {
        userId: employee2._id,
        leaveType: 'VACATION',
        from: new Date('2024-03-25'),
        to: new Date('2024-03-29'),
        days: 5,
        reason: 'Spring break with family',
        status: 'APPROVED',
        approverId: manager._id,
        history: [
          {
            action: 'PENDING',
            by: employee2._id,
            at: new Date('2024-03-10')
          },
          {
            action: 'APPROVED',
            by: manager._id,
            at: new Date('2024-03-12')
          }
        ]
      }
    ];

    await LeaveRequest.insertMany(leaveRequests);

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Created ${leaveRequests.length} sample leave requests`);
    console.log('\n📝 Test Credentials:');
    console.log('Admin: admin@company.com / admin123');
    console.log('Manager: manager@company.com / manager123');
    console.log('Employee: john@company.com / employee123');
    console.log('Employee: jane@company.com / employee123');
    console.log('Employee: alice@company.com / employee123');
    console.log('Employee: bob@company.com / employee123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();