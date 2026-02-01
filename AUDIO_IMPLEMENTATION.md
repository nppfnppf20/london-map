# Audio Recording + AI Summary Pipeline

This document summarizes the audio recording feature implementation (record -> upload -> transcribe -> summarize -> tags) and the files touched in this repo.

## Overview

Flow:
1. User records audio for a place in the UI.
2. Audio file is uploaded to the backend.
3. Backend uploads to Supabase Storage.
4. Backend transcribes with OpenAI (`gpt-4o-mini-transcribe`).
5. Backend summarizes and suggests tags with OpenAI (`gpt-4o-mini`).
6. Summary is **appended** to `places.description`.
7. Tags are **merged** (lowercase, de-duped).
8. Audio metadata + transcript are stored in `place_audio`.

## Database

Create the audio metadata table in Supabase:

```sql
CREATE TABLE public.place_audio (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  audio_url text NOT NULL,
  transcript text,
  summary text,
  tags text[],
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Supabase Storage

Create a storage bucket:

- `place-audio` (default)

If you use a different bucket name, set `SUPABASE_AUDIO_BUCKET` in your backend environment.

## Environment Variables

Add to `backend/.env`:

```
OPENAI_API_KEY=your_key
SUPABASE_AUDIO_BUCKET=place-audio
```

## Backend (Node/Express)

Key files:
- `backend/src/services/audio.ts`
  - Uploads audio to Supabase Storage.
  - Calls OpenAI transcription (`gpt-4o-mini-transcribe`).
  - Calls OpenAI summarization (`gpt-4o-mini`, JSON schema output).
  - Appends summary to `places.description`, merges tags to `places.tags`.
  - Inserts a row into `place_audio`.

- `backend/src/controllers/audio.ts`
  - `uploadPlaceAudio` controller.

- `backend/src/routes/places.ts`
  - New endpoint: `POST /api/places/:id/audio` (multer upload).

- `backend/src/config/index.ts`
  - Added `OPENAI_API_KEY`, `SUPABASE_AUDIO_BUCKET`.

- `backend/tsconfig.json`
  - Added `"DOM"` lib for `FormData`/`Blob` typing.

Dependencies added to `backend/package.json`:
- `multer`
- `@types/multer`

## Frontend (Svelte)

Key files:
- `frontend/src/lib/components/ui/RecordAudioModal.svelte`
  - Uses `MediaRecorder` to capture audio.
  - Uploads audio to backend.
  - Shows status/errors.

- `frontend/src/lib/components/ui/PlaceDetail.svelte`
  - Added "Record audio" button.

- `frontend/src/lib/services/api.ts`
  - Added `placesApi.uploadAudio` (multipart upload).

- `frontend/src/routes/+page.svelte`
  - Wires in the audio modal.

## Notes

- Audio transcription model: `gpt-4o-mini-transcribe`.
- Summary + tags model: `gpt-4o-mini`.
- Summary is appended to existing description.
- Tags are merged with existing tags.
- Audio file size limit: 25 MB (multer limit).

