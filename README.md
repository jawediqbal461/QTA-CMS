# Quran Tutors Academy CMS

QTA is a React and Vite prototype for Quran tutor discovery, courses, and lesson operations. Use synthetic data in this build. The portals and admin login use browser-local demo state.

## Local development

Use Node.js 24, which matches CI.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The current app runs without an API key.

## Verification

```sh
npm run lint
npm run build
npm run preview -- --host 127.0.0.1
```

The GitHub Actions workflow runs a clean install, TypeScript checks, and the production build on pull requests and pushes to main. A staging host for the build must support single-page app fallback so deep links such as `/tutors` load on refresh.

See the [project plan](PROJECT_PLAN.md) for delivery phases and release gates.
