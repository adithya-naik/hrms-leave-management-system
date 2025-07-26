import dotenv from 'dotenv';
import connectDB from '@/config/database';
import { User } from '@/models/User';
import { Holiday } from '@/models/Holiday';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Seeding database...');

    // Clear existing data
    await User.deleteMany({});
    await Holiday.deleteMany({});

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

    await Promise.all([
      admin.save(),
      manager.save(),
      employee1.save(),
      employee2.save()
    ]);

    // Set manager for employees
    employee1.managerId = manager._id.toString();
    employee2.managerId = manager._id.toString();
    await Promise.all([employee1.save(), employee2.save()]);

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
      }
    ];

    await Holiday.insertMany(holidays);

    console.log('✅ Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Admin: admin@company.com / admin123');
    console.log('Manager: manager@company.com / manager123');
    console.log('Employee: john@company.com / employee123');
    console.log('Employee: jane@company.com / employee123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();