import { REPORTER_EXTENSION_ID } from '@browseros/diagnostics/contract'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// `entrypoints/newtab/` is WXT's conventional new-tab entrypoint. WXT
// auto-wires manifest.chrome_url_overrides.newtab to point at the
// generated newtab.html, so no hand-rolled override needed.
//
// `browserOS` is BrowserOS Chromium's permission gate for the
// new-tab override and the cockpit-adjacent surfaces.
export default defineConfig({
  outDir: 'dist',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'BrowserRAD',
    externally_connectable: { ids: [REPORTER_EXTENSION_ID] },
    description: 'BrowserRAD — the browser for AI agents.',
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoeT2B52zSiwufLFka/qzTaTKZvsgfdaiz3G0U1fhMKyy9YjdxW3AxgXUWMcgebJP7mzTvUQeVNywy+icAcU6fGG41caxNHUS05MUF6NCoGiix7A/T1GvztavU2/U/MeI8D9LX2pYbd/nqAosIBa4/pgBI394I02FOTapsYMBi+Yqa77r/DC6Cr8wqqYpvfC7w2htzZNW8vnnwaaugSJ1GepQB+gJtAUXWSmSIqgETwsHy7DFgSTvw+zGt0FbsHjT5pgntHEZmcfMeUJMYaq7sF2bpA+0dIApdraDzIc+MsrqYErT35AxX8JBwcH/8yU0AnoR1pyfhtcAPamJI3eCMwIDAQAB',
    // BrowserRAD previews ship updates with the app, never from Neo's feed.
    // Keep shared permissions in sync with apps/app/wxt.config.ts; additions
    // re-prompt or disable existing installs on update.
    permissions: [
      'system.cpu',
      'system.memory',
      'topSites',
      'storage',
      'unlimitedStorage',
      'scripting',
      'tabs',
      'tabGroups',
      'sidePanel',
      'bookmarks',
      'history',
      'browserOS',
      'alarms',
      'webNavigation',
      // Older packaged servers still query this worker for download metadata. New servers
      // use CDP and work with the extension disabled; retain permission during that rollout.
      'downloads',
      'notifications',
      'favicon',
    ],
    // Recording is universal; the local server owns tab attribution.
    host_permissions: ['http://127.0.0.1/*', '<all_urls>'],
    action: {
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        128: 'icon/128.png',
      },
      default_title: 'BrowserRAD',
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    // Vite's default dependency scan crawls every .html under the root and
    // skips build.outDir, but WXT passes outDir as an absolute path, so the
    // skip never matches. A previous run's dist/chrome-mv3-dev/newtab.html is
    // then scanned while WXT deletes it, the scan fails with ENOENT, and dev
    // starts without pre-bundled dependencies. Scan only the source pages.
    optimizeDeps: { entries: ['entrypoints/**/*.html'] },
  }),
})
