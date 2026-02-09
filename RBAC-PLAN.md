# Role-Based Access & Attribution Plan

## Current State

- Supabase auth is working (sign up, sign in, Google OAuth, JWT verification)
- Backend has `requireAuth` and `optionalAuth` middleware — but only `/profiles/me` uses them
- No `created_by` or `user_id` on any content tables (places, collections, routes, images)
- No permission checks on create/update/delete endpoints
- No role system
- No comments feature
- No friendships or visibility model

---

## 1. Database: Ownership & Visibility

Add to **places**, **collections**, **routes**, **place_images**:

| Column | Type | Description |
|--------|------|-------------|
| `created_by` | uuid (FK → auth.users) | Who created this resource |
| `visibility` | enum: `public`, `private`, `friends`, `friends_of_friends` | Who can see it |

Default visibility could be `public` for backwards compatibility with existing data.

---

## 2. Database: Roles

Add a `role` column to the **profiles** table:

| Value | Permissions |
|-------|-------------|
| `admin` | Full access to everything |
| `curator` | Can publish and edit any public content |
| `user` | Can create content, edit/delete own content |

This is simpler than a separate `user_roles` table and should cover the use case. Can be upgraded later if per-resource roles are needed.

---

## 3. Database: Friendships

New **friendships** table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → auth.users) | Requester |
| `friend_id` | uuid (FK → auth.users) | Recipient |
| `status` | enum: `pending`, `accepted` | |
| `created_at` | timestamptz | |

Unique constraint on `(user_id, friend_id)`. Queries for friends-of-friends join through this table twice.

---

## 4. Database: Comments

New **comments** table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `place_id` | uuid (FK → places) | |
| `user_id` | uuid (FK → auth.users) | Author |
| `body` | text | Comment content |
| `created_at` | timestamptz | |

---

## 5. Backend: Protect Write Endpoints

Apply `requireAuth` middleware to all create/update/delete routes:

- `POST /places` — require auth
- `PUT /places/:id` — require auth + ownership or admin
- `DELETE /places/:id` — require auth + ownership or admin
- `POST /places/:id/images` — require auth
- `DELETE /places/images/:imageId` — require auth + ownership or admin
- `POST /collections` — require auth
- `PUT /collections/:id` — require auth + ownership or admin
- `DELETE /collections/:id` — require auth + ownership or admin
- Same pattern for routes, comments

Read endpoints stay public but filter by visibility.

---

## 6. Backend: Pass User Context to Services

Every create operation needs to save `created_by: req.user.id`. Every update/delete needs to:

1. Fetch the resource
2. Check `created_by === req.user.id` OR `req.user.role === 'admin'`
3. Proceed or return 403

This could be a reusable `requireOwnership(table, idParam)` middleware.

---

## 7. Backend: Visibility Filtering on Reads

When fetching content, apply filters based on the requesting user:

- **No auth**: Only return `visibility = 'public'`
- **Authenticated**: Return resources where:
  - `visibility = 'public'`, OR
  - `created_by = current_user`, OR
  - `visibility = 'friends'` AND creator is a friend, OR
  - `visibility = 'friends_of_friends'` AND creator is within 2 hops

Use `optionalAuth` on read endpoints so unauthenticated users still see public content.

The friends-of-friends query is the most complex part — it requires a subquery or DB function to find users within 2 hops of the friendships table.

---

## 8. Backend: New Endpoints

### Friendships
- `GET /friends` — list friends (accepted)
- `GET /friends/requests` — list pending requests
- `POST /friends/:userId` — send friend request
- `PUT /friends/:friendshipId/accept` — accept request
- `DELETE /friends/:friendshipId` — remove friend or decline request

### Comments
- `GET /places/:id/comments` — list comments for a place
- `POST /places/:id/comments` — add comment (require auth)
- `DELETE /comments/:id` — delete own comment or admin

---

## 9. Frontend: Attribution & Visibility UI

### Content Creation
- Add a visibility picker (public/private/friends/friends of friends) when creating places, collections, routes
- Default to `public`

### Content Display
- Show creator username + avatar on places, images, comments
- Show visibility badge on owned content

### Friend Management
- Friend list view
- Add friend (by username search)
- Pending requests view (accept/decline)

### Comments
- Comment list on PlaceDetail modal (replace "Coming soon" placeholder)
- Add comment input
- Delete own comments

---

## 10. Implementation Order

Suggested sequence, each step building on the previous:

1. **DB migrations** — Add `created_by`, `visibility`, `role` columns; create `friendships` and `comments` tables
2. **Protect write routes** — Add `requireAuth` to all create/update/delete endpoints
3. **Attribution** — Pass `req.user.id` into services, save `created_by` on all content
4. **Ownership checks** — Verify ownership on update/delete, allow admin override
5. **Visibility filtering** — Filter reads by visibility (public-only first, then friends logic)
6. **Comments** — Backend endpoints + frontend UI
7. **Friendships** — Backend endpoints + frontend UI
8. **Friends-of-friends filtering** — The hardest query, do last

---

## Effort Estimates

| Area | Effort |
|------|--------|
| DB migrations (ownership, visibility, friendships, comments) | Small–medium |
| Add `requireAuth` to all write routes | Small |
| Pass `req.user.id` through controllers → services | Small |
| Ownership checks on update/delete | Small |
| Visibility filtering on reads (public/private/own) | Medium |
| Friends-of-friends visibility queries | Medium–large |
| Comments feature (backend + frontend) | Medium |
| Role column + admin checks | Small |
| Frontend UI (visibility picker, attribution, friends) | Medium |
