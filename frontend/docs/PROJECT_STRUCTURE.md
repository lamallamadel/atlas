# Angular Frontend Project Structure

## Overview
Angular 17 workspace with routing, app shell layout, and placeholder pages.

## Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout/
│   │   │   └── app-layout/          # Main app shell with navigation
│   │   │       ├── app-layout.component.ts
│   │   │       ├── app-layout.component.html
│   │   │       ├── app-layout.component.css
│   │   │       └── app-layout.component.spec.ts
│   │   ├── pages/
│   │   │   ├── dashboard/           # Dashboard page (placeholder)
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   ├── dashboard.component.css
│   │   │   │   └── dashboard.component.spec.ts
│   │   │   ├── annonces/            # Annonces page (placeholder)
│   │   │   │   ├── annonces.component.ts
│   │   │   │   ├── annonces.component.html
│   │   │   │   ├── annonces.component.css
│   │   │   │   └── annonces.component.spec.ts
│   │   │   └── dossiers/            # Dossiers page (placeholder)
│   │   │       ├── dossiers.component.ts
│   │   │       ├── dossiers.component.html
│   │   │       ├── dossiers.component.css
│   │   │       └── dossiers.component.spec.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.css
│   │   ├── app.component.spec.ts
│   │   ├── app.module.ts            # Main app module
│   │   └── app-routing.module.ts    # Routing configuration
│   ├── assets/                      # Static assets
│   ├── environments/
│   │   ├── environment.ts           # Development environment
│   │   └── environment.prod.ts      # Production environment
│   ├── index.html                   # Main HTML file
│   ├── main.ts                      # Application entry point
│   ├── styles.css                   # Global styles
│   └── favicon.ico                  # App icon
├── angular.json                     # Angular workspace configuration
├── package.json                     # NPM dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.app.json                # App-specific TypeScript config
├── tsconfig.spec.json               # Test-specific TypeScript config
├── karma.conf.js                    # Karma test runner configuration
├── proxy.conf.json                  # Development proxy configuration
├── .browserslistrc                  # Browser support configuration
├── .editorconfig                    # Editor configuration
├── .gitignore                       # Git ignore rules
└── README.md                        # Project documentation

```

## Key Features

### 1. Routing Module
- Configured in `app-routing.module.ts`
- Routes:
  - `/` → Redirects to `/dashboard`
  - `/dashboard` → Dashboard page
  - `/annonces` → Annonces page
  - `/dossiers` → Dossiers page

### 2. App Shell Layout
- Located in `src/app/layout/app-layout/`
- Features:
  - Sticky header with app title
  - Sidebar navigation with links to all pages
  - Responsive design with mobile menu toggle
  - Main content area with router outlet

### 3. Environment Configuration
- **Development** (`environment.ts`):
  - `apiBaseUrl: 'http://localhost:4200/api'`
  - Uses proxy configuration to forward API requests

- **Production** (`environment.prod.ts`):
  - `apiBaseUrl: '/api'`
  - Direct API calls (assumes frontend and backend served from same domain)

### 4. Proxy Configuration
- File: `proxy.conf.json`
- Forwards all `/api` requests to `http://localhost:8080` during development
- Enables CORS-free development with separate frontend/backend servers

## Getting Started

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```
   Application runs on `http://localhost:4200`

3. Build for production:
   ```bash
   npm run build
   ```

## Development Workflow

- Frontend dev server: `http://localhost:4200`
- Backend server (proxied): `http://localhost:8080`
- API requests from frontend go to `/api/*` and are proxied to backend

## Next Steps

The placeholder pages (Dashboard, Annonces, Dossiers) are ready to be implemented with:
- Component logic
- Service integration
- API calls using the configured environment URLs
- Forms and data display
