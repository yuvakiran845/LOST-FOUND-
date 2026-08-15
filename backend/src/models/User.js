const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,   // normalize: "Yuva@Gmail.com" → "yuva@gmail.com"
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,     // NEVER return password in query results by default
    },
  },
  {
    timestamps: true,    // adds createdAt and updatedAt automatically
  }
);

// ─── Pre-save Hook ────────────────────────────────────────────────────────
// Runs before every .save() call.
// Only hashes the password if it was modified (avoids re-hashing on profile updates).
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // saltRounds = 10 is a good balance between security and speed
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Method ──────────────────────────────────────────────────────
// Compare a plain-text password against the stored hash.
// Used in the login controller.
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
