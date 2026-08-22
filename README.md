# 🔍 CampusConnect — Lost & Found Platform

> A centralized Lost & Found management system for SVCE campus. Report lost items, discover found ones, and recover belongings through a structured request flow — without the WhatsApp group chaos.

---

## 📸 Preview

| Landing Page | Dashboard | Report Form |
|---|---|---|
| Clean hero section with report buttons | Stats, quick actions, recent reports | Two-column layout with tips sidebar |

---

## 🚀 Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| **React 18** | UI framework |
| **Vite** | Dev server & bundler |
| **Tailwind CSS** | Utility-first styling |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |

### Backend
| Tech | Purpose |
|------|---------|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT** | Authentication |
| **Multer** | Image upload handling |
| **Cloudinary** | Cloud image storage (optional) |
| **Nodemailer** | Email notifications (optional) |
| **Nodemon** | Dev auto-restart |

---

## ✨ Features

- 🔐 **Auth** — JWT register / login, protected routes, role-based admin access
- 📋 **Report Items** — Lost or Found with title, category, location, date, and photo
- 🔗 **Auto Matching** — System pairs similar lost/found reports by category & location
- 📬 **Recovery Requests** — Claim an item with a message; owner accepts or rejects
- 🔍 **Browse & Search** — Filter by keyword, category, location, date range, type
- 📁 **My Items** — View, edit, delete, and mark your items as returned
- 📊 **Dashboard** — Personal stats, quick actions, recent reports at a glance
- 🛡️ **Admin Panel** — Manage all items and users
- 🖼️ **Image Support** — Local disk fallback when Cloudinary is unconfigured
- 📱 **Responsive** — Works on mobile and desktop

---

## 📁 Project Structure

```
LOST&FOUND/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB connection
│   │   │   └── cloudinary.js      # Image upload (cloud or local)
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── itemController.js
│   │   │   ├── matchController.js
│   │   │   ├── requestController.js
│   │   │   └── adminController.js
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verify
│   │   │   ├── admin.js           # Admin-only guard
│   │   │   ├── upload.js          # Multer config
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Item.js
│   │   │   └── Request.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── itemRoutes.js
│   │   │   ├── requestRoutes.js
│   │   │   ├── adminRoutes.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── matchingService.js
│   │   │   └── emailService.js
│   │   └── server.js
│   ├── .env.example               # Copy to .env and fill values
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                   # Axios API calls
│   │   ├── components/            # Navbar, ItemCard, ItemForm, Toast…
│   │   ├── constants/             # Category list + icons
│   │   ├── context/               # AuthContext (JWT state)
│   │   ├── pages/                 # All route pages
│   │   └── index.css              # Tailwind + design system
│   ├── vite.config.js
│   └── package.json
│
├── package.json                   # Root scripts (run both servers)
└── .gitignore
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier)
- Git

### 1. Clone the repo

```bash
git clone https://github.com/yuvakiran845/LOST-FOUND-.git
cd "LOST-FOUND-"
```

### 2. Install dependencies

```bash
npm install           # installs root
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/campusconnect
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Optional — leave as placeholder to use local disk storage instead
CLOUDINARY_CLOUD_NAME=placeholder
CLOUDINARY_API_KEY=placeholder
CLOUDINARY_API_SECRET=placeholder

CLIENT_URL=http://localhost:5173
ADMIN_EMAILS=your_email@example.com
```

> 💡 **Images without Cloudinary** — When credentials are `placeholder`, images are saved to `backend/uploads/` automatically. No setup needed for local development.

### 4. Run the app

```bash
# From the root folder — starts both frontend and backend
npm run dev
```

Or run individually:

```bash
npm run backend:dev    # Express on http://localhost:5000
npm run frontend:dev   # Vite on http://localhost:5173
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Browse all items (search + filter) |
| POST | `/api/items` | Create item (auth required) |
| GET | `/api/items/:id` | Get item detail |
| PUT | `/api/items/:id` | Edit item (owner only) |
| DELETE | `/api/items/:id` | Delete item (owner only) |
| GET | `/api/items/my` | My items |

### Matches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items/:id/matches` | Auto-matched items |

### Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests` | Send recovery request |
| GET | `/api/requests/received` | Requests on my items |
| GET | `/api/requests/sent` | Requests I sent |
| PATCH | `/api/requests/:id` | Accept / Reject request |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/items` | All items |
| GET | `/api/admin/users` | All users |
| DELETE | `/api/admin/items/:id` | Delete any item |

---

## 🗂️ Database Collections

### `users`
```js
{ name, email, password (hashed), role, createdAt }
```

### `items`
```js
{
  title, description, category, location, date,
  type: "LOST" | "FOUND",
  status: "ACTIVE" | "MATCHED" | "RETURNED",
  image: { url, publicId },
  reportedBy: ObjectId
}
```

### `requests`
```js
{
  item: ObjectId,
  requester: ObjectId,
  message,
  status: "PENDING" | "ACCEPTED" | "REJECTED"
}
```

---

## 🖼️ Image Storage

| Mode | When | Where |
|------|------|-------|
| **Local disk** | Cloudinary not configured | `backend/uploads/` served at `/uploads/` |
| **Cloudinary** | Valid credentials in `.env` | Cloudinary CDN |

The system auto-detects which mode to use — no code changes needed.

---

## 👤 Admin Access

Add your email to `ADMIN_EMAILS` in `backend/.env`:

```env
ADMIN_EMAILS=yuva@svce.ac.in,admin@college.edu
```

Admin users can:
- View all items and users
- Delete any item

---

## 📦 Root Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers concurrently |
| `npm run backend:dev` | Start backend with nodemon |
| `npm run frontend:dev` | Start Vite dev server |

---

## 🔒 Security Notes

- Passwords hashed with **bcrypt**
- JWT tokens expire in 7 days
- `.env` is in `.gitignore` — never committed
- File upload limited to **5 MB**, images only
- Owner-only edit/delete enforced on the backend

---

## 📌 Deployment (Quick Guide)

| Service | What to deploy |
|---------|---------------|
| **Render / Railway** | Backend (`backend/`) |
| **Vercel / Netlify** | Frontend (`frontend/`) |
| **MongoDB Atlas** | Already cloud-hosted |
| **Cloudinary** | Add real credentials to `.env` |

After deployment, update `CLIENT_URL` in your backend `.env` to the production frontend URL.

---

## 🎓 About

**CampusConnect** is a Final Year B.E. CSE project built at **Sri Venkateswara College of Engineering (SVCE)**.

Built to solve the real problem of disorganized lost & found management on campus — replacing informal WhatsApp groups with a structured, searchable platform.

---

## 📄 License

MIT — free to use, modify, and distribute.
