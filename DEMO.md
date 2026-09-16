# Workable ATS demo (#551)

Short (~60–90s) demo for Algora `/claim #551`.

## Prerequisites

1. Workable account with SPI access token  
   (Settings → Integrations → API Access Token; scopes at least `r_jobs`, `r_candidates`, `r_account`).
2. Note your subdomain: for `https://acme.workable.com` the subdomain is `acme`.
3. Local Revert backend running (`packages/backend`) with migration applied so `TP_ID.workable` exists.
4. A Revert ATS app with `tp_id=workable` and `app_config.subdomain` set (or pass `?subdomain=` on connect).

## Demo script

### 1. Connect Workable (~20s)

Call the ATS OAuth/basic callback with the API token as `code` and subdomain:

```bash
curl -sS "http://localhost:4001/v1/ats/oauth-callback?integrationId=workable&t_id=demo-tenant&code=YOUR_API_TOKEN&subdomain=acme&x_revert_public_token=YOUR_PUBLIC_TOKEN"
```

Show success response / connection created (`tp_customer_id` like `Workable:acme`).

### 2. List jobs (~20s)

```bash
curl -sS -H "x-revert-api-token: YOUR_PRIVATE_TOKEN" \
  -H "x-revert-t-id: demo-tenant" \
  "http://localhost:4001/ats/jobs"
```

Highlight unified job results (`name` from Workable `title`, `status` from `state`).

### 3. Get one job + candidate (~30s)

```bash
# shortcode from list, e.g. GROOV005
curl -sS -H "x-revert-api-token: YOUR_PRIVATE_TOKEN" \
  -H "x-revert-t-id: demo-tenant" \
  "http://localhost:4001/ats/jobs/GROOV005"

curl -sS -H "x-revert-api-token: YOUR_PRIVATE_TOKEN" \
  -H "x-revert-t-id: demo-tenant" \
  "http://localhost:4001/ats/candidates?pageSize=5"
```

Optional: departments + proxy tunnel:

```bash
curl -sS -H "x-revert-api-token: YOUR_PRIVATE_TOKEN" \
  -H "x-revert-t-id: demo-tenant" \
  "http://localhost:4001/ats/departments"

curl -sS -X POST -H "x-revert-api-token: YOUR_PRIVATE_TOKEN" \
  -H "x-revert-t-id: demo-tenant" \
  -H "Content-Type: application/json" \
  -d '{"path":"jobs","method":"GET"}' \
  "http://localhost:4001/ats/proxy"
```

### 4. Close (~10s)

Mention field mappings in `prisma/fields.ts`, acceptance checks:

```bash
node packages/backend/services/ats/run-workable-acceptance.mjs
```

## Recording tips

- Crop secrets; use a sandbox Workable account.
- Keep terminal font large; show subdomain + Bearer flow once.
- Title the video: `Revert Workable ATS (#551) — connect + jobs/candidates`.
