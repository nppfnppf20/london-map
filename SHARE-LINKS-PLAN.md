# Secret Share Links Plan

## Context
Users want to share collections (lists of places) with others via a link, without requiring the recipient to log in. This bypasses the normal visibility system — a private collection can be viewed by anyone with the secret link.

## Database

New `share_links` table in Supabase:

```sql
CREATE TABLE share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  resource_type text NOT NULL DEFAULT 'collection' CHECK (resource_type IN ('collection', 'place')),
  resource_id uuid NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_share_links_token ON share_links(token);
```

## Backend Changes

### New files
- `backend/src/services/share-links.ts` — create/validate/delete tokens
- `backend/src/controllers/share-links.ts` — endpoint handlers
- `backend/src/routes/share-links.ts` — route definitions

### Endpoints
- `POST /api/share-links` (requireAuth) — create a share link for a collection
  - Body: `{ resource_type: 'collection', resource_id: string }`
  - Returns: `{ token, url }`
- `GET /api/share-links/:token` (no auth) — resolve token, return the collection + its places
  - Bypasses visibility filter, returns full collection data with nested places
- `DELETE /api/share-links/:id` (requireAuth) — revoke a share link

### Wire into routes
- `backend/src/routes/index.ts` — mount `/share-links`

## Frontend Changes

### New route: `/share/[token]/+page.svelte`
- Fetches `GET /api/share-links/:token`
- Renders a read-only map view showing the shared collection's places
- No auth required, no editing UI
- Back button / "Open in app" link to home

### API addition: `frontend/src/lib/services/api.ts`
- Add `shareLinksApi.resolve(token)` — GET without auth
- Add `shareLinksApi.create(resourceType, resourceId)` — POST with auth

### Share button in UI
- Add a "Share" button in the Lists tab next to each collection the user owns
- On click: calls `shareLinksApi.create('collection', collectionId)`
- Shows the generated link in a small modal/popup with a "Copy" button

## Files to modify
- `backend/src/types/index.ts` — add ShareLink interface
- `backend/src/routes/index.ts` — mount new routes
- `frontend/src/lib/types/index.ts` — add ShareLink type
- `frontend/src/lib/services/api.ts` — add shareLinksApi
- `frontend/src/routes/+page.svelte` — add share button to collection items

## Files to create
- `backend/src/services/share-links.ts`
- `backend/src/controllers/share-links.ts`
- `backend/src/routes/share-links.ts`
- `frontend/src/routes/share/[token]/+page.svelte`

## Verification
1. Log in, create a collection with some places
2. Click share on the collection → get a link
3. Open the link in an incognito window (not logged in) → see the map with the collection's places
4. Delete the share link → incognito link should 404
