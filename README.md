# DevFeed

DevFeed is a personal publishing platform for building in public. It combines long-form articles, short notes, project updates, bookmarks, profile pages, and admin tools into one timeline-driven site.

The goal is to make the site feel less like a traditional blog and more like a live public journal: readers can browse the feed, open any day of activity, filter by content type or tag, save posts, react to updates, and follow along with what is currently being built.

## What the project does

DevFeed supports the full publishing workflow for a small creator-led site:

- Publish and manage multiple content types, including articles, notes, projects, and updates.
- Show all recent publishing activity in a unified timeline on the home page.
- Render a platform activity grid that highlights days with published content.
- Provide individual detail pages for posts, tags, and daily activity views.
- Support sign in, sign up, profile, bookmarks, and unsubscribe flows.
- Offer an admin dashboard for content management, subscriber management, and analytics.
- Generate SEO metadata, a sitemap, robots rules, and an RSS feed.
- Store data locally with Prisma and SQLite for local testing.
- Run inside Docker for a repeatable containerized setup.

## Main features

### Content and publishing

- Unified timeline feed on the home page.
- Dedicated pages for articles, notes, projects, tags, and individual posts.
- Admin and writer workflows for creating and editing posts.
- Bookmarking and reaction support for signed-in readers.
- Rich text and markdown-based publishing support.

### Engagement and activity

- Platform activity calendar that shows publishing volume by day.
- Daily activity pages that list everything published on a selected date.
- Reader bookmarks and reactions stored per user.
- Newsletter signup and unsubscribe handling.

### Account and access control

- Clerk authentication for sign in and sign up.
- Role-based access control for admin, writer, and viewer behavior.
- Profile page with stats, bookmarks, and user details.
- Server-side route protection for admin and creator-only flows.

### Admin and analytics

- Admin control panel for posts, users, and subscribers.
- Analytics summaries for views, visitors, posts, and popular tags.
- Subscriber export and moderation support.
- Activity and traffic panels designed for quick at-a-glance monitoring.

### SEO and distribution

- Dynamic metadata for the app and content pages.
- RSS feed output at /feed.xml.
- Sitemap and robots support.
- Canonical-friendly content pages for search engines.

## Tech stack

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma 7
- SQLite for local testing and self-hosted runs
- Clerk for authentication
- Docker and Docker Compose for containerized runs
- Lucide React for icons
- Framer Motion for motion where needed

## Project structure

- src/app: route segments, pages, API routes, and metadata files
- src/components: shared UI components
- src/lib: database access, authentication sync, and server actions
- prisma: schema, seed script, and cleanup scripts
- public: static assets
- emails: generated or reference email templates

## Installation

### Prerequisites

- Node.js 20 or newer
- npm
- A Clerk application with publishable and secret keys
- SQLite support through Prisma, which is already configured for local use

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a .env.local file with the values required by Clerk and Prisma:

```ini
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL="file:./dev.db"
```

Notes:

- The Clerk keys should come from your own Clerk project.
- Keep secrets in environment variables and do not commit them to source control.
- The SQLite database file is created locally by Prisma when you push the schema.

### Create the database

Sync the Prisma schema to create the local database file:

```bash
npx prisma db push
```

### Seed sample content

Populate the app with sample posts, tags, comments, reactions, subscribers, and activity history:

```bash
npx tsx prisma/seed.ts
```

### Run the app locally

```bash
npm run dev
```

Then open http://localhost:3000.

### Verify the production build

Before pushing, run the production build locally to catch deployment issues early:

```bash
npm run build
```

## Available scripts

- npm run dev: start the local server
- npm run build: build the production bundle
- npm run start: run the production server
- npm run lint: run ESLint

## Local routes

- /: home timeline and platform activity grid
- /articles: long-form article feed
- /notes: short notes feed
- /projects: project showcase
- /post/[slug]: individual post detail page
- /tag/[tagName]: posts filtered by tag
- /activity/[date]: posts published on a specific date
- /profile: signed-in user profile and bookmarks
- /bookmarks: saved content view
- /write: editor for new content
- /edit-post/[id]: editor for existing content
- /admin: admin dashboard
- /sign-in and /sign-up: Clerk authentication routes
- /feed.xml: RSS feed
- /unsubscribe: newsletter unsubscribe flow

## Data model overview

DevFeed uses Prisma with a small set of core records:

- Users with roles and profile data
- Posts with content type, status, publish state, and authorship
- Tags for categorizing posts
- Comments and reactions for engagement
- Bookmarks for saved content
- Page views and subscriber records for analytics and newsletters

## Docker

Start the app in Docker with Compose:

```bash
docker-compose up --build -d
```

To seed data inside the running container:

```bash
docker-compose exec web npx tsx prisma/seed.ts
```

Docker is the simplest way to run the project in a repeatable environment if you do not want to install the database and Node dependencies manually on the host machine.

## Deployment notes

The app can run on Vercel, but the default SQLite setup is best for local testing or containerized use. For production deployments with serverless infrastructure, switch Prisma to a managed database such as PostgreSQL or MySQL and update DATABASE_URL accordingly.

If you deploy to a platform with ephemeral storage, do not rely on the local SQLite file for persistent data.

Set NEXT_PUBLIC_APP_URL to your deployed Vercel URL or custom domain so email links and unsubscribe links resolve correctly.

For Vercel deployments:

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add the environment variables from .env.example in the Vercel project settings.
4. Replace SQLite with a managed database if you need persistent production data.
5. Run the production build check locally with npm run build before each release.

## Deployment readiness

- The home page and major feeds are server-rendered and fetch initial data on load.
- The activity grid hydrates with real publishing counts immediately.
- The app uses server actions and API routes for content and analytics workflows.
- The README and internal markdown files are kept plain and do not use decorative emoji headings.

## License

This repository does not currently include a license file. Add one if you intend to publish or share the project outside your own workspace.