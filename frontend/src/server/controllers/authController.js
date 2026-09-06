const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const store = require('../models/store');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_welfare_jwt_key_2026_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const user = await store.getUserByEmail(email.trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User account not found.'
      });
    }

    const passwordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password. Please try again.'
      });
    }

    // Attach Member details if user is mapped to a welfare member
    let memberProfile = null;
    if (user.memberId) {
      memberProfile = await store.getMemberById(user.memberId);
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      memberId: user.memberId,
      department: user.department
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        ...tokenPayload,
        memberProfile
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    let memberProfile = null;
    if (req.user.memberId) {
      memberProfile = await store.getMemberById(req.user.memberId);
    }

    res.status(200).json({
      success: true,
      user: {
        ...req.user,
        memberProfile
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Session terminated successfully.'
  });
};
