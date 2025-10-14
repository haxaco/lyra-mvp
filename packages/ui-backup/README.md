# @lyra/ui

Lyra's design system package built from Figma Make exports.

## Overview

This package contains:
- **Primitives**: UI components (Button, Card, Input, Badge, Skeleton, Avatar)
- **Layout**: Complex components (TopNavBar, Sidebar, MusicPlayer)
- **Theme**: Design tokens, ThemeProvider, CSS variables
- **Utils**: Helper functions (cn for className merging)

## Installation

Already included in the workspace. The web app imports it as:

```json
{
  "dependencies": {
    "@lyra/ui": "workspace:*"
  }
}
```

## Usage

### Importing Components

```tsx
import { UIButton, UICard, ThemeProvider } from "@lyra/ui";
```

### ThemeProvider

Wrap your app with ThemeProvider (already done in `apps/web/app/layout.tsx`):

```tsx
import { ThemeProvider } from "@lyra/ui";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ThemeProvider defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Using Primitives

```tsx
import { UIButton, UICard, UICardHeader, UICardTitle, UICardContent } from "@lyra/ui";

export default function MyPage() {
  return (
    <UICard>
      <UICardHeader>
        <UICardTitle>Hello World</UICardTitle>
      </UICardHeader>
      <UICardContent>
        <UIButton variant="default">Click me</UIButton>
      </UICardContent>
    </UICard>
  );
}
```

### Using Layout Components

```tsx
import { TopNavBar, Sidebar } from "@lyra/ui";

const actions = [
  { label: "Notifications", icon: <BellIcon />, badge: 3 }
];

<TopNavBar
  logo="/logo.png"
  searchPlaceholder="Search..."
  actions={actions}
  userAvatar="/avatar.jpg"
  userName="Jane Doe"
/>
```

## Design Tokens

All design tokens are defined as CSS variables in `src/theme/tokens.css` and copied to `apps/web/styles/tokens.css`.

The Tailwind config maps these to utility classes:

- `bg-background` → `var(--color-bg)`
- `text-foreground` → `var(--color-fg)`
- `text-primary` → `var(--color-primary)`
- etc.

## Development

```bash
# Build the package
pnpm --filter @lyra/ui build

# Watch mode
pnpm --filter @lyra/ui dev

# From root
pnpm build:ui
```

## Architecture

- **Source**: `packages/ui/src/`
- **Build**: `packages/ui/dist/`
- **Formats**: CJS, ESM, TypeScript definitions
- **Bundler**: tsup
- **Peer Dependencies**: React 18+

## Source of Truth

The original Figma exports remain at `apps/web/figma_export/` for reference and future updates. All consumption should use `@lyra/ui`.

## Updating from Figma

When new Figma exports arrive:

1. Place them in `apps/web/figma_export/`
2. Copy/normalize to `packages/ui/src/`
3. Remove version suffixes from imports
4. Update relative paths to use package structure
5. Rebuild: `pnpm build:ui`

