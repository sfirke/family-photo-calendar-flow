# Migration Plan: Remove Supabase & Non-NWS Weather Providers (Option B)

## Goals
1. Eliminate Supabase dependency (edge functions + SDK)
2. Rely solely on client-side direct API calls (Notion, ICS, NWS)
3. Remove AccuWeather & OpenWeatherMap providers and related UI/config
4. Simplify weather service to only National Weather Service (NWS)
5. Preserve existing functionality (calendar refresh, caching, offline) with minimal risk

## High-Level Steps
1. Abstract Supabase function invocations behind a new lightweight `remote/notionApiClient.ts`
2. Replace Notion Supabase edge invocation with direct Notion REST API fetches
3. Replace ICS proxy usage (if any) with direct fetch; retain allowlist & error handling inline in `useICalCalendars`
4. Remove unused weather providers (AccuWeather, DirectAccuWeather, OpenWeatherMap) and factory complexity
5. Simplify `weatherProviderFactory` to a single NWS provider or remove factory entirely
6. Drop enhancedWeatherService if now redundant; keep only needed caching in `weatherStorageService` & context
7. Remove Supabase integration folder and dependency from `package.json`
8. Update tests, mocks, and documentation

## Detailed Task Breakdown

### A. Notion Direct Integration
- Create `src/services/notion/notionClient.ts` with:
  - `validateIntegration(token: string, databaseIdOrUrl?: string)`
  - `queryDatabase(token: string, databaseId: string)` with pagination support
  - `extractDatabaseIdFromUrl(url)` (migrate existing logic if present)
- Update `useNotionScrapedCalendars` replacing all `supabase.functions.invoke('notion-api', ...)` with direct calls:
  - Headers: `Authorization: Bearer <token>` & `Notion-Version`
  - Query endpoint: POST `/v1/databases/{id}/query`
  - Validation: GET user + optional DB fetch
- Add lightweight rate limit backoff (e.g., 429 retry with exponential delay up to 3 attempts)
- Add error type narrowing for clearer user toasts
- Tests: Create mock fetch for Notion endpoints.

### B. ICS Direct Fetch
- In `useICalCalendars` confirm existing optional proxy env var; if present remove dependency on Supabase function name.
- Add host allowlist check locally (reuse array from current edge function).
- Implement helper: `fetchICS(url: string)` that enforces https, host allowlist, and size limit (e.g. 1MB) before parsing.
- Provide meaningful error codes (host_not_allowed, invalid_format, fetch_failed).

### C. Weather Simplification
- Remove: `accuWeatherProvider.ts`, `directAccuWeatherProvider.ts`, `openWeatherMapProvider.ts`.
- Remove their exports from `index.ts`, registration in `weatherProviderFactory.ts`.
- Delete factory or reduce to a constant `nwsProvider` function:
  - Option: Replace `weatherProviderFactory.getProviderWithFallback` usages with direct NWS provider calls.
- Remove `EnhancedWeatherService` if only layering providers; otherwise strip provider-selection logic.
- Update UI components (`WeatherConnectionTest`, settings panes) to remove provider selector and API key fields tied to removed providers.
- Remove related settings keys (apiKey, zipCode if not used for NWS). Keep coordinates & manual location toggle.
- Update storage cleanup removing unused weather keys.
- Remove weather test utilities referencing removed providers.

### D. Supabase Removal
- Remove folder `src/integrations/supabase` & `types/deno-edge.d.ts` reference portions.
- Remove supabase Edge functions folder from repo (or move to `/archive/` if you want history).
- Remove `@supabase/supabase-js` from `package.json` deps.
- Global search & delete `supabase.functions.invoke` usages (ensure zero remain).
- Adjust any TypeScript path references.

### E. Configuration & Env Cleanup
- Remove Supabase env variables (if any) from deployment/CI.
- Remove weather API key env docs.
- Document new required manual coordinates for NWS (or auto-detect if you have geolocation).

### F. Testing & Validation
- Update mocks: Remove supabase mock server endpoints; add fetch mocks for Notion & ICS.
- Add tests:
  - Notion pagination & error mapping
  - ICS fetch host allowlist rejection
  - Weather service returns data with only NWS
  - Removal: ensure no import of removed modules (optional lint script)
- CI: run `grep -R "supabase" src || true` expect no matches (except maybe README history section)

### G. Documentation
- README: Update architecture diagram, remove Supabase setup instructions.
- CHANGELOG: Add breaking changes note (removed provider options, API key fields).
- Migration notes file for existing users (explain loss of historical AccuWeather extended forecast length if applicable).

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Loss of 15-30 day forecast (AccuWeather) | Users expecting longer forecast lose feature | Communicate change; optionally implement alternative free long-range source later |
| Notion rate limits hit | Sync failures | Add retry/backoff & caching local timestamps |
| ICS host blocking direct fetch (CORS) | Calendar import fails | Provide optional user-configurable proxy URL; detect CORS error and surface guidance |
| Hidden dependency on provider selection UI | Build/runtime error | Grep & run type check after removal before commit |

## Sequencing (Incremental PRs)
1. Introduce Notion direct client + switch (keep Supabase for fallback) (Feature flag)
2. Remove Supabase usage from Notion hook & ICS; add ICS helper
3. Simplify weather (NWS only) & prune providers
4. Remove Supabase integration code & dependency
5. Cleanup settings/UI/tests & docs

## Feature Flags / Safe Toggles
- `VITE_NOTION_DIRECT=1` to enable new Notion client initially.
- `VITE_ICS_ALLOWLIST_OVERRIDE` (optional) for debugging.

## Success Criteria
- `grep -R "supabase" src` returns no functional code references
- Tests all green
- Weather UI works with only coordinates input
- Notion sync & validate flows unchanged functionally
- ICS imports still succeed / proper errors surfaced

---
Prepared plan to guide implementation. Execute steps sequentially for low-risk migration.
