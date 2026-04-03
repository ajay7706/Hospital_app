const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');

// Route to upload image - protected by auth middleware
// 'image' is the field name in the form-data
router.post('/image', protect, upload.single('image'), uploadImage);

module.exports = router;
