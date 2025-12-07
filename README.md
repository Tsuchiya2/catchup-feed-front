# Catchup Feed Web

<p align="center">
  <strong>A modern RSS/Atom feed reader with AI-powered article summaries</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#testing">Testing</a> •
  <a href="#project-structure">Project Structure</a>
</p>

---

## Overview

**Catchup Feed Web** is a Next.js frontend application for the [Catchup Feed](https://github.com/Tsuchiya2/catchup-feed) ecosystem — an automated RSS/Atom feed aggregation service with AI-powered article summarization.

This project demonstrates modern full-stack development practices through a clean microservices architecture, comprehensive testing, and type-safe API integration.

### Key Highlights

- **Microservices Architecture**: Decoupled frontend and backend for independent scaling and deployment
- **Type-Safe Development**: End-to-end TypeScript with API types generated from OpenAPI specification
- **Modern React Patterns**: Server components, TanStack Query, and custom hooks
- **Production Ready**: Authentication, error handling, and accessibility compliance

---

## Features

### Authentication & Security
- JWT-based authentication with secure token management
- Protected routes with middleware-level access control
- Automatic session handling and redirect flows

### Content Management
- **Dashboard**: Overview statistics and recent article feed
- **Article Browser**: Paginated list with responsive card layout
- **Article Detail**: Full content view with AI-generated summaries
- **Source Catalog**: Browse registered RSS/Atom feed sources

### User Experience
- Responsive design (mobile-first approach)
- Loading states with skeleton placeholders
- Error boundaries with retry functionality
- Empty state handling for all scenarios

---

## Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | Server-side rendering & routing |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict) | Type safety |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) | Accessible, customizable components |
| **Data Fetching** | [TanStack Query 5](https://tanstack.com/query) | Server state management & caching |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Type-safe validation |
| **Testing** | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) | Unit & integration tests |
| **API Types** | [openapi-typescript](https://openapi-ts.pages.dev/) | Generated from OpenAPI spec |
| **Linting** | [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) | Code quality |

---

## Architecture

This project follows a **microservices architecture**, separating concerns between the frontend and backend:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (This Repo)                      │
│                     catchup-feed-web                         │
│                        (Next.js)                             │
│                                                              │
│   • Server-Side Rendering (SSR)                              │
│   • JWT Authentication                                       │
│   • Type-safe API Client                                     │
│   • Deployment: Vercel / Cloudflare Pages                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST API (OpenAPI)
                            │ JWT Bearer Token
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│              github.com/Tsuchiya2/catchup-feed               │
│                        (Go API)                              │
│                                                              │
│   • Article & Source Management                              │
│   • AI Summarization (Claude / OpenAI)                       │
│   • RSS/Atom Feed Crawling                                   │
│   • Notification System (Discord, Slack)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   PostgreSQL    │
                   └─────────────────┘
```

### API Integration

Type-safe API communication is achieved through:

1. **Generated Types**: API types are auto-generated from the backend's OpenAPI specification
2. **Custom HTTP Client**: Centralized client with automatic token injection and error handling
3. **Domain-Specific Endpoints**: Organized endpoint functions for auth, articles, and sources

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)
- Backend API running ([catchup-feed](https://github.com/Tsuchiya2/catchup-feed))

### Installation

```bash
# Clone the repository
git clone https://github.com/Tsuchiya2/catchup-feed-web.git
cd catchup-feed-web

# Install dependencies
npm install

# Generate API types from OpenAPI spec (optional)
npm run generate:api
```

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080  # Backend API URL
```

### Docker

```bash
# Run with Docker Compose
docker compose up -d
```

---

## Testing

This project maintains comprehensive test coverage using Vitest and Testing Library.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Coverage

| Area | Coverage |
|------|----------|
| Components | UI components, forms, cards |
| Hooks | Custom React hooks |
| API Client | HTTP client and error handling |
| Utilities | Date formatting, token management |

---

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth routes (login)
│   ├── (protected)/            # Protected routes
│   │   ├── articles/           # Article pages
│   │   ├── dashboard/          # Dashboard
│   │   └── sources/            # Source pages
│   └── api/                    # API routes
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── articles/               # Article components
│   ├── auth/                   # Auth components
│   ├── dashboard/              # Dashboard components
│   ├── layout/                 # Layout components
│   └── common/                 # Shared components
├── lib/
│   ├── api/                    # API client & endpoints
│   └── auth/                   # Auth utilities
├── hooks/                      # Custom React hooks
├── providers/                  # Context providers
├── types/                      # TypeScript types
└── middleware.ts               # Route protection
```

---

## Code Quality

### Standards & Practices

- **TypeScript Strict Mode**: Full type coverage with no implicit any
- **Component Documentation**: JSDoc comments on public APIs
- **Accessibility**: WCAG 2.1 AA compliance target
- **Error Handling**: Comprehensive error boundaries and user feedback

### Linting & Formatting

```bash
# Check code quality
npm run lint

# Format code
npm run format
```

---

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/token` | POST | No | Obtain JWT token |
| `/articles` | GET | Yes | List articles (paginated) |
| `/articles/{id}` | GET | Yes | Get article with AI summary |
| `/sources` | GET | Yes | List feed sources |
| `/sources/{id}` | GET | Yes | Get source details |
| `/health` | GET | No | Health check |

---

## Roadmap

### Planned Features

- [ ] Article bookmarking
- [ ] Advanced search & filtering
- [ ] Dark mode toggle
- [ ] User preferences
- [ ] E2E tests with Playwright

### Future Enhancements

- Token refresh mechanism
- PWA support
- RSS feed subscription management
- Custom notification preferences

---

## Related Projects

- **[catchup-feed](https://github.com/Tsuchiya2/catchup-feed)** - Go backend API for feed aggregation and AI summarization

---

## Documentation

- [Requirements Document](./docs/requirements.md) - Detailed project requirements and specifications

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

<p align="center">
  Built with Next.js, TypeScript, and Tailwind CSS
</p>
