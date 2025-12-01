const express = require('express');
const auth = require('../middleware/auth');
const { sendTestEmail } = require('../utils/email');

const router = express.Router();

router.use(auth);

router.post('/test', async (req, res) => {
  try {
    const { to } = req.body;
    const target = to || req.user.email;
    await sendTestEmail(target);
    res.json({ message: `Test email queued to ${target}` });
  } catch (error) {
    console.error('Test email error', error);
    res.status(500).json({ message: 'Failed to send test email', error: error.message });
  }
});

module.exports = router;
