# 🛒 Smart Deals Server

Smart Deals Server is the backend API for the **Smart Deals** web application.

It is a RESTful backend service built with **Node.js, Express.js, MongoDB, Firebase Admin SDK, and JWT**.

The server provides APIs for managing users, products, and bids. It also handles authentication, authorization, database operations, token verification, and communication between the Smart Deals frontend and MongoDB database.

The backend is designed to support a bidding-based marketplace where users can add products, browse products, place bids, manage their products, and manage their bids.

---

## 🌐 Live API

🔗 https://smart-deals-server-api-five.vercel.app/

---

## 🖥️ Frontend Application

🔗 https://smart-deals-30397.web.app/

---

## 📦 GitHub Repository

🔗 https://github.com/silent-43/smart-deals-server

---

# 🚀 Features

- 👤 User management
- 📧 User registration support
- 🚫 Prevent duplicate users
- 📦 Product management
- ➕ Add products
- 📋 Get all products
- 🔍 Get a single product by ID
- 🕒 Get latest products
- 🔎 Filter products by seller email
- ✏️ Update products
- 🗑️ Delete products
- 💰 Complete bidding system
- ➕ Create bids
- 📋 Get bids
- 👤 Get bids by buyer email
- 🏷️ Get bids for a specific product
- ✏️ Update bids
- 🗑️ Delete bids
- 🔥 Firebase ID token verification
- 🎫 JWT token generation
- 🛡️ JWT token verification
- 🔐 Protected API routes
- 🌐 CORS configuration
- 🗄️ MongoDB Atlas integration
- 🔒 Environment variable based configuration
- ⚡ RESTful API architecture
- ☁️ Vercel deployment
- 🧩 Express middleware
- ⚠️ Error handling
- 🔄 Asynchronous database operations

---

# 🔐 Authentication & Authorization

Smart Deals Server uses both **Firebase Authentication** and **JSON Web Token (JWT)** as part of its authentication and authorization system.

The frontend uses Firebase Authentication for user authentication, while the backend uses the Firebase Admin SDK to verify Firebase ID tokens.

The application also generates JWT tokens using a secret key stored in environment variables.

---

# 🔥 Firebase Authentication

Firebase Authentication is used to authenticate users on the Smart Deals frontend.

Supported authentication methods include:

- 📧 Email & Password
- 🔵 Google Sign-In
- 👤 Firebase User Authentication
- 🔑 Firebase ID Tokens

After successful authentication, the frontend can send the Firebase ID token to protected backend endpoints.
