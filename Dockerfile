# =============================================================================
# catchup-feed-frontend Dockerfile (Development Only)
# =============================================================================
# This Dockerfile is for local development only.
# Production deployment is handled by Vercel.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
# Install and cache npm dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install dependencies with clean install for reproducible builds
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Development
# -----------------------------------------------------------------------------
# Development environment with hot reload support
FROM node:20-alpine AS dev

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code (will be overridden by volume mounts in development)
COPY . .

# Expose Next.js development server port
EXPOSE 3000

# Start Next.js development server
CMD ["npm", "run", "dev"]
