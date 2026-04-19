# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### AvianNest (Bird Breeder App)
- **Type**: Expo (React Native) mobile app
- **Path**: `artifacts/bird-breeder/`
- **Preview**: `/` (root)
- **Storage**: AsyncStorage (local, no backend)

#### Features
- Login screen with email authentication
- Weekly routine checklist (resets every Sunday night, default 10 tasks)
- My Birds page — cards with photo, ring number, breed, gender, parent info, share button
- Incubation tracking — animated progress bars, egg count, days remaining
- Family tree / lineage view — hierarchical bird relationship tree
- Green & white theme (`#2D7A4F` primary)

#### Key Packages
- `@react-native-async-storage/async-storage` — persistent local storage
- `expo-image-picker` — bird photo selection from camera roll
- `expo-haptics` — haptic feedback
- `react-native-reanimated` — animated progress bars and checklist interactions
