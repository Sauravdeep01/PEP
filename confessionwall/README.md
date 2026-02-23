# ConfessHub (ConfessionHub)

ConfessHub is a full-stack web application that lets people share confessions anonymously, interact with posts through reactions and comments, and manage their own activity (saved/liked/my posts) while keeping their identity hidden from the public feed.

This README is written for **presentation/demo purposes** and explains the app’s goal, features, architecture, and the **React hooks used and the logic behind them**.

---

## 1) Problem Statement

In many student/community environments, people want to express thoughts (stress, crushes, rants, deep thoughts) without fear of judgement. ConfessHub provides a privacy-first “confession wall” experience:

- Users can post publicly while remaining anonymous.
- Users still have a private account identity so they can edit/delete their own confessions.
- Interactions (reactions/comments/saves) create engagement without exposing real identity.

---

## 2) Key Features (What to Show in Presentation)

- **Anonymous confessions feed** with categories
- **Two authentication modes**
  - **Google login** (Google Identity Services)
  - **Manual login / signup** (Email + Username)
- **Search**
  - normal text search
  - hashtag-style search using `#category`
- **Create confession**
  - requires a **secret code** (min 4 chars) for edit/delete verification
- **Edit/Delete confession protected by secret code**
  - secret code is **hashed (SHA-256)** before saving to database
- **Reactions** (multi-type reactions + toggle/switch logic)
- **Save/Bookmark** posts
- **Comments**
  - add
  - edit/delete (only for your own comment)
- **User profile**
  - set/update anonymous display name
  - view My Posts / Saved / Liked
- **Notifications dropdown** (computed from reactions/comments on your posts)

---

## 3) Tech Stack

### Frontend
- **React (Vite)**
- **React Context API** for authentication state management (`AuthContext`)
- **Fetch API** for REST calls

Frontend folder: `clerk-react/src`

### Backend
- **Node.js + Express** REST API
- **MongoDB + Mongoose** for data persistence
- **dotenv** for environment variables
- **cors** to allow frontend to call backend during local dev

Backend folder: `clerk-react/server`

---

## 4) Project Structure (High Level)

Inside `clerk-react/`:

- `src/`
  - `main.jsx` – app entry, environment validation, mounts `<AuthProvider>` and `<App />`
  - `App.jsx` – main UI layout + data fetching + simple view switching
  - `AuthContext.jsx` – auth provider (Google + manual auth)
  - `components/`
    - `ConfessionWall.jsx` – feed + posting + edit/delete + reactions + comments
    - `UserProfile.jsx` – profile + anonymous name update + tabs
    - `Widgets.jsx` – side widgets + search integration

Inside `clerk-react/server/`:

- `server.js` – express server, route mounting, MongoDB connection
- `routes/`
  - `confessions.js` – confession CRUD + reactions + saves + comments
  - `users.js` – sync/update/manual-auth
- `models/`
  - `Confession.js` – schema, secret-code hashing, secret-code verify
  - `User.js` – schema supporting Google users and manual users

---

## 5) Setup & Run (Local)

### Prerequisites
- Node.js installed
- A MongoDB database (local or Atlas)
- Google OAuth Client ID (for Google login)

### 5.1 Start the backend

From `clerk-react/server`:

- Install:
  - `npm install`
- Run:
  - `npm run dev`

Backend default URL:
- `http://localhost:5001`

Backend environment file:
- `clerk-react/server/.env`

Expected variables:
- `MONGODB_URI=...`
- `PORT=5001`

### 5.2 Start the frontend

From `clerk-react/`:

- Install:
  - `npm install`
- Create `clerk-react/.env` with:
  - `VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID`
- Run:
  - `npm run dev`

Frontend runs on the Vite dev URL (commonly `http://localhost:5173`).

---

## 6) Architecture & Data Flow

### 6.1 Frontend ↔ Backend communication

Frontend calls backend via `fetch()` to:
- `http://127.0.0.1:5001/confessions`
- `http://127.0.0.1:5001/users/...`

`App.jsx` is the top-level component that:
- fetches confessions
- passes confessions to the feed component
- controls view switching (feed/news/profile/about/privacy/rules)

### 6.2 Authentication design

Auth state is managed using:
- `AuthContext.jsx` (Context Provider)
- `useAuth()` hook (Context consumer)

The app supports **two auth types**:

1. **Google auth**
- Google returns a JWT credential.
- `AuthContext` decodes the JWT payload to create `userObj`.
- Stores user in:
  - React state (`user`)
  - `localStorage` (`google_user`) to restore session on refresh.

2. **Manual auth**
- User enters Email + Username.
- Frontend calls `POST /users/manual-auth`.
- Backend returns existing user or creates a new one.
- Frontend stores the resulting user object in state and localStorage.

### 6.3 User sync (Google users)

In `App.jsx`, when a Google user logs in for the first time in a session:
- it calls `POST /users/sync`
- backend uses **upsert** (find-or-create) to ensure the user exists
- assigns a generated:
  - `customUserId` (e.g., `USER_1234`)
  - `anonymousName` (e.g., `User_1234`)

### 6.4 Confession lifecycle

1. **Read feed**
- `GET /confessions`
- backend sorts newest-first and excludes secretCode from response.

2. **Create confession**
- `POST /confessions`
- includes: `text`, `secretCode`, `userId`, `category`, and anonymous name
- backend hashes `secretCode` before saving.

3. **Edit confession** (requires secret code)
- `PUT /confessions/:id` with `{ secretCode, text }`
- backend verifies code using `verifySecretCode()`.

4. **Delete confession** (requires secret code)
- `DELETE /confessions/:id` with `{ secretCode }`
- backend verifies code using `verifySecretCode()`.

### 6.5 Reactions logic

Endpoint:
- `POST /confessions/:id/react`

Design goals:
- each user can have **at most one reaction** per confession
- clicking the same reaction again toggles it off
- choosing a different reaction switches it

Supported reaction types in routes:
- `like`, `heart`, `laugh`, `cry`, `dislike`, `unlike`

### 6.6 Save (bookmark) logic

Endpoint:
- `POST /confessions/:id/save`

It toggles whether `userId` is present in `savedBy` array.

### 6.7 Comments logic

- Add: `POST /confessions/:id/comments`
- Edit: `PUT /confessions/:id/comments/:commentId`
- Delete: `DELETE /confessions/:id/comments/:commentId`

Frontend guards:
- only allow edit/delete when `comment.userId === currentUser.id`.

---

## 7) Database Models (Backend)

### 7.1 `User` model (`server/models/User.js`)

Stores:
- `googleId` (optional; sparse unique)
- `customUserId` (unique; generated)
- `email` (unique; required)
- `username`
- `anonymousName`
- `picture` (default avatar)

Supports both:
- Google-based accounts
- Manual accounts

### 7.2 `Confession` model (`server/models/Confession.js`)

Stores:
- `text`
- `secretCode` (hashed)
- `userId`
- `anonymousName`
- `category`
- `reactions[]`
- `savedBy[]`
- `comments[]`

Security logic:
- pre-save hook hashes `secretCode` using SHA-256
- `verifySecretCode(code)` hashes input and compares

---

## 8) React Hooks Used (and Their Logic)

This project mainly uses:
- `useState`
- `useEffect`
- `useCallback`
- `useContext`

### 8.1 `useState`

Used for:
- component UI state
- form state
- data state fetched from APIs

Examples:

- `App.jsx`
  - `activeView`: app section routing (feed/news/profile/rules/privacy/about)
  - `confessions`: stores feed data
  - `searchTerm`: search input
  - `showNotifications`: dropdown toggle
  - manual auth form state: `showManualForm`, `manualEmail`, `manualUsername`, `manualError`, `isAuthenticating`
  - session flags: `hasSynced`, `buttonRendered`

- `AuthContext.jsx`
  - `user`: authenticated user object
  - `isLoaded`: true once session restore is checked

- `ConfessionWall.jsx`
  - confession creation: `text`, `secretCode`, `category`, `submitting`
  - UI toggles: `showForm`, `hoveredConfession`
  - comments UI: `expandedComments`, `editingComment`
  - modal state: `modal` (edit/delete secret code + draft + errors)

- `UserProfile.jsx`
  - `activeTab`: My Posts / Saved / Liked
  - `anonymousName`, `customUserId`: fetched profile data
  - `isEditing`, `newName`, `isSaving`: anonymous name update workflow

### 8.2 `useEffect`

Used for:
- initial API fetches
- reacting to authentication changes
- syncing derived/local state from props
- initializing third-party auth script logic

Examples:

- `AuthContext.jsx`
  - On mount: restore user from `localStorage` and set `isLoaded`.
  - Initialize Google identity once available; includes fallback polling if the script loads late.

- `App.jsx`
  - On mount: fetch confessions.
  - When `user` changes:
    - if Google user and not yet synced, call `/users/sync` once
    - otherwise fetch anonymous name
    - if not logged in and loaded, render the Google sign-in button once.
  - When user becomes null (logout), reset flags to allow re-init.

- `ConfessionWall.jsx`
  - When `confessions` prop changes, update `localConfessions`.

- `UserProfile.jsx`
  - When user is ready, fetch profile/anonymous info.

### 8.3 `useCallback`

Used for stable function references (especially in context and effects).

In `AuthContext.jsx`:
- `handleCredentialResponse`: processes Google credential, builds user object, stores it
- `manualAuth`: calls backend manual-auth endpoint and stores user
- `signIn`: triggers Google prompt
- `renderGoogleButton`: renders official Google button into a div
- `signOut`: clears local state/localStorage and revokes Google session

### 8.4 `useContext`

Used for global auth state access.

- `AuthProvider` exposes `user`, `isLoaded`, and auth actions.
- `useAuth()` is a custom hook that wraps `useContext(AuthContext)`.

---

## 9) API Endpoints (Quick Reference)

Base URL:
- `http://127.0.0.1:5001`

### Confessions
- `GET /confessions`
- `POST /confessions`
- `PUT /confessions/:id`
- `DELETE /confessions/:id`
- `POST /confessions/:id/react`
- `POST /confessions/:id/save`
- `POST /confessions/:id/comments`
- `PUT /confessions/:id/comments/:commentId`
- `DELETE /confessions/:id/comments/:commentId`

### Users
- `GET /users/:id`
- `POST /users/sync`
- `POST /users/update`
- `POST /users/manual-auth`

---

## 10) Suggested Presentation Flow (Demo Script)

- Show **login screen**
  - Google login
  - manual login
- Post a confession using:
  - category
  - secret code
- React and comment on a post
- Save a post
- Edit and delete your confession using secret code
- Go to profile
  - update anonymous name
  - show tabs: My Posts / Saved / Liked

---

## 11) Notes / Improvements (If Asked in Viva)

- Move API base URL into environment variables (avoid hardcoded `127.0.0.1:5001`).
- Add proper validation and rate limiting on backend.
- Improve auth security (verify Google token on backend for production).
- Add pagination/infinite scroll for large feeds.
- Add automated tests (frontend + backend).

