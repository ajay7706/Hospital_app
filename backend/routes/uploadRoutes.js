const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');

// Route to upload image - protected by auth middleware
// Support both 'image' and 'file' field names
router.post('/image', protect, upload.single('image'), uploadImage);
router.post('/', protect, upload.single('file'), uploadImage);

module.exports = router;
