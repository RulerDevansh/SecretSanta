const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const router = express.Router();

// GET /api/diag/db - quick DB connectivity and status
router.get('/db', async (_req, res) => {
  try {
    await connectDB();
    const stateIdx = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting', 'uninitialized'];
    const state = states[stateIdx] || String(stateIdx);

    res.json({
      ok: true,
      state,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.models || {}),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
