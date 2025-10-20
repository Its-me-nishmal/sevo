const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config({ path: './backend/config/config.env' });

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const useCloudinary = CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET &&
                      CLOUDINARY_CLOUD_NAME !== 'YOUR_CLOUDINARY_CLOUD_NAME_HERE' &&
                      CLOUDINARY_API_KEY !== 'YOUR_CLOUDINARY_API_KEY_HERE' &&
                      CLOUDINARY_API_SECRET !== 'YOUR_CLOUDINARY_API_SECRET_HERE';

if (useCloudinary) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (useCloudinary) {
      cb(null, './temp'); // Cloudinary will handle the actual storage, multer needs a temp dir
    } else {
      cb(null, './uploads/profiles');
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  },
});

function checkFileType(file, cb) {
  const allowedExts = /jpeg|jpg|png|gif/;
  const allowedMimeTypes = /image\/jpeg|image\/jpg|image\/png|image\/gif/;
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.test(file.mimetype);
  if (mimetype && extname) return cb(null, true);
  cb('Error: Images Only!');
}

const uploadProfilePhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => checkFileType(file, cb),
}).single('profilePhoto'); // 'profilePhoto' is the field name for the file input

module.exports = { uploadProfilePhoto, useCloudinary, cloudinary };