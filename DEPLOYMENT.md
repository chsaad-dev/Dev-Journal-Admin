# Vercel Deployment Guide

This document outlines the steps to deploy the DevJournal Admin Panel (`devjournal-web`) to Vercel for production.

## 1. Authentication
First, ensure you are logged into the Vercel CLI. If you don't have it installed, run `npm i -g vercel`.
```powershell
vercel login
```
Follow the prompts to authenticate with your Vercel account via your browser.

## 2. Project Initialization
Link your local directory to a new Vercel project by running:
```powershell
vercel
```
- Set up and deploy? **Yes**
- Which scope? **Your Account**
- Link to existing project? **No**
- What's your project's name? **devjournal-admin** (or whatever you prefer)
- In which directory is your code located? **./** (Just press Enter)
- Want to override the settings? **No**

*Note: This will perform a quick preview deployment. The site won't function yet because it doesn't have your environment variables.*

## 3. Environment Variables
Before deploying to production, you must inject your secret keys. 

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your new project.
3. Go to **Settings > Environment Variables**.
4. Add **EVERY** variable listed in your `.env.example` file. Copy the actual values from your local `.env.local` file.
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `NEXT_PUBLIC_WORKER_URL`
5. Make sure these are applied to **Production, Preview, and Development** environments.

## 4. Production Deployment
Once the variables are set in the dashboard, push the final production build:
```powershell
vercel --prod
```
Vercel will build your Next.js application and output a production URL (e.g., `https://devjournal-admin.vercel.app`).

## 5. Critical: Firebase Domain Whitelisting
By default, Firebase Authentication will reject login attempts from unauthorized domains. You **must** whitelist your new Vercel URL.

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Navigate to **Authentication > Settings > Authorized domains**.
4. Click **Add domain**.
5. Paste your exact Vercel production domain (e.g., `devjournal-admin.vercel.app`). Do not include `https://` or trailing slashes.
6. Save.

Your Admin panel is now fully live and secure in production!
