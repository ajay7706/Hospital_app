const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === 'application/pdf';
    return {
      folder: 'hospital_app',
      format: isPDF ? 'pdf' : 'jpg', // Convert images to jpg for consistency
      resource_type: 'auto',
      public_id: `${file.fieldname}-${Date.now()}`,
      transformation: isPDF ? [] : [{ quality: 'auto', fetch_format: 'auto' }]
    };
  },
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/jpg',
      'application/pdf'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.');
      error.status = 400; // Hint for error handler
      cb(error, false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = { cloudinary, upload };

