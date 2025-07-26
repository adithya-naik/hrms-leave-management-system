// Run this script to update existing users with default leave balances
const mongoose = require('mongoose');
const User = require('../src/models/User').User;

const migrateUserBalances = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = await User.find({
      $or: [
        { leaveBalances: { $exists: false } },
        { 'leaveBalances.vacation': { $exists: false } },
        { 'leaveBalances.sick': { $exists: false } },
        { 'leaveBalances.casual': { $exists: false } },
        { 'leaveBalances.academic': { $exists: false } }
      ]
    });

    console.log(`Found ${users.length} users to update`);

    for (const user of users) {
      user.leaveBalances = {
        vacation: user.leaveBalances?.vacation ?? 21,
        sick: user.leaveBalances?.sick ?? 12,
        casual: user.leaveBalances?.casual ?? 12,
        academic: user.leaveBalances?.academic ?? 5
      };
      
      await user.save();
      console.log(`Updated user: ${user.email}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

migrateUserBalances();
