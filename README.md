# 🔍 CampusConnect — Lost & Found Platform

CampusConnect is a **full-stack Lost & Found platform for college campuses**.
It helps students report lost/found items, search for items, and request the return of their belongings.

## 🚀 Features

* 🔐 User Registration & Login
* 📋 Report Lost or Found Items
* 🔍 Search and Filter Items
* 🖼️ Upload Item Images
* 🔗 Find Possible Matches
* 📬 Send Recovery Requests
* 📊 Personal Dashboard
* 🛡️ Admin Panel
* 📱 Responsive Design

## 🛠️ Tech Stack

**Frontend**

* React
* Vite
* Tailwind CSS
* React Router
* Axios

**Backend**

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Multer

**Other**

* Cloudinary for image storage
* Git & GitHub

## 🏗️ How It Works

1. Student creates an account and logs in.
2. Student reports a **Lost** or **Found** item.
3. Other students can search and filter reported items.
4. The system finds possible matching items.
5. A student can send a recovery request.
6. The item owner can accept or reject the request.
7. The item can be marked as **Returned**.

## 📂 Project Structure

```text
CampusConnect/
├── frontend/
├── backend/
├── README.md
└── package.json
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/yuvakiran845/LOST-FOUND-.git
cd LOST-FOUND-
```

### 2. Install dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

### 4. Run the Project

From the root folder:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

## 🔒 Security

* Passwords are hashed using bcrypt.
* JWT is used for authentication.
* Protected routes are used for authorized users.
* Users can edit/delete only their own items.
* Admin users have additional permissions.

## 🎯 Purpose

CampusConnect was built to solve the common problem of managing lost and found items in college.

Instead of depending on WhatsApp groups, students can use one centralized platform to **report, search, match, and recover items**.

## 👨‍💻 Developer

**Yuva Kiran**
B.Tech CSE Student | Full-Stack Developer

GitHub: `https://github.com/yuvakiran845`

## 📄 License

MIT License
