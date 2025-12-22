# PWA Implementation Guide

This document describes the Progressive Web App (PWA) implementation for Catchup Feed.

## Overview

Catchup Feed is configured as a Progressive Web App, allowing users to install the application on their devices and use it offline. The PWA implementation includes:

- Service Worker for offline functionality
- Web App Manifest for installability
- Install prompts for better user experience
- Update notifications for seamless updates
- Runtime caching strategies for optimal performance

## Features

### 1. Installability

Users can install Catchup Feed on their devices as a standalone application:

- **Desktop**: Install via browser's install button or custom install prompt
- **Mobile**: Add to home screen via browser menu or custom prompt
- **Offline Support**: Access cached content when offline

### 2. Service Worker

The service worker provides offline functionality and caching:

- **Location**: `/public/sw.js` (auto-generated during build)
- **Registration**: Automatic (handled by next-pwa)
- **Scope**: Entire application (`/`)

### 3. Caching Strategies

Different resources use optimized caching strategies:

#### Google Fonts (CacheFirst - 1 year)
- Fonts are cached first and used from cache
- Reduces load time and bandwidth usage
- Cache duration: 365 days

#### Images (CacheFirst - 30 days)
- Images (PNG, JPG, JPEG, SVG, GIF, WebP, ICO) are cached first
- Improves page load performance
- Cache duration: 30 days

#### Static Resources (StaleWhileRevalidate - 1 day)
- JS, CSS, and font files use stale-while-revalidate
- Serves cached version while fetching updates in background
- Cache duration: 1 day

#### API Calls (NetworkFirst - 1 hour)
- API requests try network first with 10s timeout
- Falls back to cache if network fails
- Cache duration: 1 hour
- Network timeout: 10 seconds

## Configuration Files

### Web App Manifest

**Location**: `/public/manifest.json`

Key properties:
- **Name**: Catchup Feed
- **Short Name**: Catchup
- **Start URL**: `/`
- **Display Mode**: standalone
- **Theme Color**: `#0ea5e9` (Sky-500)
- **Background Color**: `#ffffff`

Includes:
- 8 icon sizes (72x72 to 512x512)
- Maskable icons for adaptive appearance
- App shortcuts for quick access

### PWA Configuration

**Location**: `/src/config/pwa.config.ts`

Centralized PWA configuration including:
- Theme colors
- Icon definitions
- App shortcuts
- Manifest values

### Next.js Configuration

**Location**: `/next.config.ts`

PWA is configured using `next-pwa`:
- Disabled in development for faster iteration
- Service worker auto-registration enabled
- Runtime caching strategies defined
- Integrated with existing bundle analyzer and security headers

## Components

### PWAInstallPrompt

**Location**: `/src/components/common/PWAInstallPrompt.tsx`

Custom install prompt that:
- Listens for `beforeinstallprompt` event
- Shows when browser supports PWA installation
- Persists dismissal state for 7 days
- Tracks install events with metrics
- Fully accessible (keyboard navigation, ARIA labels)

### PWAUpdateNotification

**Location**: `/src/components/common/PWAUpdateNotification.tsx`

Update notification that:
- Detects service worker updates using Workbox Window
- Shows notification when update is available
- Allows user to reload and apply update
- Tracks update events with metrics
- Checks for updates every 5 minutes

### Layout Integration

**Location**: `/src/app/layout.tsx`

PWA components are integrated in the root layout:
- Wrapped in `FeatureGate` component (only shown when PWA feature enabled)
- Wrapped in `FeatureErrorBoundary` (prevents errors from breaking app)
- Added to all pages automatically

## Icons

### Generation

**Location**: `/public/icons/`

Icons are generated from SVG source:
- **Source**: `/public/icons/icon.svg`
- **Script**: `/scripts/generate-icons.js`
- **Sizes**: 72, 96, 128, 144, 152, 192, 384, 512 (pixels)

To regenerate icons:
```bash
node scripts/generate-icons.js
```

### Icon Design

Current icon features:
- Sky blue background (`#0ea5e9`)
- White RSS feed symbol
- Rounded corners (128px border radius)
- Supports maskable format

## Enabling PWA Features

PWA features are controlled by feature flag in `/src/config/app.config.ts`:

```typescript
features: {
  pwa: getEnvBool('NEXT_PUBLIC_FEATURE_PWA', false),
}
```

To enable in production:
```bash
export NEXT_PUBLIC_FEATURE_PWA=true
```

Or add to `.env.production`:
```
NEXT_PUBLIC_FEATURE_PWA=true
```

## Metrics Tracking

PWA events are tracked using the observability metrics system:

- **Install**: `metrics.pwa.install()` - Tracks when app is installed
- **Update**: `metrics.pwa.update()` - Tracks when update is detected
- **Service Worker Activation**: `metrics.pwa.swActivation()` - Tracks SW activation

Metrics are sent to Sentry when enabled.

## Development

### Running in Development

PWA is disabled in development mode by default for faster hot reloading:

```bash
npm run dev
```

Service worker is not active in development.

### Testing PWA Features

To test PWA features locally:

1. Build the production version:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

3. Open browser DevTools:
   - **Application tab**: View manifest, service worker, cache storage
   - **Lighthouse**: Run PWA audit
   - **Network tab**: Test offline functionality

4. Install the app:
   - Chrome/Edge: Click install button or use custom prompt
   - Safari: Use share menu → "Add to Home Screen"

### Testing Offline

1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Reload the page
4. Cached content should load successfully

## Production Deployment

### Pre-deployment Checklist

- [ ] PWA feature flag enabled (`NEXT_PUBLIC_FEATURE_PWA=true`)
- [ ] Icons generated and optimized
- [ ] Manifest values reviewed (name, colors, start URL)
- [ ] Service worker caching strategies configured
- [ ] Build passes without errors
- [ ] Lighthouse PWA audit score > 90

### Build Command

```bash
npm run build
```

This will:
1. Build Next.js application
2. Generate service worker (`/public/sw.js`)
3. Generate Workbox runtime (`/public/workbox-*.js`)
4. Configure runtime caching

### Verification

After deployment, verify:

1. **Manifest**: `https://yourdomain.com/manifest.json`
2. **Service Worker**: `https://yourdomain.com/sw.js`
3. **Icons**: `https://yourdomain.com/icons/icon-192x192.png`

Run Lighthouse audit:
```bash
npx lighthouse https://yourdomain.com --view
```

## Browser Support

PWA features are supported in:

- **Chrome/Edge**: Full support (desktop and mobile)
- **Safari**: Partial support (iOS 11.3+, macOS 10.15+)
- **Firefox**: Full support (desktop and mobile)
- **Opera**: Full support

Note: Install prompt and some features may vary by browser.

## Troubleshooting

### Service Worker Not Registering

1. Check browser console for errors
2. Verify service worker is generated in `/public/sw.js`
3. Ensure HTTPS is enabled (required for SW)
4. Check PWA feature flag is enabled

### Install Prompt Not Showing

1. Verify PWA criteria are met (manifest, service worker, HTTPS)
2. Check if already installed (won't show again)
3. Verify feature flag is enabled
4. Check localStorage for dismissal state (key: `pwa-install-prompt-dismissed`)

### Cache Not Working

1. Open DevTools → Application → Cache Storage
2. Verify caches are created (`google-fonts-cache`, `image-cache`, etc.)
3. Check Network tab for cache hits
4. Clear cache and reload

### Update Not Detected

1. Check service worker is updated in DevTools
2. Verify update check interval (5 minutes)
3. Check browser console for Workbox logs
4. Force update by unregistering SW and reloading

## Future Enhancements

Potential improvements for future releases:

1. **Push Notifications**: Notify users of new articles
2. **Background Sync**: Sync data when connection restored
3. **Periodic Sync**: Fetch new articles in background
4. **Share Target API**: Share articles to Catchup Feed
5. **Badge API**: Show unread count on app icon
6. **Shortcuts**: Add more dynamic shortcuts
7. **Screenshots**: Add to manifest for better app store listings

## References

- [Next PWA Documentation](https://github.com/shadowwalker/next-pwa)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web App Manifest MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
