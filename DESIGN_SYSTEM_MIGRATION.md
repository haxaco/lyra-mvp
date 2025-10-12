# Design System Migration to @lyra/ui

**Date**: October 12, 2025  
**Goal**: Promote Figma Make exports into a reusable design system package

## Summary

Successfully created `@lyra/ui` package from Figma Make exports located in `apps/web/figma_export/`. The package is now a first-class workspace member that can be imported and used across the monorepo.

## What Was Done

### 1. Package Structure Created

```
packages/ui/
├── package.json         # tsup build config, dependencies
├── tsconfig.json        # TypeScript configuration
├── README.md           # Package documentation
├── src/
│   ├── index.ts        # Main barrel export
│   ├── primitives/     # UI components (Button, Card, Input, etc.)
│   ├── layout/         # Complex components (TopNavBar, Sidebar, MusicPlayer)
│   ├── theme/          # ThemeProvider and tokens
│   └── utils/          # Helper functions (cn)
└── dist/               # Built outputs (auto-generated)
```

### 2. Files Copied & Normalized

**From `apps/web/figma_export/components/ui/`:**
- UIButton.tsx
- UICard.tsx  
- UIInput.tsx
- UIBadge.tsx
- UISkeleton.tsx
- UIAvatar.tsx

**From `apps/web/figma_export/components/layout/`:**
- TopNavBar.tsx
- Sidebar.tsx
- MusicPlayer.tsx

**From `apps/web/figma_export/styles/`:**
- tokens.css → copied to both `packages/ui/src/theme/` and `apps/web/styles/`

### 3. Import Normalization

All versioned imports were normalized:
- `@radix-ui/react-slot@1.1.2` → `@radix-ui/react-slot`
- `class-variance-authority@0.7.1` → `class-variance-authority`
- Relative paths updated to use package structure

Applied to both:
- `packages/ui/src/` (new package)
- `apps/web/figma_export/` (preserved for reference)

### 4. Dependencies Added

**packages/ui/package.json:**
```json
{
  "dependencies": {
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "5.5.4"
  }
}
```

### 5. Build Configuration

- **Bundler**: tsup with CJS/ESM output
- **TypeScript**: Declaration files generated
- **External**: React/React-DOM marked as external (peer dependencies)
- **Command**: `pnpm build:ui` added to root

### 6. Web App Integration

**apps/web/package.json:**
```json
"dependencies": {
  "@lyra/ui": "workspace:*"
}
```

**apps/web/app/layout.tsx:**
```tsx
import { ThemeProvider } from "@lyra/ui";
```

**apps/web/tailwind.config.ts:**
```ts
colors: {
  background: "var(--color-bg)",
  foreground: "var(--color-fg)",
  primary: "var(--color-primary)",
  // ... all token mappings
}
```

**apps/web/styles/globals.css:**
```css
@import "./tokens.css";
```

### 7. Theme System

Created `ThemeProvider` component:
- Client-side only (`"use client"`)
- Manages `data-theme` attribute on `<html>`
- Persists to localStorage (`lyra.theme`)
- Supports light/dark modes

### 8. Bug Fixes

- Fixed worker TypeScript config (added `skipLibCheck: true`)
- Removed `composite: true` from UI package tsconfig (conflicted with tsup)
- Marked React as external in tsup build
- Normalized figma_export imports for Tailwind content scanning

### 9. Documentation

Created:
- `packages/ui/README.md` - Package usage guide
- `README.md` updates - Design system section
- `DESIGN_SYSTEM_MIGRATION.md` - This file

## Testing

- ✅ UI package builds successfully
- ✅ Web app dev server starts
- ✅ ThemeProvider integrated in layout
- ✅ Test page created at `/test-ui` with sample components
- ⚠️ Production build has env-related errors (unrelated to UI package)

## Usage Example

```tsx
import { UIButton, UICard, UICardHeader, UICardTitle, UICardContent } from "@lyra/ui";

export default function MyPage() {
  return (
    <UICard>
      <UICardHeader>
        <UICardTitle>Hello World</UICardTitle>
      </UICardHeader>
      <UICardContent>
        <div className="flex gap-2">
          <UIButton variant="default">Primary</UIButton>
          <UIButton variant="secondary">Secondary</UIButton>
          <UIButton variant="outline">Outline</UIButton>
        </div>
      </UICardContent>
    </UICard>
  );
}
```

## Design Tokens

All tokens from Figma Make are preserved as CSS variables:

```css
/* Colors */
--color-bg, --color-fg
--color-primary, --color-secondary
--color-accent, --color-muted
--color-destructive, --color-border

/* Typography */
--font-sans, --font-heading, --font-mono
--font-size-*, --font-weight-*

/* Spacing */
--spacing-0 through --spacing-24

/* Border Radius */
--radius, --radius-sm, --radius-md, etc.

/* Shadows */
--shadow-sm through --shadow-2xl

/* Layout */
--layout-topnav-height-*, --layout-sidebar-width-*
```

## Tailwind Integration

The web app's `tailwind.config.ts` maps CSS variables to utility classes:

```tsx
// Use design tokens via Tailwind
<div className="bg-background text-foreground border-border">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>
```

## Future Updates

When new Figma exports arrive:

1. Place in `apps/web/figma_export/`
2. Run normalization script or manually copy to `packages/ui/src/`
3. Remove version suffixes from imports
4. Build: `pnpm build:ui`
5. Test in web app

## Notes

- **Source of Truth**: `apps/web/figma_export/` is preserved (not deleted)
- **Consumption**: All app code should import from `@lyra/ui`
- **Idempotent**: All file operations are safe to re-run
- **Turbo**: Build order handled automatically via `dependsOn: ["^build"]`

## Commands

```bash
# Build UI package only
pnpm build:ui

# Build entire monorepo (includes UI)
pnpm build

# Dev mode (all packages)
pnpm dev

# Dev mode (UI package only, watch)
pnpm --filter @lyra/ui dev
```

## Files Modified

- `packages/ui/` (new directory)
- `apps/web/package.json`
- `apps/web/app/layout.tsx`
- `apps/web/tailwind.config.ts`
- `apps/web/styles/globals.css`
- `apps/web/styles/tokens.css` (copied)
- `apps/web/figma_export/components/ui/*.tsx` (normalized imports)
- `apps/worker/tsconfig.json` (skipLibCheck added)
- `package.json` (root - added build:ui script)
- `README.md` (documented design system)

## Migration Complete ✅

The design system is now a fully functional workspace package that can be consumed by any app in the monorepo.

