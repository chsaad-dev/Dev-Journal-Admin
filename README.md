# DevJournal

DevJournal is a developer-focused journaling and blogging platform. Users write and publish posts about their work, follow other developers, interact through comments and likes, and receive push notifications for social activity. The project ships as three separate components that share one Firebase backend: an Android app built in Jetpack Compose, a Next.js web admin panel, and a Cloudflare Worker that handles push notification delivery.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Architecture](#3-architecture)
4. [Android App](#4-android-app)
5. [Web Admin Panel](#5-web-admin-panel)
6. [Notification Worker](#6-notification-worker)
7. [Firebase Configuration](#7-firebase-configuration)
8. [Prerequisites](#8-prerequisites)
9. [Getting Started](#9-getting-started)
10. [Environment Variables](#10-environment-variables)
11. [Firestore Data Model](#11-firestore-data-model)
12. [Key Features](#12-key-features)
13. [Known Limitations](#13-known-limitations)

---

## 1. Project Overview

The platform is built around a single Firestore database. The Android app is the primary user-facing product. The web panel gives administrators visibility into all content, users, and platform activity, and provides a tool to send push notifications to all registered devices at once. The Cloudflare Worker acts as the secure bridge between the admin panel and Firebase Cloud Messaging, since FCM v1 requires a service account and cannot be called directly from browser code.

---

## 2. Repository Structure

```
Dev-Journal/
  devjournal-android/     Android application (Kotlin, Jetpack Compose)
  devjournal-web/         Admin panel (Next.js 16, TypeScript, Tailwind CSS v4)
  devjournal-worker/      Push notification service (Cloudflare Workers, TypeScript)
  firebase/               Firestore security rules and Firebase project config
  scripts/                Utility scripts
  shared-docs/            Shared documentation
```

Each of `devjournal-android`, `devjournal-web`, and `devjournal-worker` is an independent project with its own dependency management and deployment lifecycle. They are versioned together in this monorepo because they belong to the same product.

---

## 3. Architecture

```
+----------------------------------------------+
|           Android App (User-facing)          |
|  Jetpack Compose  Hilt  Firebase SDK         |
+--------------------+-------------------------+
                     |  Firebase SDK (direct)
                     v
+----------------------------------------------+
|             Firebase Backend                 |
|  Auth  Firestore  Cloud Messaging (FCM)      |
+----------+------------------+----------------+
           |                  |  REST (Firestore + FCM v1)
           v                  v
+-----------------+    +--------------------------+
|  Next.js Admin  |    |  Cloudflare Worker       |
|  (browser)      +--->+  JWT auth  FCM dispatch  |
+-----------------+    +--------------------------+
```

All three components read and write to the same Firestore database. The Android app uses the Firebase Android SDK with real-time listeners. The Next.js admin panel uses the Firebase JavaScript SDK with real-time listeners from the browser. The Cloudflare Worker uses the Firestore and FCM HTTP REST APIs authenticated via a service account JWT, because service account credentials cannot be exposed in browser code.

---

## 4. Android App

**Location:** `devjournal-android/`

**Language and SDK:** Kotlin, targeting Android API 24 (Android 7.0) and above, compiled against SDK 34.

**Build System:** Gradle with Kotlin DSL (`build.gradle.kts`).

### 4.1 Technology Stack

| Concern | Library |
|---|---|
| UI | Jetpack Compose with Material3 |
| Navigation | Navigation Compose |
| Dependency Injection | Hilt 2.51 |
| Firebase | Firebase BOM — Auth, Firestore, Cloud Messaging |
| Image loading | Coil Compose |
| HTTP client | OkHttp |
| Local database | Room |
| Preferences | DataStore |
| Google Sign-In | Credential Manager |

### 4.2 Package Structure

The app follows a layered architecture with three main layers under `com.devjournal`.

**`data/`** — Data sources and repository implementations.

`data/remote/` contains `CloudinaryUploader` (image upload via OkHttp) and `NotifyWorkerApi` (calls the Cloudflare Worker for targeted notifications). `data/local/` contains `ThemePreferences` (DataStore) and Room DAOs for drafts and bookmarked posts. `data/repository/` contains concrete implementations of the domain repository interfaces: `AuthRepositoryImpl`, `PostRepositoryImpl`, `UserRepositoryImpl`, `CommentRepositoryImpl`, and `DraftRepositoryImpl`.

**`domain/`** — Business logic, repository interfaces, and use cases.

The use case layer contains 46 use case classes. Each wraps a single repository operation and is injected into the relevant ViewModel. This keeps ViewModels thin and the data layer independently testable.

**`presentation/`** — Screen composables and ViewModels, organized by feature.

| Package | Description |
|---|---|
| `auth/` | Sign-in, sign-up, email verification, password reset |
| `feed/` | Main tab scaffold with Home, Feed, Search, and Profile tabs |
| `postdetail/` | Full post view with comment thread |
| `editor/` | Markdown post editor with draft and publish flow |
| `profile/` | User profile view and edit |
| `author/` | Viewing another user's profile and posts |
| `search/` | User and post search |
| `notifications/` | In-app notification list |
| `followlist/` | Followers and following lists |
| `settings/` | App settings including theme selection |
| `splash/` | Splash screen with auth state routing |

**`ui/`** — Material3 color schemes, typography, and theming.

**`util/`** — `ConnectivityNetworkMonitor`, which exposes a `Flow<Boolean>` reflecting real-time network availability using `ConnectivityManager.NetworkCallback`.

**`di/`** — Single Hilt module (`AppModule`) that provides Firebase instances, OkHttp, Room, Cloudinary, and all repository bindings.

### 4.3 Navigation

The app uses a single-Activity architecture. `MainActivity` sets up edge-to-edge window rendering and hosts a `NavHost` that manages all destinations. The main tab screen lives in `FeedScreen.kt`, which contains a `Scaffold` with a `HorizontalPager` for the four main tabs (Home, Feed, Search, Profile) and a `NavigationBar` that hides automatically when the on-screen keyboard is visible.

### 4.4 Offline Support

Bookmarked posts are persisted to a Room database (`devjournal_database`). When a bookmarked post is opened and there is no network connection, `PostRepositoryImpl` immediately emits the locally cached version so the user can read it. When the network becomes available, the Firestore snapshot listener takes over and the view refreshes. Drafts are also stored locally in Room and optionally synced to Firestore.

### 4.5 Image Uploads

User avatars and post cover images are uploaded to Cloudinary via the unsigned upload API. `CloudinaryUploader` reads the image bytes from the Android content URI and sends a multipart POST to Cloudinary. The `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET` values are injected at build time from `local.properties` via `BuildConfig` fields.

### 4.6 Building the App

Add the following to `devjournal-android/local.properties`:

```properties
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

Place the `google-services.json` from your Firebase project into `devjournal-android/app/`. Then run:

```
./gradlew assembleDebug
```

---

## 5. Web Admin Panel

**Location:** `devjournal-web/`

**Framework:** Next.js 16 (App Router), React 19, TypeScript.

**Styling:** Tailwind CSS v4 with a custom CSS token design system defined in `globals.css`.

**Authentication:** Firebase Authentication. The admin panel is protected by `AdminGuard`, which verifies that the signed-in user has a `role` field of `"admin"` in the Firestore `users` collection before rendering any admin content.

### 5.1 Routes

All routes are under the `(admin)` route group and require admin authentication.

| Route | Purpose |
|---|---|
| `/dashboard` | Platform overview: post counts, user counts, total likes and views, posts-per-week bar chart, recent activity feed, and top followed creators |
| `/posts` | Table of all posts with moderation controls |
| `/users` | Table of all registered users with profile and suspension management |
| `/comments` | View and delete comments across all posts |
| `/broadcast` | Compose and send a push notification to all registered devices |
| `/settings` | Admin settings |

### 5.2 Data Fetching

The admin panel subscribes to Firestore collections using real-time listeners (`onSnapshot`). Data is kept live in component state — the dashboard updates automatically as users post and comment without any polling or manual refresh.

### 5.3 Running Locally

```bash
cd devjournal-web
cp .env.example .env.local
# Fill in values — see the Environment Variables section below
npm install
npm run dev
```

The dev server starts at `http://localhost:3000`. Navigate to `/dashboard` and sign in with an admin account.

---

## 6. Notification Worker

**Location:** `devjournal-worker/`

**Runtime:** Cloudflare Workers (V8 isolate, no Node.js).

**Language:** TypeScript.

This is a small HTTP service with a single endpoint that accepts POST requests and dispatches Firebase Cloud Messaging notifications. It exists because FCM HTTP v1 requires a service account JWT for authorization, and a Firebase service account private key cannot be safely included in browser JavaScript. The worker holds the key as a Cloudflare secret and signs the JWT using the Web Crypto API, which is available natively in the Workers runtime.

### 6.1 Request Format

For a broadcast to all users:

```json
{
  "type": "broadcast",
  "title": "Notification title",
  "body": "Notification body text"
}
```

For a targeted notification to a single user:

```json
{
  "type": "targeted",
  "title": "Someone followed you",
  "body": "Check out their profile",
  "targetUid": "firebase_user_uid",
  "data": {
    "type": "follow",
    "targetUid": "firebase_user_uid"
  }
}
```

For `broadcast` type, the worker fetches all user documents from Firestore (up to 1000), collects their `fcmTokens` arrays, deduplicates them, and sends FCM messages in batches of 50. For `targeted` type, it fetches a single user document and sends to all of their registered tokens.

### 6.2 Deploying

```bash
cd devjournal-worker
npx wrangler secret put FIREBASE_PROJECT_ID
npx wrangler secret put FIREBASE_API_KEY
npx wrangler secret put FCM_SERVICE_ACCOUNT_JSON
npx wrangler deploy
```

After deployment, copy the worker URL and set it as `NEXT_PUBLIC_WORKER_URL` in the admin panel's `.env.local`.

---

## 7. Firebase Configuration

**Location:** `firebase/`

This directory contains the Firestore security rules (`firestore.rules`) and the Firebase project config files (`.firebaserc`, `firebase.json`).

Deploy the rules with:

```bash
cd firebase
npx firebase-tools deploy --only firestore:rules
```

### Security Model Summary

**Posts.** Published posts are publicly readable. Only the author or an admin can update or delete a post. Authenticated, non-suspended users can create posts. The `viewCount`, `likeCount`, and `commentCount` fields can be updated by any authenticated non-suspended user to support like and view tracking.

**Comments.** Any user can read comments. Creating a comment requires authentication and a non-suspended account. Only the comment author or an admin can delete a comment.

**Views.** A user can record themselves as a viewer once per post, but view records cannot be updated or deleted after creation.

**Users.** User profiles are publicly readable. A user can write their own profile. Follower and following counts can be updated by any authenticated non-suspended user to support follow actions.

**Followers and Following subcollections.** Managed symmetrically — a user can add or remove themselves from another user's followers list, and from their own following list.

**Bookmarks and Liked Posts.** Private to the owning user.

**Broadcasts.** Read and write are restricted to admins only.

---

## 8. Prerequisites

**For the Android app:**

1. Android Studio Hedgehog or newer
2. JDK 17
3. A Firebase project with an Android app registered and `google-services.json` downloaded
4. A Cloudinary account with an unsigned upload preset created

**For the web admin panel:**

1. Node.js 18 or newer
2. A Firebase project with a Web app registered
3. The same Firebase project used by the Android app

**For the notification worker:**

1. A Cloudflare account
2. Wrangler CLI (`npm install -g wrangler`)
3. A Firebase service account JSON file, downloaded from Firebase Console under Project Settings > Service Accounts > Generate new private key

---

## 9. Getting Started

### Step 1: Create a Firebase project

Go to [console.firebase.google.com](https://console.firebase.google.com), create a project, and enable Authentication (Email/Password and Google providers), Firestore Database, and Cloud Messaging.

### Step 2: Deploy Firestore rules

```bash
cd firebase
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules
```

### Step 3: Set up the Android app

Download `google-services.json` from the Firebase Console (Android app settings) and place it at `devjournal-android/app/google-services.json`. Add Cloudinary credentials to `devjournal-android/local.properties`:

```properties
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

Open `devjournal-android/` in Android Studio and run on a device or emulator.

### Step 4: Set up the admin panel

```bash
cd devjournal-web
cp .env.example .env.local
# Fill in all values
npm install
npm run dev
```

To create the first admin user: sign up through the Android app, then manually set `role: "admin"` on that user's Firestore document in the Firebase Console.

### Step 5: Deploy the notification worker

```bash
cd devjournal-worker
npx wrangler login
npx wrangler secret put FIREBASE_PROJECT_ID
npx wrangler secret put FIREBASE_API_KEY
npx wrangler secret put FCM_SERVICE_ACCOUNT_JSON
npx wrangler deploy
```

Copy the deployed worker URL and add it to `devjournal-web/.env.local` as `NEXT_PUBLIC_WORKER_URL`.

---

## 10. Environment Variables

### Android — `devjournal-android/local.properties`

| Key | Description |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_UPLOAD_PRESET` | An unsigned upload preset configured in Cloudinary |

### Web Admin — `devjournal-web/.env.local`

| Key | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `NEXT_PUBLIC_WORKER_URL` | Deployed Cloudflare Worker URL |

### Notification Worker — Cloudflare secrets (`wrangler secret put`)

| Secret | Description |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_API_KEY` | Firebase Web API key |
| `FCM_SERVICE_ACCOUNT_JSON` | Full contents of the service account JSON file |

---

## 11. Firestore Data Model

### `users/{uid}`

```
uid              string
name             string
username         string      lowercase, unique
displayUsername  string      original casing
email            string
photoUrl         string
bio              string
role             string      "reader" or "admin"
suspended        boolean
followerCount    number
followingCount   number
fcmTokens        string[]
createdAt        timestamp
```

Subcollections: `likedPosts/{postId}`, `bookmarks/{postId}`, `followers/{followerId}`, `following/{followingId}`

### `posts/{postId}`

```
id            string
title         string
content       string      Markdown
authorId      string
authorName    string
authorPhoto   string
coverImageUrl string
published     boolean
createdAt     timestamp
updatedAt     timestamp
likeCount     number
commentCount  number
viewCount     number
tags          string[]
```

Subcollections: `comments/{commentId}`, `views/{uid}`

### `broadcasts/{broadcastId}`

```
title      string
body       string
sentBy     string      admin uid
sentAt     timestamp
sentCount  number
```

---

## 12. Key Features

### Authentication

Email and password sign-up requires email verification before the first login. Google Sign-In is supported via the Android Credential Manager API. Password reset is available via email. Account suspension is enforced at the Firestore security rules level, so suspended users cannot write any content regardless of client-side checks.

### Posts

The post editor supports Markdown with a live preview. Drafts are saved locally in Room and optionally synced to Firestore so they are accessible across devices. Posts support a cover image uploaded to Cloudinary. Authors can edit or delete their own posts; admins can edit or delete any post.

### Social

Users can follow and unfollow each other. A dedicated following feed shows only posts from accounts the current user follows. Likes and bookmarks are tracked per-user. View count is recorded once per user per post using a subcollection keyed by user ID, preventing duplicate counts.

### Notifications

The Android app registers an FCM token on login and stores it in the user's Firestore document. Targeted push notifications are sent when a user receives a new follower. The notification payload includes a data field so the app can navigate to the relevant profile when the notification is tapped. Admins can send a broadcast notification to all registered devices from the web panel.

### Offline Reading

Bookmarked posts are readable offline. When a bookmarked post is opened without a network connection, the app displays the locally cached version immediately. Once connectivity is restored, the Firestore listener updates the view. The `ConnectivityNetworkMonitor` exposes a reactive network state that screens can observe to show offline warnings before a user attempts an action that requires a network connection.

### Theme

Supports System default, Light, and Dark themes. The preference is stored in DataStore and read at app startup. `DevJournalTheme` applies either the light or dark Material3 color scheme based on the stored preference or the system setting.

---

## 13. Known Limitations

**User search.** The search does not use a dedicated index. Queries fetch up to 50 user documents from Firestore and filter them in memory by `username` or `name`. This is reasonable for small communities but would need a dedicated search service such as Algolia or Typesense for a larger user base.

**Broadcast scale.** The Cloudflare Worker fetches up to 1000 user documents per broadcast request. For user bases larger than 1000, the code would need to implement Firestore's `nextPageToken` pagination, which is noted as a comment in the worker source.

**Cloudinary upload preset.** The Android app uses an unsigned Cloudinary upload preset, which means any client with the preset name can upload images to the account. This is the standard approach when a secret cannot be embedded in a mobile app. It should be paired with upload size limits, allowed file type restrictions, and folder isolation configured on the preset in the Cloudinary dashboard.

**Room migrations.** The Room database is configured with `fallbackToDestructiveMigration`. If the schema of the local `drafts` or `bookmarkedPosts` tables changes in a future version, the database will be dropped and recreated, which means users will lose locally stored drafts that have not been synced to Firestore.
