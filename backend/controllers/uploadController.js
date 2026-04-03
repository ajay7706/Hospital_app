exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Multer-storage-cloudinary automatically uploads to Cloudinary
    // and provides the secure_url in req.file.path
    res.json({
      msg: "Image uploaded successfully",
      imageUrl: req.file.path,
      publicId: req.file.filename
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
