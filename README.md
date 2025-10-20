# 🎤 Sevo - Speak. Don't Type. Connect with Real Voices.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built With React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![Built With Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-010101?style=flat&logo=socket.io&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

Developed by [CipherNichu](https://github.com/CipherNichu)

## ✨ Overview

Sevo is a modern, voice-only Progressive Web App (PWA) designed for authentic and ephemeral communication. In a world saturated with text, Sevo brings back the human element of voice, allowing users to send self-destructing audio messages that vanish after a set lifespan. Connect with friends, share moments, and experience truly private conversations.

## 🚀 Features

*   **🎙️ Voice-Only Messaging:** Communicate purely through voice notes, eliminating the need for typing.
*   **⏳ Self-Destructing Messages:** Messages automatically disappear after a chosen lifespan: 3 minutes, 3 hours, or 3 days.
*   **⚡ Real-time Communication:** Powered by Socket.io for instant message delivery and chat status updates.
*   **🔒 Google OAuth Authentication:** Secure and seamless login using your Google account.
*   **👤 Profile Management:** Customize your display name and profile photo.
*   **🔎 User Search & Friends List:** Easily find and connect with other users.
*   **☁️ Cloudinary Integration (Optional):** Securely store audio and profile photos in the cloud.
*   **📱 Progressive Web App (PWA):** Installable on any device for a native app-like experience.
*   **🎨 Modern UI/UX:** A sleek, intuitive interface built with React and Tailwind CSS.

## 🛠️ Technologies Used

### Backend (Node.js, Express)
*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Web application framework for Node.js.
*   **MongoDB:** NoSQL database for data storage.
*   **Mongoose:** MongoDB object data modeling (ODM) for Node.js.
*   **Socket.io:** Real-time bidirectional event-based communication.
*   **Passport.js (Google OAuth20 Strategy):** Authentication middleware.
*   **JWT (JSON Web Tokens):** For secure API authentication.
*   **Cloudinary:** Cloud-based image and video management (optional).
*   **Multer:** Middleware for handling `multipart/form-data`.
*   **FFmpeg:** For audio conversion (e.g., to WAV for consistent playback).
*   **Helmet & CORS:** Security and cross-origin resource sharing.
*   **Express Rate Limit:** Protect against brute-force attacks.
*   **Node-Cron:** For scheduling tasks like deleting expired messages.

### Frontend (React, Vite)
*   **React:** JavaScript library for building user interfaces.
*   **Vite:** Next-generation frontend tooling for fast development.
*   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
*   **Axios:** Promise-based HTTP client for the browser and Node.js.
*   **React Router DOM:** Declarative routing for React.
*   **React Media Recorder:** For recording audio directly in the browser.
*   **Lucide React & React Icons:** Icon libraries.
*   **Date-fns:** Modern JavaScript date utility library.
*   **Lodash.debounce:** For debouncing search inputs.

## ⚙️ Setup and Installation

To get Sevo up and running on your local machine, follow these steps:

### Prerequisites

*   Node.js (v14 or higher)
*   MongoDB Atlas account (or local MongoDB instance)
*   Cloudinary account (optional, for media storage)
*   Google Cloud Project for OAuth 2.0 credentials

### 1. Clone the Repository

```bash
git clone https://github.com/CipherNichu/sevo.git
cd sevo
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/config/` directory and add the following environment variables:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_very_strong_secret_key_for_jwt
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name # Optional
CLOUDINARY_API_KEY=your_cloudinary_api_key       # Optional
CLOUDINARY_API_SECRET=your_cloudinary_api_secret # Optional
FRONTEND_URL=http://localhost:5173
```

*   **`MONGO_URI`**: Get this from your MongoDB Atlas cluster or local MongoDB setup.
*   **`JWT_SECRET`**: A long, random string for signing JWTs.
*   **`GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`**: Obtain these from your Google Cloud Console. Set the authorized redirect URI to `http://localhost:5000/auth/google/callback`.
*   **`CLOUDINARY_*`**: If you want to use Cloudinary for media storage, provide your credentials. Otherwise, local storage will be used.
*   **`FRONTEND_URL`**: The URL where your frontend application will be running.

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory and add the following environment variables:

```env
VITE_BACKEND_URL=http://localhost:5000
```

*   **`VITE_BACKEND_URL`**: The URL where your backend API is running.

### 4. Run the Applications

Start the backend server:

```bash
cd backend
npm run dev
```

Start the frontend development server:

```bash
cd ../frontend
npm run dev
```

The frontend application should now be accessible at `http://localhost:5173` (or another port if 5173 is in use).

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements, new features, or bug fixes, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add new feature'`).
5.  Push to the branch (`git push origin feature/YourFeature`).
6.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by CipherNichu