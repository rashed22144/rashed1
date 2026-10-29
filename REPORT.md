# Frontend i18n & Security Review — Report

Branch: `frontend-i18n-security` (based on `main`, nothing pushed, no deploy, no database/Supabase access used).

## 1. Summary

### Task 1 — Translations & English default

- English is now the default for new/unknown users. The saved preference (`localStorage` key `appLanguage`) is read inside `try/catch`, validated against the supported list (`en`, `ar`), and the browser language is never consulted. Unknown/invalid values fall back to English. `<html lang>` and `dir` follow the active language.
- One dictionary per language: [src/i18n/en.js](src/i18n/en.js) and [src/i18n/ar.js](src/i18n/ar.js) (338 keys each), loaded by [src/i18n/index.js](src/i18n/index.js). [src/lib/LanguageContext.jsx](src/lib/LanguageContext.jsx) keeps the existing API (`t(key)`, `language`, `dir`, `setLanguage`, `changeLanguage`) and `t()` now supports `{param}` interpolation, e.g. `t('commentLimitReached', { max: 3 })`. No component API rewrites were needed beyond removing inline strings.
- Every hard-coded user-visible string found in `src/` was moved into the dictionaries: inline `language === 'en' ? … : …` ternaries, placeholders, `alert()`/`window.confirm()` texts, `aria-label`s, empty states, buttons, badges, admin messages, and date/number-adjacent labels. Remaining `language ===` checks in code are only (a) date-fns locale selection, (b) picking the `name_en` database field for category names, and (c) the active-language highlight on the language settings page. Arabic text left in `src/components` is only code comments, dev-only `console.error` labels, the language's own native name (`العربية`), and database category values (`ملابس`, default-image map keys) — none are rendered UI strings.
- Verification script [scripts/check-i18n.js](scripts/check-i18n.js) (`npm run check:i18n`): fails if a key exists in only one dictionary or if any `t('…')` key used in `src/` is missing. Result: **338 keys in each dictionary, 329 keys used, all present.**
- RTL/LTR: physical classes were replaced with logical ones (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`/`border-s`) in the header, search bar (which previously forced `dir="rtl"`), service cards (language-conditional `left/right` positioning), comment indentation, notification badge, admin dashboard, and settings. Directional arrows on the home page (View-all / Add-service) now flip with `dir`. Mixed-direction content (dates via `toLocaleDateString`, counts via interpolated params) renders through the active locale.
- Friendly translated messages for database rejections were added (`errPermission`, `errBanned`, `errLimitReached`, `errDuplicateReview`, `errAlreadyReported`, `errLoginRequired`, `errNetwork`, `errGeneric`, `errSaveFailed`) and are selected by [src/lib/friendlyError.js](src/lib/friendlyError.js), which maps raw Postgres/RLS/auth errors to those keys. Raw `error.message` is no longer shown to users.

### Task 2 — Safe improvements applied

- **Backend contract alignment:** all service reads now go through `services_public`, including the generic `Service` entity (previously it read the base `services` table with `select('*')`, which could return phone/whatsapp/email). The admin dashboard was adapted to `reports_count` (the old `reports`/`report_reasons` array fields do not exist on `services_public`). [src/components/ipu/serviceApi.js](src/components/ipu/serviceApi.js) was pointed at the same view.
- **Duplicate Supabase client removed:** [src/components/ipu/supabaseClient.js](src/components/ipu/supabaseClient.js) deleted; the single client is [src/lib/supabaseClient.js](src/lib/supabaseClient.js), env-first (`REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY`, see [.env.example](.env.example)).
- **Hard-coded admin email removed:** `ADMIN_EMAIL` and the `SendEmail` call in AddService (which bundled the submitter's phone/email into an email body) were deleted; the feature was already a no-op (it needs an Edge Function). `SendEmail` no longer logs recipient/subject/body (PII).
- **Unsafe URLs:** ad `link_url` is validated as `http(s)://` on the client both when posting ([CreatePost.jsx](src/components/community/CreatePost.jsx)) and when opening ([PostImageGallery.jsx](src/components/community/PostImageGallery.jsx) via `safeHttpUrl` in [src/utils.js](src/utils.js)); `javascript:`/`data:` links now fall back to the lightbox instead of opening. All `window.open` calls use `noopener,noreferrer`; there are no `target=` attributes and no `dangerouslySetInnerHTML` anywhere in `src/`.
- **Uploads:** one shared validator/compressor ([src/lib/imageUpload.js](src/lib/imageUpload.js)): allow-list PNG/JPEG/GIF/WebP, max 5MB (matching the bucket), file names sanitized, all uploads compressed to ≤1080px JPEG — including profile avatar and cover, which were previously uploaded uncompressed. [src/api/backendClient.js](src/api/backendClient.js) `UploadFile` re-validates type/size and derives the extension from the MIME type instead of trusting the file name. The old "up to 10MB" copy was corrected to 5MB.
- **Privacy:** other users' email addresses are no longer displayed on public profile pages (own profile still shows it). Admin dashboard still shows emails (admin-only, needed for moderation).
- **Error handling:** alerts that interpolated raw `error.message` now show friendly translated messages; the settings page gained a visible save-error message; the report flow surfaces failures instead of failing silently. Internal fallback messages in the API layer were changed to neutral English (they are mapped to translations in the UI).
- **Config hygiene:** `.gitignore` now covers `.env` and `.env.*` (with `!.env.example`).
- **Bugs fixed:** raw untranslated `age_category` enum (`men`/`women`/…) on service cards is now translated; the comment-delete button on My Profile used a rotated pencil icon — now a trash icon; `LocationContext` storage writes are wrapped in `try/catch`.
- **Accessibility/quick wins:** `aria-label`s added to icon-only buttons touched in this pass, `loading="lazy"` was already present on card/gallery images and was kept/added on the upload preview, page `<title>` set to "MyServices".

### Changed files

Task 1: `src/i18n/en.js` (new), `src/i18n/ar.js` (new), `src/i18n/index.js` (new), `scripts/check-i18n.js` (new), `src/lib/LanguageContext.jsx`, `src/lib/friendlyError.js` (new), and string migration in `src/components/Layout.jsx`, `NotificationBell.jsx`, `SearchBar.jsx`, `LocationSelector.jsx`, `ImageUpload.jsx`, `ServiceCard.jsx`, `ServiceReviews.jsx`, `ServiceActionsMenu.jsx`, `UserNotRegisteredError.jsx`, `src/components/community/PostCard.jsx`, `CommentItem.jsx`, `CreatePost.jsx`, `src/components/pages/HomePage.jsx`, `CommunityPage.jsx`, `CategoryPage.jsx`, `SearchResultsPage.jsx`, `ServiceDetailPage.jsx`, `AddService.jsx`, `AdminDashboard.jsx`, `MyProfilePage.jsx`, `UserProfilePage.jsx`, `SettingsPage.jsx`, `LanguageSettingsPage.jsx`, `public/index.html`.

Task 2: `src/api/backendClient.js`, `src/entities/ServicePublic.js`, `src/lib/supabaseClient.js`, `src/components/ipu/serviceApi.js`, `src/components/ipu/supabaseClient.js` (deleted), `src/lib/imageUpload.js` (new), `src/utils.js`, `src/components/LocationContext.jsx`, `.gitignore`, `.env.example` (new), `package.json` (adds `check:i18n` script).

Commits (small, logical): `1a8bc35` i18n foundation · `333cfcf` shell components · `ababfad` cards/posts/reviews · `67224ff` pages · `2ffccd7` backend hardening · `b967e1c` lint cleanup · `11192cc` last fixes · plus this report.

## 2. Findings fixed

| File | Problem | Severity | Fix |
|---|---|---|---|
| [backendClient.js](src/api/backendClient.js) | `Service` entity read base `services` table with `select('*')` (phone/email/whatsapp could be returned) | High | Reads now use `services_public` view via `READ_TABLE_MAP`; writes unchanged |
| [AdminDashboard.jsx](src/components/pages/AdminDashboard.jsx) | Filtered/displayed `service.reports[]` / `report_reasons`, which do not exist on `services_public` | Medium | Uses `reports_count` from the view |
| [serviceApi.js](src/components/ipu/serviceApi.js) | Read base `services` table with `select('*')` | High | Reads `services_public`; single shared client import |
| [supabaseClient.js (ipu)](src/components/ipu/supabaseClient.js) | Duplicate Supabase client with hard-coded config | Medium | File deleted; one client in `src/lib` |
| [AddService.jsx](src/components/pages/AddService.jsx) | Hard-coded `ADMIN_EMAIL`; new-service email bundled submitter phone/email (PII) | Medium | Removed email + `SendEmail` call entirely (was a no-op without an Edge Function) |
| [backendClient.js](src/api/backendClient.js) | `SendEmail` logged recipient, subject and body (PII) to console | Medium | No logging; no-op kept for a future Edge Function |
| [PostImageGallery.jsx](src/components/community/PostImageGallery.jsx) | User-controlled ad `link_url` opened unchecked (`javascript:` possible) | High | `safeHttpUrl()` allows only http/https, else lightbox |
| [CreatePost.jsx](src/components/community/CreatePost.jsx) | Ad `link_url` accepted without scheme validation | Medium | Client-side http/https validation with translated error |
| [ImageUpload.jsx](src/components/ImageUpload.jsx) | No size limit (copy claimed 10MB vs 5MB bucket), `dir="rtl"` hard-coded | Medium | Shared 5MB/type validation + compression; logical RTL |
| [MyProfilePage.jsx](src/components/pages/MyProfilePage.jsx) | Avatar/cover uploaded uncompressed, failures left spinner stuck | Medium | Shared compress+validate, `try/finally`, friendly error, input reset |
| [backendClient.js](src/api/backendClient.js) | `UploadFile` trusted file-name extension, no type/size check | Medium | MIME-derived extension, image allow-list, 5MB cap |
| All migrated components | ~300 hard-coded bilingual strings bypassing `t()` | Medium | Moved to dictionaries; parity script enforces it |
| [LanguageContext.jsx](src/lib/LanguageContext.jsx) | Fallback language was Arabic; unguarded `localStorage` could throw | Medium | English default everywhere, validated + `try/catch` storage |
| Multiple components | Raw `error.message` (Postgres/RLS internals) shown in alerts | Medium | `getFriendlyErrorMessage()` maps to translated friendly text |
| [UserProfilePage.jsx](src/components/pages/UserProfilePage.jsx) | Other users' email displayed publicly | Low | Email shown only on your own profile |
| [ServiceCard.jsx](src/components/ServiceCard.jsx) | Raw `age_category` DB enum rendered untranslated | Low | Mapped through `t()` |
| [MyProfilePage.jsx](src/components/pages/MyProfilePage.jsx) | Comment delete button rendered a rotated pencil icon | Low | Trash icon |
| [.gitignore](.gitignore) | Plain `.env` not ignored | Low | `.env`, `.env.*` ignored; `.env.example` added |
| [LocationContext.jsx](src/components/LocationContext.jsx) | Unguarded `localStorage.setItem` | Low | Wrapped in `try/catch` |

## 3. Findings NOT fixed (risky / ambiguous) — recommendations

| # | Finding | Recommendation |
|---|---|---|
| 1 | Community page still loads the **full** `users_public` list (every user's email) to build an avatar map (profile page fixed in §7) | Backend: denormalize `avatar_url` onto posts (already partially stored) or expose a minimal `id,email,avatar_url` avatar endpoint; then drop the bulk load |
| 2 | Report auto-hide (≥3 reports hides a post) and report counting happen client-side in PostCard/CommentItem | Move counting + auto-hide into the `report_*` RPCs / a trigger so it cannot be bypassed |
| 3 | Likes/loves/shares/comments counters use read-modify-write of whole arrays — lost-update races under concurrency | Add `toggle_like`/`toggle_love` RPCs that only ever add/remove the caller's own email |
| 4 | Admin dashboard action handlers have no per-action error feedback (a rejected write looks like success until reload) | Wrap handlers and surface `getFriendlyErrorMessage()` — deliberately not done here to keep the admin diff reviewable |
| 5 | Notification title/message are stored in the **poster's** language; recipients may read the other language | Store `type` + params and localize at render time |
| 6 | The public anon key remains as a fallback in `src/lib/supabaseClient.js` (public by design; RLS is the real gate) and it also exists in git history from the deleted duplicate file | Set `REACT_APP_*` env vars in hosting, then remove the fallback; rotate the publishable key if you want history exposure neutralized |
| 7 | Client-only checks with no confirmed DB backing: banned-user write blocks, 3-service limit (see DB issues) | Enforce in the database (DB issues §5); the UI already handles rejection gracefully |
| 8 | Pre-existing unused variables/imports in PostCard and `ui/*` primitives; some physical margin classes remain in untouched primitives | Clean opportunistically; build warnings list them |
| 9 | `npm audit`: 113 vulnerabilities (2 critical, 72 high), almost all in the react-scripts/jest/webpack dev toolchain | See §4 — do not `--force`; plan a CRA maintenance/migration path |

## 4. How I tested

| Command | Result |
|---|---|
| `node scripts/check-i18n.js` / `npm run check:i18n` | ✅ `i18n check OK: 338 keys in each dictionary, 329 keys used in src/ all present.` |
| `npm run build` (run 3×, last after final fixes) | ✅ `Compiled with warnings.` — remaining warnings are pre-existing unused vars / hook deps in untouched files; production bundle emitted |
| `npm audit` | ⚠️ 113 vulnerabilities (3 low, 36 moderate, 72 high, 2 critical). Criticals: `proxy-addr` (IP spoofing via trust proxy) and `shell-quote` (command injection) — both transitive deps of the react-scripts **dev** toolchain, not shipped in the browser bundle. Highs are dominated by webpack/jest/jsdom dev packages. **Safe next steps (not applied):** review `npm audit fix` (non-breaking) in a separate change and test the dev server; never `npm audit fix --force` (it proposes react-scripts@0.0.0); long-term, plan migration off unmaintained react-scripts 5. No major upgrades were forced, per instructions |
| Manual code scans (`rg`-style searches) | No `dangerouslySetInnerHTML`, no `target=` attributes, all `window.open` calls pass `noopener,noreferrer`, no remaining user-visible `language ===` string ternaries, `ADMIN_EMAIL` gone |
| Dev server | Not started (not needed for verification); no server left running. No database was contacted — builds/scans only |

Note: behaviour depending on the backend contract was not changed — where the database now rejects an old client write, the UI shows a friendly translated message instead of leaking the raw error.

## 5. DB issues for my backend engineer

1. **Banned users:** confirm INSERT/UPDATE policies on `posts`, `post_comments`, `reviews`, `services` reject writes while `banned_until > now()`. The frontend only hides forms; that is not enforcement.
2. **Service limit:** the 3-services-per-account limit exists only in the frontend (`MAX_SERVICES`). Add a DB-side check (constraint trigger or create-RPC) so it cannot be bypassed.
3. **Server-side rate limits:** add rate limits for posting, commenting, liking/loving, reporting, and `increment_service_view`/`increment_service_click` (currently any client can inflate view/click counters).
4. **Admin service reports:** the dashboard dismisses reports by writing `reports`/`report_reasons` on `services`. Confirm those columns + an admin UPDATE policy exist, or provide an admin RPC (e.g. `dismiss_service_reports(id)`). `services_public` exposes only `reports_count`/`already_reported`.
5. **Report thresholds:** implement report counting and auto-hide (≥3) server-side; the client-side version is bypassable and racy.
6. **Like/love counters:** provide toggle RPCs restricted to the caller's own email to replace read-modify-write array updates.
7. **Duplicate reviews:** back the "already reviewed" message with a unique constraint on `reviews(service_id, reviewer_email)`.
8. **Owner-write policies to verify:** RLS should allow update/delete only by the owner for `post_comments` and `reviews` (except the service owner's `owner_reply`, which the contract already covers), owner-only `services` update/delete, and follower-only `follows` delete. The frontend hides these controls for non-owners, but the policies are the real gate.
9. **Bulk user reads:** community/profile pages currently need the full `users_public` list for avatars/VIP badges (all emails leave the server). A minimal avatar view or denormalized avatars would remove that exposure.
10. **Notifications:** consider storing `type` + structured params instead of pre-rendered title/message text, so recipients see their own language.

## 6. Manual test checklist for you

**Language**
- [ ] Fresh browser profile (no `appLanguage` in localStorage): site loads in **English**, LTR, `<html lang="en">`
- [ ] Switch to Arabic on Language Settings: whole UI flips to RTL, choice survives reload
- [ ] Switch back to English: LTR restored, choice survives reload
- [ ] Private/incognito window with storage blocked: site still loads (English), language switch works for the session
- [ ] Walk RTL pages: Home, Category, Service Detail, Community, My Profile, Admin — check badges, back arrow, search bar, comment indentation in both directions

**Uploads**
- [ ] Add-service image: PNG/JPG/WebP under 5MB uploads and previews
- [ ] File over 5MB and a non-image file: friendly translated rejection, no stuck spinner
- [ ] Profile avatar and cover: image is compressed, updates after reload, failure shows a friendly message

**Community & moderation**
- [ ] Create a post with an ad link `javascript:alert(1)`: rejected with a translated message; an `https://` link opens in a new tab from the image
- [ ] Report a service/post twice: second report is blocked/friendly; report with DB rejection shows a friendly message, never raw Postgres text
- [ ] Comment 4 times (top level) on one post: friendly limit message; duplicate review on a service: friendly duplicate message
- [ ] Logged-out contact buttons: friendly sign-in message; logged-in: contact details reveal via RPC

**Auth & admin**
- [ ] Login/logout round-trip; header menu shows Admin Dashboard only for the admin account
- [ ] Admin dashboard: tabs, report counts (`reports_count`), warn → 3rd warning bans 5 days, unban, VIP/Ad role changes, non-admin sees Unauthorized
- [ ] Public profile of another user: no email shown; your own profile still shows your email
- [ ] Banned account: can browse, posting/commenting/adding a service blocked with a friendly message

## 7. Addendum — second security pass

Re-scanned `src/` and `public/`: no `service_role` key, no JWTs, no `innerHTML`/`eval`/`document.write`, no tracked `.env` files (only `.env.example`), every `window.open` uses `noopener,noreferrer`.

Fixed in this pass (commit `b178150`):

| File | Enhancement |
|---|---|
| [backendClient.js](src/api/backendClient.js) | `auth.updateMe()` now whitelists self-editable fields (`full_name`, `phone`, `bio`, `avatar_url`, `cover_url`, notification prefs). `account_type`, `warnings`, `banned_until`, `email`, `id` are stripped client-side as defense in depth (DB policy remains the real gate) |
| [UserProfilePage.jsx](src/components/pages/UserProfilePage.jsx) | Loads the profile with `User.filter({ email })` instead of downloading the entire `users_public` list to find one user |
| [ServiceCard.jsx](src/components/ServiceCard.jsx) / [ServiceDetailPage.jsx](src/components/pages/ServiceDetailPage.jsx) | `tel:` links strip everything except digits/`+`; `mailto:` values are trimmed and URI-encoded, so stored contact strings cannot inject extra URI parameters |
| [PostImageGallery.jsx](src/components/community/PostImageGallery.jsx) | Lightbox buttons gained translated `aria-label`s (5 new keys, parity check passes at 343), logical start/end positioning, and direction-aware chevrons |
| [index.html](public/index.html) | Real meta description; `Referrer-Policy: strict-origin-when-cross-origin` |

Still open (unchanged from §3/§5): the Community page still bulk-loads `users_public` for its avatar map (needs a backend/denormalization decision), client-side report thresholds and counter races need RPCs, admin action handlers deserve per-action error toasts, notifications are stored in the poster's language, and the anon-key fallback should be dropped once hosting env vars are set. Security headers (`Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`) cannot be set from CRA code — add them in your hosting config (e.g. Vercel `vercel.json` headers) and test the Supabase/Unsplash/Google domains against the CSP before enforcing it. `npm audit fix` was **not** applied in this pass: the registry connection was reset during verification, so no dependency change could be verified safely; re-run `npm audit` + `npm audit fix` (never `--force`) when the registry is reachable, then rebuild.

## 8. Addendum — image pipeline, orphan cleanup, admin moderation (this pass)

No database, schema, SQL, or secret changes; nothing pushed.

### 8.1 What changed

| Area | Change |
|---|---|
| Single image pipeline | Compression moved into `backend.integrations.Core.UploadFile({ file, kind })` in [src/api/backendClient.js](src/api/backendClient.js). `kind: 'avatar'` caps the longest side at 400px, `'cover'` at 1280px, default (posts/services) at 1080px. Canvas re-encode (which also strips EXIF) emits WebP at quality 0.8, falls back to JPEG 0.85 when WebP encoding is unsupported, and keeps PNG for PNG sources in that fallback so transparency survives (WebP output itself preserves alpha). Animated GIFs are flattened to their first frame by the canvas draw. The 5MB pre-check and the PNG/JPEG/GIF/WebP MIME allow-list run before any decoding/upload, and the stored extension/content-type come from the encoded blob, never the file name. |
| Callers de-duplicated | [CreatePost.jsx](src/components/community/CreatePost.jsx) (its inline WebP compressor is deleted) and [ImageUpload.jsx](src/components/ImageUpload.jsx) now pass the raw file to `UploadFile`. [src/lib/imageUpload.js](src/lib/imageUpload.js) keeps only `validateImageFile`/`sanitizeFileName` for early UX errors; `compressImageFile`/`prepareImageForUpload` are removed. [MyProfilePage.jsx](src/components/pages/MyProfilePage.jsx) passes `kind: 'avatar'` / `kind: 'cover'`. |
| Orphan cleanup | New exported `removeUploadedFile(publicUrl)` (+ `parseUploadObjectName`) in `backendClient.js`: only URLs containing `/storage/v1/object/public/uploads/<name>` are acted on (name decoded, query stripped); anything else is ignored. Errors are swallowed — cleanup never blocks the UI. Call sites: profile avatar/cover replace (old file deleted only after the new one is saved), post delete in [PostCard.jsx](src/components/community/PostCard.jsx) and AdminDashboard incl. bulk hidden-post delete (`image_url` + every `images[]` entry), staged-image removal in CreatePost/ImageUpload, service delete in [ServiceActionsMenu.jsx](src/components/ServiceActionsMenu.jsx) and AdminDashboard, and service-image removal/replacement in ImageUpload (the previous staged file is deleted after a successful replacement upload, and on explicit remove). |
| Admin moderation queue | Reported posts in [AdminDashboard.jsx](src/components/pages/AdminDashboard.jsx) now render **all** images (`images[]` or `image_url`) in a grid at `max-h-72 w-full object-cover`, plus an explicit localized report count (`reportsCountLabel`). Every reported post always offers **Restore** (`hidden=false`, `reports` and `report_reasons` cleared), **Delete** (post + image files via `removeUploadedFile`), Hide (when visible) and Warn. A clearly marked disabled placeholder for a future **Delete + block image** action (`deleteAndBlockImageBtn` + `comingSoonLabel`, dashed container) is present; blocking is **not** implemented. Nothing is auto-deleted — bulk delete still only removes already-hidden posts that the admin explicitly confirms via that button. |
| Reported services reasons | New `ServiceAdmin` entity ([src/entities/ServiceAdmin.js](src/entities/ServiceAdmin.js), `backend.entities.ServiceAdmin`) reading the base `services` table. It is imported **only** by AdminDashboard's reported-services load (report count = `reports_count ?? reports.length`), so `report_reasons` render there. All other reads keep using `services_public`. Dismiss still writes through the normal `Service` entity (writes always targeted the base table). |
| i18n sweep | Dynamic lookups audited: `t(errorKey)`/`t(imageErrorKey)` (`uploadInvalidType`, `uploadTooLarge`), `t(lang.descriptionKey)` (`langDescArabic`, `langDescEnglish`), the age-category map in ServiceCard (`filterAll`, `ageMen`, `ageWomen`, `ageChildren`), and `friendlyError` keys — all present in both dictionaries. Leftover hard-coded UI strings fixed: sidebar `VIP` literal → `t('vipBadge')` in [CommunityPage.jsx](src/components/pages/CommunityPage.jsx); `alt="cover"` → new `coverImageAlt` key on both profile pages; `VIP`/`AD` badge literals in AdminDashboard's user list and on UserProfilePage → `t('vipBadge')` / new `t('adBadge')` key. Arabic fixes: `addAd` 'إضافة إعلاني' → 'إضافة إعلان', 'يدويياً' → 'يدوياً', and WebP added to `uploadInvalidType`/`uploadSupports` to match English. Automated scans found no double-space / glued `{param}` / untrimmed values in either dictionary; both files parse cleanly (348 keys each). Language-neutral placeholders (`email@example.com`, `05xxxxxxxx`) and DB category names / code comments remain intentionally untranslated. |
| Tests | New focused suite [backendClient.test.js](src/api/backendClient.test.js) (11 tests): URL parsing (uploads-only, decoding, foreign-URL rejection), `removeUploadedFile` (calls storage only for uploads URLs, swallows errors), and the pipeline gate (non-image and >5MB rejected before upload; avatar → 400px WebP; default → 1080px; PNG preserved when WebP is unsupported). [setupTests.js](src/setupTests.js) now loads `@testing-library/jest-dom` optionally so `npm test` runs even though that dev dependency is not in `package.json` yet (install it to enable the jest-dom matchers). |

### 8.2 How to test each item

| Item | Steps | Expected |
|---|---|---|
| Avatar/cover sizes | On My Profile, upload a 2000×1000 photo as avatar, then as cover; inspect the stored object / network response | Avatar stored ≤400px wide as `.webp`; cover ≤1280px; profile shows the new image after reload |
| Post/service size + format | Create a post with a large JPG and add a service with a PNG that has transparency | Post/service image ≤1080px, `.webp`; transparent PNG keeps its alpha in WebP |
| Fallback | In Safari/an older browser without WebP canvas encoding, upload a JPG and a transparent PNG | JPG stored as `.jpg`, PNG stored as `.png` with transparency intact |
| GIF | Upload an animated GIF as a post image | Stored as a static (first-frame) WebP; no animation, no error |
| Validation | Try a >5MB image and a non-image file in CreatePost, ImageUpload and My Profile | Friendly translated rejection; `UploadFile` never reaches storage (unit tests cover this gate) |
| Orphan: profile | Replace avatar/cover, then check the `uploads` bucket | Previous object is gone (once the storage policies in §8.3 exist); a failed save does **not** delete the old image |
| Orphan: post/service | Delete your post with images; delete your service; as admin, Delete a reported post and Delete a reported service | Post row/service gone and its `uploads` objects removed; external (non-`uploads`) URLs untouched |
| Admin queue | Seed/reported posts with 1 and 3 images, open Admin → Reports | All images readable, `Reports: N` shown; Restore unhides and clears the count; Delete removes post + files; "Delete + block image" is visibly present but disabled/"Coming soon"; nothing disappears without a click |
| Reported services | Report a service with a reason, open Admin → Reports as admin | Reason text visible (proves the `ServiceAdmin` base-table read); non-admin contexts still read `services_public` |
| i18n | `npm run check:i18n`; switch EN/AR and open Admin, Community, My/User Profile | Check passes; new strings (`Reports:`, Delete + block image, cover alt) render translated; no raw keys |

### 8.3 Database-side dependencies (action for the backend engineer)

1. **Storage delete policies — required for §8.1 orphan cleanup to actually delete anything.** Supabase Storage `remove()` only deletes rows the caller may **SELECT** as well as DELETE on `storage.objects`. **Dependency found: yes.** The frontend now calls `supabase.storage.from('uploads').remove([name])` in six places, but if the bucket has no `SELECT` + `DELETE` policies for the object's owner (uploads are flat, randomly named files with no owner folder), `remove()` returns success while deleting nothing — orphans will silently accumulate. Needed (not applied here — no DB changes in this pass): policies on `storage.objects` for bucket `uploads` allowing the uploading user (and admins, for moderation deletes of other users' post/service images) to select and delete objects they own / moderate. Until then, cleanup is best-effort and harmless (errors swallowed, UI never blocked).
2. **`ServiceAdmin` read policy:** the admin reported-services section now reads the base `services` table (columns incl. `reports`, `report_reasons`, `reports_count`). Confirm an admin-only SELECT policy exists on `services`; without it the section falls back to `services_public` counts and reasons stay empty. No other screen uses this entity.
3. **Restore write:** Restore clears `reports`/`report_reasons` on `posts` (and comments) via the existing entities — covered by the same admin UPDATE policies the dashboard already relied on; no new policy needed beyond confirming report-column writes are permitted for admins.
4. Nothing in this pass needs new tables, columns, RPCs, or secrets, and no storage/SQL change was made from the frontend side.

### 8.4 Verification (this pass)

| Command | Result |
|---|---|
| `npm run check:i18n` | ✅ `i18n check OK: 348 keys in each dictionary, 339 keys used in src/ all present.` |
| `npx craco test --watchAll=false` | ✅ 11/11 passed (suite: [backendClient.test.js](src/api/backendClient.test.js)). Stock `npm test` previously failed before running any test because [src/setupTests.js](src/setupTests.js) imported the missing `@testing-library/jest-dom` dev dependency; it is now loaded optionally, so the suite runs out of the box — install that dev dependency to enable the jest-dom matchers. |
| `npm run build` | ✅ `Compiled with warnings.` — warnings are pre-existing unused vars / a11y notes in untouched `ui/*` primitives and pages; no new warnings in touched files. Production bundle emitted. |
| Leftover temp files | ✅ None: `git status` shows only the intended source/report/test files (build output is git-ignored). No server left running; no database contacted. |
