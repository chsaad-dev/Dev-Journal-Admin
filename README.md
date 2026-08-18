# DevJournal Web Admin

DevJournal Web Admin is an internal admin panel built with Next.js for managing the DevJournal platform. It shares its Firebase backend with the companion Android application to provide a centralized control center for all platform content and users.

## Features

* Secure admin only authentication with role based access control
* Dashboard with real time metrics and a posts per week chart
* Posts management with markdown editor, cover image upload, and publish or draft control
* Users table with role promotion and account suspension
* Global comment moderation across all posts
* Broadcast push notifications to all users through a Cloudflare Worker
* Admin profile settings

## Tech Stack

* Next.js with the App Router
* TypeScript
* Tailwind CSS
* Firebase Authentication
* Cloud Firestore
* Cloudinary
* Recharts
* react markdown
* lucide react icons

## Architecture

```text
src/
  app/
    (auth)/
      login/
    (dashboard)/
      dashboard/
      posts/
      users/
      comments/
      broadcast/
      settings/
    api/
  components/
  lib/
  types/
```

The application utilizes a client rendered authentication guard pattern to protect the dashboard routes. Instead of performing server side authentication checks which can be complex with Firebase client SDKs, the layout component wraps all protected pages in an authentication provider. This provider listens to the Firebase authentication state and redirects unauthorized users back to the login page before rendering any sensitive content or fetching secure data.

## Screenshots

1. ![Dashboard](screenshots/dashboard.png)
2. ![Posts](screenshots/posts.png)
3. ![Users](screenshots/users.png)
4. ![Comments](screenshots/comments.png)
5. ![Broadcast](screenshots/broadcast.png)
6. ![Settings](screenshots/settings.png)

## Setup and Installation

1. Clone the repository.
2. Copy env example to env local and fill in Firebase and Cloudinary values.
3. Install dependencies.
4. Run the development server.
5. Promote your account to admin using the Android or backend script since signup is not public.

## Deployment

1. Connect your repository to Vercel.
2. Add all environment variables from your env local file into the Vercel project settings.
3. Deploy the project.
4. Add the production domain to the Firebase authorized domains list in your Firebase console.

## Firestore Schema

```json
{
  "users": {
    "uid": {
      "name": "string",
      "email": "string",
      "bio": "string",
      "avatarUrl": "string",
      "isAdmin": "boolean",
      "suspended": "boolean",
      "followersCount": "number",
      "followingCount": "number"
    }
  },
  "posts": {
    "postId": {
      "title": "string",
      "content": "string",
      "authorId": "string",
      "createdAt": "timestamp",
      "tags": ["string"],
      "published": "boolean"
    }
  },
  "comments": {
    "commentId": {
      "postId": "string",
      "authorId": "string",
      "content": "string",
      "createdAt": "timestamp"
    }
  },
  "broadcasts": {
    "broadcastId": {
      "title": "string",
      "body": "string",
      "sentAt": "timestamp",
      "sentBy": "string"
    }
  }
}
```

## Related Project

This application is accompanied by the devjournal android repository. Both projects share the same Firebase project, allowing administrators to manage content from the web while users consume and interact with it on their Android devices.

## License

MIT License
