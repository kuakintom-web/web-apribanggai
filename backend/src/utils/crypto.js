const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const generateRegistrationNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `APRIREG-${new Date().getFullYear()}-${timestamp}${random}`;
};

const generateBlangkoNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BLK-${new Date().getFullYear()}-${timestamp}${random}`;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateRegistrationNumber,
  generateBlangkoNumber,
};
