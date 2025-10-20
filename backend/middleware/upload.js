const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  },
});

function checkFileType(file, cb) {
  const allowedExts = /mp3|wav|m4a|webm|ogg/; // added ogg
  const allowedMimeTypes = /audio\/mpeg|audio\/wav|audio\/x-m4a|audio\/webm|audio\/ogg/;
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.test(file.mimetype);
  if (mimetype && extname) return cb(null, true);
  cb('Error: Audio Files Only!');
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => checkFileType(file, cb),
});

module.exports = { upload, checkFileType };
