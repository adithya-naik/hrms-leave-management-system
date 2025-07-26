// src/routes/test.ts
import express from 'express';
import { emailService } from '../services/emailService';

const router = express.Router();

router.post('/test-email', async (req, res) => {
  try {
    const success = await emailService.sendEmail({
      to: 'your-email@example.com',
      subject: 'Test Email from HRMS',
      html: '<h1>Test Email</h1><p>If you receive this, Resend is working correctly!</p>'
    });

    res.json({
      success,
      message: success ? 'Email sent successfully' : 'Email failed to send'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
