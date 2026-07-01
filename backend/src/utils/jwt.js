const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'your_secret_key';
const EXPIRY = process.env.JWT_EXPIRY || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, SECRET, {
    expiresIn: EXPIRY,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    throw new Error('Token tidak valid atau sudah expired');
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
