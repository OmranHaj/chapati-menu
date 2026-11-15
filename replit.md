# شباتي وكرك — Chapati & Karak

Arabic RTL electronic restaurant menu with a protected owner dashboard.

## Product requirements

- The user owns a chapati and karak shop and supplied the real logo.
- Exact brand colors: forest green `#0F5A2B`, orange `#EE7D22`, warm off-white `#FAF8F0`.
- Initial sections: مشروبات، سندويشات صباحية، سندويشات مسائية.
- Currency: Syrian pound, displayed as `ل.س`, configurable by the owner.
- The user explicitly requested NestJS, React, and PostgreSQL to move the project to external hosting. Preserve that portability; do not replace NestJS with plain Express or add platform-only runtime dependencies without discussing it.
- Products and prices initially seeded are examples, not the shop's actual catalogue.
- The menu currently displays products; it does not accept orders or payments.

## Run & verify

- API managed workflow: `artifacts/api-server: API Server`
- Frontend managed workflow: `artifacts/chapati-karak: web`
- `pnpm run typecheck` — all packages.
- `pnpm run build:hosting` — builds NestJS API and React frontend for external hosting.
- `pnpm run start:hosting` — serves both from Nest's Express adapter; requires `PORT`.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client and validation.
- `pnpm --filter @workspace/db run push` — development schema only.
- `pnpm --filter @workspace/api-server run seed` — initialize sample catalogue on an empty database, after API build. Does not run on startup or overwrite an existing menu.

## Structure

- `artifacts/chapati-karak`: React/Vite Arabic menu, admin and auth pages.
- `artifacts/api-server/src/app.module.ts`: Nest module.
- `artifacts/api-server/src/routes/menu.controller.ts`: Nest endpoints.
- `lib/api-spec/openapi.yaml`: API contract, generated client and Zod validators.
- `lib/db/src/schema`: PostgreSQL tables using Drizzle.
- `HOSTING.md`: Arabic instructions for external deployment.

## Authentication

Clerk handles passwords and email verification. Web requests use same-origin session cookies.
`ADMIN_EMAILS` is an owner-configured allowlist. The server checks a signed-in user's verified email using Clerk before every write.
Registration does not grant admin status on its own; there is no first-user or development bypass.
The owner registers with the allowlisted email and chooses their own password, then verifies that email.
Never save an actual owner email or any credentials in repository documentation.
Development and production Clerk identities are separate.

## Storage and hosting

Use the existing PostgreSQL connection through `DATABASE_URL`.
Do not run schema changes on startup. Managed Replit production schema changes go through Publish.
For new external databases, follow the explicit setup steps in `HOSTING.md`.
Images supplied by admins currently use HTTPS URLs, not uploads.
Initial generated food illustrations and the original cropped logo live in the frontend's public directory.
