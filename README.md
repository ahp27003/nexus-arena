# Nexus Arena

## Project Overview
Nexus Arena is a modern gaming team platform built with React, TypeScript, Vite, shadcn-ui, and Tailwind CSS. It integrates with Supabase for backend services, including authentication, storage, and real-time features. The platform enables gamers to find teams, join tournaments, and communicate in real-time through global, team, and direct chats.

## Features
- **Team Management**: Create, join, and manage gaming teams across multiple games
- **Real-time Chat**: Global, team, and direct messaging with persistent history
- **User Profiles**: Customizable profiles with avatars, skill levels, and game preferences
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **PWA Support**: Install as a Progressive Web App for offline capabilities
- **Modern Tech Stack**:
  - React with TypeScript for type safety
  - Vite for fast builds and development
  - shadcn-ui components and Tailwind CSS for beautiful UI
  - Supabase for authentication, database, and real-time features

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### Setup
```sh
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd nexus-arena

# 2. Install dependencies
npm install

# 3. Configure environment variables
# (Set up your Supabase project and add the required keys in a .env file)

# 4. Run the development server
npm run dev
```

### Development
- Edit source files in `src/` to customize components, pages, hooks, and integrations.
- Use `npm run lint` to check code quality.
- Build for production with `npm run build`.

### Deployment

#### Cloudflare Pages Deployment
1. Push your code to a GitHub repository
2. Log in to Cloudflare Dashboard
3. Go to Pages > Create a project
4. Connect your GitHub repository
5. Configure build settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
6. Deploy!

#### Other Platforms
- The project can also be deployed on Vercel, Netlify, or your own infrastructure
- Configure environment variables as required by your deployment target

## Backend Integration

### Supabase
Nexus Arena uses Supabase for backend services:
- **Authentication:** User sign-up, login, and profile management
- **Database:** Real-time data and relational storage with the following tables:
  - `profiles`: User profiles with gaming preferences and skills
  - `teams`: Gaming teams with details like game, region, and rank
  - `team_members`: Connects users to teams with roles
  - `chats`: Chat rooms (global, team, direct)
  - `chat_participants`: Users participating in chats
  - `messages`: Chat messages with real-time updates
- **Storage:** File uploads and management for avatars and team logos
- **Real-time subscriptions**: For instant message updates and notifications

### Backend Function: `setup-storage`
Located at `supabase/functions/setup-storage/index.ts`, this Deno function:
- Ensures an 'avatars' storage bucket exists (creates it if missing)
- Ensures all users are added to the default global chat
- Handles CORS for secure API access
- Returns success or error responses as JSON

## Customization
- Update metadata and branding in `index.html` and other files as needed
- Add or remove dependencies in `package.json`
- Extend backend logic by adding new Supabase functions in `supabase/functions/`
- Modify the PWA configuration in `public/manifest.json`
- Update SEO settings in `index.html` and `public/sitemap.xml`

## Progressive Web App (PWA)
Nexus Arena is configured as a Progressive Web App, allowing users to install it on their devices for offline access. Key PWA features include:
- Installable on desktop and mobile devices
- Offline capability with service worker caching
- Fast loading with optimized assets
- Push notifications (coming soon)

## Performance Optimizations
- Chunked JavaScript bundles for faster loading
- Optimized image loading with lazy loading
- Efficient caching strategies with service worker
- Minified production builds

## License
MIT

---
For issues or contributions, please open a pull request or issue on GitHub.
