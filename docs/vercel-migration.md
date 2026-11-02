# Vercel migration

## Status

The migration branch prepares application hosting and experiment persistence for Vercel. It has not moved production traffic or production data. Creating the Vercel project and provisioning its database are owner actions, as requested. Hosted browser checks and live database verification remain required before release.

The thesis site (`thesis.chipsandcode.com`) is linked from the existing README but its source is not in this repository. Its hosting must be inventoried separately before calling the broader migration complete. Changing the main site's hosting does not require transferring domain registration, nameservers, or unrelated DNS records.

## Dependency security

The migration upgrades Zod to 4.6.7 and replaces Monaco 0.57's vendored DOMPurify 3.4.15 with patched 3.4.17 in the actual browser bundle. An npm dependency override alone would leave the vendored code unchanged; the Vite alias and build verification cover that path. The build cleans generated output first so cached chunks and function symlinks cannot survive into a new artifact.

On 2026-11-02, `npm audit --omit=dev` reported no high or critical findings after these changes. Six low findings remain through the upstream `deepmerge` dependency chain; its latest published version is still affected. Recheck upstream updates before release rather than applying the audit tool's incompatible framework downgrades.

## 1. Create the Vercel project

Import `durasj/chipsandcode` into the `durasjs-projects` team. Use these settings:

| Setting             | Value                                       |
| ------------------- | ------------------------------------------- |
| Project name        | `chipsandcode`                              |
| Framework           | SvelteKit                                   |
| Root directory      | Repository root                             |
| Node.js             | 24.x                                        |
| Install command     | `npm ci`                                    |
| Build command       | `npm run build`                             |
| Output directory    | Framework default; leave the override unset |
| Source under review | `codex/vercel-modernization`                |

Deploy the migration branch as a preview. Do not point the production domain at it yet. If import initially builds `main`, that build still uses the old Cloudflare configuration; deploy the migration branch explicitly after project creation. Keep the production branch unchanged until release preparation is complete.

## 2. Provision isolated databases

From the project's Storage / Marketplace screen, add Neon Postgres and connect it to the project. Use separate databases or branches for Preview/Development and Production. Select a region close to the Vercel function region. Ensure the private `DATABASE_URL` is available for each intended environment. Do not copy the production connection into preview builds.

Pull the matching environment locally using the Vercel CLI after linking the correct project and team, or configure `.env.local` directly through your own secure workflow. Never paste connection strings into a PR, issue or chat. Cloudflare credentials are needed only by the local export script and must not be added to the Vercel runtime.

Apply the schema to the selected empty preview database:

```bash
npm run db:migrate
```

The migration creates `cnc_sessions` and `cnc_experiments` without modifying existing tables. No migration runs automatically as part of a build or a deployment.

## 3. Rehearse the legacy-data import

Create a Cloudflare token with read access to the existing KV namespace. Set `CF_API_TOKEN`, `CF_ACCOUNT_ID` and `CF_KV_NAMESPACE_ID` in your local `.env.local`. The existing production namespace ID is available in the pre-migration revision of `wrangler.toml`.

```bash
npm run data:export:cloudflare -- backups/rehearsal.json
npm run data:import -- backups/rehearsal.json
npm run data:import -- backups/rehearsal.json --apply
```

The first import command is a dry run and needs no database. `--apply` writes one transaction to the selected empty target. The importer refuses to overwrite nonempty tables and validates every experiment's ID, full content, visibility, timestamps and owner after import. It stops on conflicting owners, dangling references or invalid records. Investigate those records before proceeding; do not discard them to make the import pass.

Exports include raw legacy session tokens and private experiment content. They are written with restrictive permissions under ignored `backups/`. Keep them in secure backup storage; never commit or upload them as CI artifacts. The database stores session tokens as SHA-256 hashes.

Preserving experiment IDs keeps shared URLs valid. Preserving the existing `auth` cookie and hashing its token preserves ownership once the application is served on the original hostname. A `vercel.app` preview cannot receive the cookie scoped to `chipsandcode.com`; test owners using fresh preview sessions. Existing anonymous sessions remain device-specific; real account sign-in is still separate product work.

## 4. Verify the hosted preview

Run `npm run check`, `npm run test:unit` and `npm run build`; require CI results and inspect visual diffs before merging. Then verify in the hosted browser:

- Home, course navigation, embedded exercises, math, desktop/mobile menus and dark mode.
- Load Xor, edit HDL and tests, change input pins, and switch between HDL, Tests and Output.
- Keyboard navigation and ZIP downloads.
- Create, rename, save and reload an experiment; verify it in the database.
- In a separate session, public sharing works and private reads, updates and deletion are denied, including when that session owns another experiment.
- Return to the owning session and test deletion and listing.
- A production PWA installation can reopen cached lessons and use the simulator offline. API responses and session-specific listings must not enter service-worker caches.

Do not treat unit tests with a mocked database or Cypress's intercepted HTTP responses as proof of live persistence. The local runtime may lack browser infrastructure; record that limit and complete browser verification on Vercel.

The migration changes menus and upgrades Monaco, so review any visual-regression diffs before accepting updated baselines. Do not blanket-update them to hide functional or accessibility failures.

## 5. Cut over production

1. Freeze writes on the old backend. Cloudflare KV is eventually consistent: allow the old KV writes to settle before export, and take a fresh export only after the freeze. Keep the existing site and namespace for rollback.
2. Apply the schema to a fresh production database and import the final export. Verify ownership and complete records. Reconcile counts with the export. Do not reuse a preview database containing test data.
3. Stage and test a production-environment build with the production database, keeping the public domain unassigned.
4. Add `chipsandcode.com` and any existing `www` alias to the Vercel project. Use Vercel's returned DNS instructions; do not guess records or change MX records. Preserve the thesis subdomain.
5. Promote the tested build and switch only the relevant DNS records. Verify TLS, old shared links, and ownership using an existing browser cookie on the original domain.
6. Monitor errors and exercise persistence again before retiring the old deployment.

## Rollback

Before the first Vercel writes, rollback consists of restoring the previous domain routing and unfreezing the old backend. After Vercel has accepted writes, restoring the old KV snapshot would lose those writes. Freeze Vercel writes, preserve a Postgres export, and reconcile new/changed/deleted experiments before routing back. Do not delete either datastore during the rollback window.
