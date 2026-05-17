# Chronicle Backend Architecture

This repository contains the robust, scalable, and highly secure backend infrastructure for the **Chronicle** application. Built primarily with Node.js and Express, it serves as the central hub handling user authentication, Web3 (IPFS) integrations, data security, and user controls.

---

## 🚀 Tech Stack

- **Core Framework**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODMs) for persistence
- **In-Memory Store**: Redis (for Rate Limiting, OTP Caching, Distributed Locks)
- **Cloud Storage (Avatars)**: AWS S3 + CloudFront (with `sharp` for image optimization)
- **Web3 Storage**: Pinata (IPFS integration)
- **Security**: 
  - Bridge JWT (JSON Web Tokens) for session management
  - WebAuthn (Passkeys/Biometrics) via `@simplewebauthn`
  - AES Encryption (Custom encryption modules for secrets)
  - `speakeasy` for Two-Factor Authentication (2FA)

---

## 🏗️ Core Modules & Architectural Flow

The backend is modularized into distinct domains handling specialized parts of the application:

### 1. Authentication & Authorization (`/api/auth`)
The auth service provides a multi-layered security flow:
- **Traditional Auth**: Bridge JWT-based login and registration with Bcrypt password hashing.
- **OAuth Providers**: Integrations with third-party providers (Google, GitHub).
- **Two-Factor Authentication (2FA)**: Time-based One Time Password (TOTP) implementation. 2FA secrets are strictly **encrypted** in the database using the internal `encryption.js` module.
- **Biometric / Passkeys**: WebAuthn flow (Challenge generation and attestation) to allow users to authenticate using Touch ID, Face ID, or hardware tokens.
- **Session Tracking**: Every login records a `LoginEvent` allowing the system to track user activity, IP addresses, and detect anomalies via the `security-check.js` cron job.

### 2. User Controls (`/api/auth/user`)
Handles all profile-related actions securely via the `requireAuth` middleware:
- **Profile Management**: Aggregation pipelines to fetch rich user data including login histories.
- **Email Verification**: Uses `brevo` to send verification codes. Codes are temporarily cached in **Redis** with short TTLs to ensure they expire securely.
- **Avatar Uploads**: 
  - Uploaded images are buffered in-memory (`multer`).
  - Optimized dynamically using `sharp` (e.g., resizing, format conversion).
  - Streamed directly to an **AWS S3 Bucket** and served globally via CloudFront.

### 3. Encryption & Decryption (`config/encryption.js`)
Security is a first-class citizen. Sensitive data such as 2FA secrets and specific user identifiers are never stored in plaintext. The system utilizes AES-based symmetric encryption algorithms:
- `encrypt()`: Called before saving sensitive fields to MongoDB.
- `decrypt()`: Executed dynamically during validation workflows (e.g., verifying a TOTP token).

### 4. Web3 & IPFS Integration (`/api/web3`)
Designed for decentralized file handling:
- **Pinata Integration**: Connects with the Pinata IPFS gateway.
- Files are pinned to the IPFS network ensuring immutability.
- The returned Content Identifiers (CIDs) are recorded in the database under `Web3Event` models and linked to the `User` document, creating a permanent chronological ledger of user uploads.

### 5. Security Middlewares & Infrastructure
- **Redis Rate Limiter**: Custom sliding-window rate limiters (`rate-limiter.js`) guard against brute-force and DDoS attacks on sensitive routes (e.g., Email Sending, Login).
- **Redis Blacklisting and Lock**: For blacklisting suspicious IPs and locking accounts.
- **Background Cron Jobs**: `security-check.js` runs asynchronously in the background to monitor and prune stale data or flag suspicious login activities.

---

## 📂 Directory Structure

```text
backend/
├── config/             # Cloud configurations (AWS S3, Pinata IPFS, Nodemailer, Encryption)
├── controllers/        # Business logic for routes (User, Auth, OAuth, Web3)
├── database/           # Connection drivers for MongoDB and Redis clients
├── middlewares/        # Express middlewares (Auth guards, Multer upload, Rate Limiting, Locks)
├── models/             # Mongoose schemas (User, LoginEvent, PassKey, Web3Event)
├── routes/             # API routing endpoints mapping to controllers
├── server.js           # Express App entry point and global middleware registration
├── security-check.js   # Background cron processes for automated security audits
└── utils/              # Helper functions and constant variables
```

---

## 🔄 Request Lifecycle Example (Avatar Upload)

1. **Client Request**: Frontend sends a multipart form-data request to `/api/auth/user/avatar/upload`.
2. **Middleware Layer**: 
   - `requireAuth` validates the Bridge JWT token in headers.
   - `upload.single('image')` captures the file into a memory buffer.
3. **Controller Processing (`uploadAvatar`)**:
   - `sharp` processes the image buffer (compression).
   - `PutObjectCommand` streams the buffer directly to the **AWS S3 bucket**.
   - S3 Key is returned to the client.
4. **Client Confirmation**: Frontend triggers `/avatar/save` with the returned key.
5. **Database Update**: The CloudFront URL is constructed and patched into the MongoDB `User` document.

---

## 🏃 Getting Started

1. Create a `.env` file based on your environment requirements (AWS keys, Mongo URI, Redis URL, JWT Secret, Pinata Keys).
2. Install dependencies: `npm install`
3. Start the server: `npm start` (or `npm run dev` for local development).
