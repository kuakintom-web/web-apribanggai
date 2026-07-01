const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadDir, req.user?.id || 'temp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${uuid.v4()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFormats = (process.env.ALLOWED_FORMATS || 'pdf,jpg,jpeg,png,doc,docx').split(',');
  const ext = path.extname(file.originalname).slice(1).toLowerCase();

  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Format file tidak diizinkan: ${ext}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || 10485760),
  },
});

module.exports = upload;
