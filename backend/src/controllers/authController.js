const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

const createToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET missing');
  }

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    secret,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      authProvider: 'local',
    });

    const token = createToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, hasAssignedGift: user.hasAssignedGift },
    });
  } catch (error) {
    console.error('Register error', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, hasAssignedGift: user.hasAssignedGift } });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(500).json({ message: 'Google OAuth not configured' });
    }

    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing credential' });
    }

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId });
    const payload = ticket.getPayload();
    const email = payload.email?.toLowerCase();
    const name = payload.name || payload.given_name || 'Secret Santa user';

    if (!email) {
      return res.status(400).json({ message: 'Unable to read Google profile' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, authProvider: 'google' });
    }

    const token = createToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, hasAssignedGift: user.hasAssignedGift } });
  } catch (error) {
    console.error('Google login error', error);
    res.status(500).json({ message: 'Google login failed' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email hasAssignedGift');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasAssignedGift: user.hasAssignedGift,
      },
    });
  } catch (error) {
    console.error('Me endpoint error', error);
    res.status(500).json({ message: 'Failed to load user profile' });
  }
};
