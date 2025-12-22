/**
 * PWA Configuration
 *
 * Centralized configuration for Progressive Web App features.
 * Includes manifest values, theme colors, and app metadata.
 *
 * @module config/pwa
 */

/**
 * PWA Theme Configuration
 */
export interface PWAThemeConfig {
  /** Primary theme color (used in browser UI) */
  themeColor: string;
  /** Background color for splash screen */
  backgroundColor: string;
}

/**
 * PWA Icon Configuration
 */
export interface PWAIconConfig {
  /** Icon source path */
  src: string;
  /** Icon sizes (e.g., "192x192") */
  sizes: string;
  /** Icon type (e.g., "image/png") */
  type: string;
  /** Icon purpose (e.g., "any", "maskable") */
  purpose?: string;
}

/**
 * PWA App Shortcut Configuration
 */
export interface PWAShortcutConfig {
  /** Shortcut name */
  name: string;
  /** Shortcut short name */
  short_name?: string;
  /** Shortcut description */
  description: string;
  /** Target URL */
  url: string;
  /** Shortcut icon */
  icons?: PWAIconConfig[];
}

/**
 * Complete PWA Configuration
 */
export interface PWAConfig {
  /** Application name */
  name: string;
  /** Short name for home screen */
  shortName: string;
  /** Application description */
  description: string;
  /** Start URL */
  startUrl: string;
  /** Display mode */
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  /** Theme configuration */
  theme: PWAThemeConfig;
  /** App icons */
  icons: PWAIconConfig[];
  /** App shortcuts */
  shortcuts: PWAShortcutConfig[];
}

/**
 * PWA Configuration Object
 *
 * This configuration is used to generate the web app manifest
 * and configure PWA-related metadata.
 */
export const pwaConfig: PWAConfig = {
  name: 'Catchup Feed',
  shortName: 'Catchup',
  description: 'Your personal feed aggregator and reader',
  startUrl: '/',
  display: 'standalone',

  theme: {
    themeColor: '#0ea5e9', // Sky-500 from Tailwind
    backgroundColor: '#ffffff',
  },

  icons: [
    {
      src: '/icons/icon-72x72.png',
      sizes: '72x72',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-96x96.png',
      sizes: '96x96',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-128x128.png',
      sizes: '128x128',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-144x144.png',
      sizes: '144x144',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-152x152.png',
      sizes: '152x152',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],

  shortcuts: [
    {
      name: 'View Articles',
      short_name: 'Articles',
      description: 'Browse your latest articles',
      url: '/articles',
      icons: [
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
        },
      ],
    },
    {
      name: 'View Sources',
      short_name: 'Sources',
      description: 'Manage your feed sources',
      url: '/sources',
      icons: [
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
        },
      ],
    },
    {
      name: 'Search',
      short_name: 'Search',
      description: 'Search articles',
      url: '/articles?search=',
      icons: [
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
        },
      ],
    },
  ],
};
