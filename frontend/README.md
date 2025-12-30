# Frontend

This project was generated with Angular CLI version 17.

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

The development server is configured with a proxy to forward `/api` requests to the backend server running on `http://localhost:8080`.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `npm test` to execute the unit tests via Karma.

## Project Structure

- `src/app/layout/` - App shell layout with navigation
- `src/app/pages/` - Application pages (Dashboard, Annonces, Dossiers)
- `src/environments/` - Environment configuration files
- `proxy.conf.json` - Development proxy configuration for API requests

## Environment Configuration

- `environment.ts` - Development environment (uses proxy: `http://localhost:4200/api`)
- `environment.prod.ts` - Production environment (uses: `/api`)

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
