# route-53-backend

> Scaffolded with [create-express-modular](https://create-express-modular.lovable.app/) (cem)

A production-ready, domain-driven **Express + TypeScript** backend.

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express |
| Language | TypeScript |
| Database / ORM | Mongoose (MongoDB) |
| Validation | Zod |
| Auth | JWT (bcrypt + rate limiting) — HTTP-only cookies |

## Getting Started

```bash
# Install dependencies (already done by CEM)
npm install

# Start the dev server with hot reload
cem dev
```

Your server will be running at `http://localhost:5000`.

Visit the root URL in a browser to see the **CEM Welcome Page** — a styled landing page showing project info, server status, and available routes.

## Available Scripts

| Command | Description |
|---|---|
| `cem dev` | Start dev server with live reload |
| `cem build` | Convention guards + compile TypeScript to `dist/` |
| `cem start` | Start the production server with preflight checks |
| `cem check` | Type-check, lint, and format check in one command |
| `cem list` | List all modules, middlewares, and env vars |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run prettier:fix` | Format code with Prettier |

## Package Manager (npm)

This project was scaffolded with **npm**. Use it for all package operations:

```bash
# Install a production dependency
npm install <package>

# Install a dev dependency
npm install -D <package>

# Remove a package
npm uninstall <package>

# Re-install all dependencies
npm install
```

> `cem dev`, `cem build`, `cem check`, and `cem start` are **package-manager-agnostic** —
> they invoke tools directly from `node_modules/.bin/` and work the same regardless of which PM you use.

## Adding Features

### Add a module

```bash
cem add module Product
```

Creates a complete `Product` module in `src/app/modules/Product/` (controller, service, route, model, interface, validation) and auto-registers it in your router.

### Add a middleware

```bash
cem add middleware rateLimiter
```

### Add an environment variable

```bash
cem add env STRIPE_SECRET_KEY
```

Adds the variable to `.env`, `.env.example`, and `src/app/config/index.ts` simultaneously.

## Removing Features

```bash
cem remove module Product      # deletes folder + unwires route
cem remove middleware logger    # deletes the middleware file
cem remove env STRIPE_SECRET_KEY
```

## Project Structure

```
route-53-backend/
├── src/
│   ├── app/
│   │   ├── config/
│   │   │   └── index.ts             # Central config (all env vars)
│   │   ├── errors/                   # Error handler helpers
│   │   ├── interfaces/               # Shared TypeScript types
│   │   ├── middlewares/
│   │   │   ├── globalErrorHandler.middleware.ts
│   │   │   └── notFound.middleware.ts
│   │   │   ├── auth.middleware.ts
│   │   │   └── rateLimiter.middleware.ts
│   │   ├── modules/
│   │   │   └── Auth/             # JWT Auth module
│   │   ├── routes/
│   │   │   └── index.ts             # Unified routing registry
│   │   └── utils/
│   │       ├── catchAsync.ts
│   │       ├── sendResponse.ts
│   │       ├── validateRequest.ts
│   │       ├── welcomePage.ts
│   │       └── logger.ts
│   ├── app.ts
│   └── server.ts
├── .env
├── .env.example
├── eslint.config.mjs
├── tsconfig.json
└── package.json
```

## Error Handling

The `globalErrorHandler` middleware is **stack-aware** — it maps database and validation errors into a consistent JSON response:

```json
{
  "success": false,
  "message": "Validation Error",
  "errorSources": [
    { "path": "email", "message": "Invalid email address" }
  ]
}
```

---

Built with [`create-express-modular`](https://create-express-modular.lovable.app/) — stop scaffolding, start shipping.
