// Load environment variables from .env file before anything else
require('dotenv').config();

// This package patches Express so async errors automatically call next(error)
require('express-async-errors');

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const connectDB    = require('./config/db');
const routes       = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const { UPLOADS_DIR } = require('./config/cloudinary');

// ─── Connect to MongoDB ────────────────────────────────────────────────────
connectDB();

// ─── Create Express App ───────────────────────────────────────────────────
const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────

// Allow requests from React dev server and all deployed frontend origins
// CLIENT_URL can be comma-separated for multiple origins e.g. "https://a.vercel.app,https://b.vercel.app"
const ALLOWED_ORIGINS = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(u => u.trim()) : []),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, mobile apps, Render health checks)
      if (!origin) return cb(null, true);
      // Allow exact matches
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      // Allow all Vercel preview deployments for this project
      if (origin.endsWith('.vercel.app')) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// Serve locally uploaded images as static files
app.use('/uploads', express.static(UPLOADS_DIR));

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Global Error Handler ─────────────────────────────────────────────────
// Must be the LAST middleware registered
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
