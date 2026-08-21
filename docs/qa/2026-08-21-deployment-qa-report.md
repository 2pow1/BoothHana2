# BoothHana2 Deployment QA Report

- Date: 2026-08-21
- Frontend: https://booth-hana2.vercel.app
- Backend: https://boothhana2-api.onrender.com
- Environment: Vercel + Render + Supabase PostgreSQL
- Mode: authenticated deployment smoke QA
- Status: Pass with one infrastructure limitation and one deferred mutation check

## Deployment and configuration

- Render deployed merge commit `c4ff99b` successfully.
- Render administrator configuration was migrated from `ADMIN_KAKAO_SUBJECT` to `ADMIN_KAKAO_SUBJECTS` without reading or copying the secret value.
- The designated administrator logged in again after deployment and retained access to the Admin Console.
- The same authenticated account could enter Fan, Creator, and Admin areas, matching the additive permission model.

## Browser verification

- Public home, event list, event detail, booth detail, and product data loaded from the deployed backend.
- Kakao login completed and the public header changed from `카카오 로그인` to `로그아웃`.
- Fan reservation list loaded persisted mock reservations at `/reservations`.
- Creator dashboard, event applications, base/approved booths, event-booth edit form, product inventory, reservations, POS, and notices opened without an application error state.
- Admin event list, participation applications, and event registration form opened successfully.
- Admin event list loaded persisted DRAFT, PUBLISHED, and ENDED rows from Supabase.
- Product edit UI exposed the intended JPG/PNG/WebP representative-image picker.

## Automated verification

- Frontend `pnpm lint`: pass.
- Frontend `pnpm build` (TypeScript + Vite production build): pass.
- Backend `gradlew test`: pass.

## Findings and limits

### Render cold start during a paused OAuth flow

The first callback attempt returned `/login?error` after the Kakao authorization page had remained open long enough for the Render free instance to sleep. Render then needed to wake the backend before handling the callback. An immediate retry after the backend was warm completed successfully.

This is recorded as a free-tier infrastructure limitation rather than an application crash. Normal prompt login was successful, but a user who pauses for a long time on the Kakao page may need to retry.

### Deferred external mutations

This pass did not submit a new event, change an existing row, or upload a new image object to R2. Those actions mutate the shared public development environment. The forms and image picker were verified, while the final R2 upload/save round trip remains pending explicit approval.

## Result

The deployed authentication, additive Fan/Creator permissions, plural administrator configuration, persisted reads, and major management routes are working. No code defect requiring a source change was found in this pass.
