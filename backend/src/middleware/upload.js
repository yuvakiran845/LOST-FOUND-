const multer = require('multer');

/**
 * Multer upload middleware using memory storage.
 *
 * We store the file in memory (as a Buffer) instead of disk,
 * then pipe it to Cloudinary in the controller using upload_stream.
 *
 * This avoids writing temp files and simplifies cleanup.
 */
const upload = multer({
  // Store file in memory, not on disk
  storage: multer.memoryStorage(),

  // Limit to 5 MB per file
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  // Only allow image files
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpg, png, webp)'), false);
    }
  },
});

/**
 * Express error handler for Multer-specific errors.
 *
 * Use this AFTER upload middleware in routes:
 *   router.post('/', protect, upload.single('image'), handleUploadError, createItem)
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Image is too large. Maximum size is 5 MB.',
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

module.exports = { upload, handleUploadError };
