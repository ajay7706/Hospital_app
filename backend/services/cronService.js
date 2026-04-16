const cron = require('node-cron');
const Appointment = require('../models/Appointment');

// Run every night at midnight (00:00)
const initCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running Day-End Appointment Cleanup...');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // 1. Mark 'approved' (confirmed) from yesterday that are over
      await Appointment.updateMany(
        { date: yesterdayStr, status: 'Confirmed' },
        { status: 'Completed' }
      );

      // 2. Mark remaining 'Waiting' or 'pending' as 'Not Selected Today'
      await Appointment.updateMany(
        { date: yesterdayStr, status: { $in: ['Waiting', 'pending'] } },
        { status: 'Not Selected Today' }
      );

      console.log('Cleanup completed successfully.');
    } catch (error) {
      console.error('Cleanup job failed:', error);
    }
  });
};

module.exports = { initCronJobs };
