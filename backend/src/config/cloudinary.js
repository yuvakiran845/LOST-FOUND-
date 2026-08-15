const cloudinary = require('cloudinary').v2;
const path  = require('path');
const fs    = require('fs');
const crypto = require('crypto');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Local fallback directory ───────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/**
 * Check whether Cloudinary is actually configured (not placeholder).
 */
const isCloudinaryConfigured = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  return (
    cloud_name && cloud_name !== 'placeholder' &&
    api_key    && api_key    !== 'placeholder' &&
    api_secret && api_secret !== 'placeholder'
  );
};

/**
 * Save buffer to local disk and return a local URL.
 * Used as a fallback when Cloudinary is not configured.
 */
const saveLocally = (buffer, mimeType = 'image/jpeg') => {
  const ext      = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  const url = `/uploads/${filename}`;
  return { url, publicId: filename };
};

/**
 * Delete a locally stored file.
 */
const deleteLocally = (publicId) => {
  try {
    const filepath = path.join(UPLOADS_DIR, publicId);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch (e) {
    console.warn(`⚠️  Local delete failed for ${publicId}:`, e.message);
  }
};

/**
 * Upload image buffer to Cloudinary, falling back to local disk if not configured.
 *
 * @param {Buffer} buffer - Image buffer from multer memoryStorage
 * @param {string} folder - Cloudinary folder name (ignored for local)
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = (buffer, folder = 'campusconnect') => {
  // Use local storage if Cloudinary is not properly configured
  if (!isCloudinaryConfigured()) {
    console.log('ℹ️  Cloudinary not configured — saving image locally.');
    return Promise.resolve(saveLocally(buffer));
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

/**
 * Delete an image — from Cloudinary or local disk depending on publicId format.
 * Local publicIds look like "uuid.jpg"; Cloudinary ones look like "folder/uuid".
 */
const deleteFromCloudinary = async (publicId) => {
  // Heuristic: if no "/" in publicId, it's a local file
  if (!publicId.includes('/')) {
    deleteLocally(publicId);
    return;
  }
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`⚠️  Cloudinary delete failed for ${publicId}:`, error.message);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  UPLOADS_DIR,
};
