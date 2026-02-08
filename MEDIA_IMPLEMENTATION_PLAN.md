# Media (Audio + Images) Implementation Plan

## Goals
- Allow users to add audio recordings and images to a site **after the site is saved**.
- Audio playback must work on Safari/iOS.
- Media is **shared across all site members** (not private per-user).
- Store media in Supabase Storage buckets.
- Generate and display image thumbnails.

## Key Decisions
- **Transcoding**: Use backend server (Node/Express) with ffmpeg.
- **Audio format**: Normalize to **AAC in MP4 container** (`.m4a`, `audio/mp4`) for Safari compatibility.
- **Storage visibility**: Buckets can be private; use signed URLs for access (recommended).
- **Images**: Upload original + client-generated thumbnail.

## Storage Layout
Bucket: `<media-bucket>`
- Audio:
  - Raw: `sites/{site_id}/audio/raw/{media_id}.{ext}`
  - Normalized: `sites/{site_id}/audio/normalized/{media_id}.m4a`
- Images:
  - Original: `sites/{site_id}/images/original/{media_id}.jpg`
  - Thumbnail: `sites/{site_id}/images/thumb/{media_id}_thumb.jpg`

## Database Schema
New table: `site_media`
- `id` uuid pk
- `site_id` uuid fk (site)
- `type` text (`audio` | `image`)
- `raw_path` text null (audio only)
- `normalized_path` text null (audio only)
- `thumb_path` text null (image only)
- `mime_type` text
- `size_bytes` int
- `duration_seconds` int null (audio)
- `created_by` uuid
- `created_at` timestamptz
- `caption` text null
- `status` text (`processing` | `ready` | `failed`)
- `error` text null

## Access Control (RLS + Storage Policies)
- **Goal**: Any user with access to a site can view its media.
- RLS:
  - `SELECT`: allowed if user is a member of the site.
  - `INSERT`: allowed if user is a member of the site.
  - `UPDATE/DELETE`: allowed if user is a member of the site (or owner/admin).
- Storage:
  - Read/Write allowed only if user is member of the site referenced by the path.
  - For private bucket, serve via **signed URLs**.

## Backend API Design
### 1) Create media record (before upload)
`POST /api/media`
- Body: `{ site_id, type, mime_type }`
- Response: `{ media_id, upload_paths }`

### 2) Upload file(s) to Storage
Frontend uses Supabase client to upload to provided paths.

### 3) Finalize + start processing
`POST /api/media/{id}/finalize`
- Body: `{ size_bytes, duration_seconds? }`
- Backend:
  - Marks row `processing`
  - If `audio`: runs ffmpeg to normalize raw -> m4a
  - Stores normalized path in `normalized_path`
  - Sets status `ready` or `failed`

### 4) List media for site
`GET /api/sites/{id}/media`
- Returns media list with signed URLs (normalized audio + image thumb/original).

## Audio Normalization (Backend)
- Use `ffmpeg` on the server.
- Example command:
  - `ffmpeg -i <raw> -c:a aac -b:a 128k -ar 44100 <normalized>.m4a`
- Store normalized file in Storage path.
- Update `site_media` row to `ready` and set `normalized_path`.
- If failure, set `status = failed`, store error.

## Frontend Flow
### Audio
1. User opens “Add Site” and saves site first.
2. User records audio (MediaRecorder).
3. App requests `POST /api/media` to get upload path.
4. Upload raw audio to Storage.
5. Call `POST /api/media/{id}/finalize`.
6. UI shows “Processing…” until status is `ready`.
7. Playback uses **normalized** URL only.

### Images
1. User selects images.
2. Generate thumbnail client-side.
3. Upload original + thumbnail to Storage.
4. Create `site_media` rows with `thumb_path`.
5. Display thumbnail in UI; open original on click.

## UI Requirements
- “Add media” section only appears once site is saved.
- Audio:
  - Record button, stop button
  - Processing state
  - Audio player once ready
- Images:
  - Multi-select upload
  - Thumbnail grid
  - Delete media option

## Validation & Limits
- Max audio length: TBD
- Max audio size: TBD
- Max image size: TBD
- Reject unsupported file types.

## Error Handling
- Upload failure: show retry
- Normalize failure: show error + allow retry or delete
- Missing signed URL: refresh media list

## Implementation Steps
1. Create `site_media` table + migrations.
2. Add RLS policies for site membership.
3. Add Storage bucket policies.
4. Backend endpoints:
  - `POST /api/media`
  - `POST /api/media/{id}/finalize`
  - `GET /api/sites/{id}/media`
5. Add ffmpeg integration to backend.
6. Frontend:
  - Audio recorder + processing flow
  - Image upload + thumbnail generation
  - Media list + playback

## Open Questions
- Max audio length and size?
- Max image size?
- Will we allow media delete for all site members or only owners?
- Should we store transcription in the future?
