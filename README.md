# Motorcycle Care

A mobile-first Progressive Web App for tracking your own motorcycles' basic
information. Built for personal, offline use — there is no backend, no
account, and no cloud sync. All data lives on your device in IndexedDB.

## Technology

- React + TypeScript + Vite
- React Router (client-side routing)
- Dexie (IndexedDB wrapper) for local persistence
- vite-plugin-pwa (installable app + offline app shell)
- Plain CSS / CSS Modules (no UI framework)

## Local development

```bash
npm install
npm run dev
```

Other useful commands:

```bash
npm run lint     # ESLint
npm run build    # Type-check (tsc -b) + production build + PWA assets
npm run preview  # Serve the production build locally
```

## Installing as a PWA (iPhone)

1. Run `npm run build && npm run preview` (or deploy the `dist/` output to any
   static host over HTTPS).
2. Open the URL in Safari on iPhone.
3. Tap the Share icon → **Add to Home Screen**.
4. Launch the app from the Home Screen icon — it opens in standalone mode.

## Offline behavior

Once the app has been loaded (and installed) one time, the app shell is
cached by a service worker. Vehicle data lives in IndexedDB on the device, so
viewing, adding, editing, and deleting vehicles all continue to work with no
network connection.

## M1 scope

- PWA foundation (manifest, service worker, offline app shell)
- Dashboard with vehicle count and recently updated vehicles
- Vehicle list, add, edit, detail, and delete (with confirmation)
- IndexedDB persistence via Dexie, isolated behind a repository layer
- Basic form validation (required fields, odometer >= 0, trimmed input)
- Mobile-first bottom navigation (Dashboard / Vehicles / Settings)

Not implemented in M1 (by design): maintenance records, receipt/image
attachments, backup/restore, cloud sync, authentication, and reminders.

## Future milestones

- **M2**: Maintenance records per vehicle
- **M3**: Receipt/photo attachments
- **M4**: Local backup/restore (export/import)

The project structure (`features/vehicles`, `features/maintenance`,
`features/attachments`, `features/backup`) and the Dexie migration setup in
`src/db/migrations.ts` are designed so these can be added as new feature
folders and new Dexie tables without reworking existing code.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
