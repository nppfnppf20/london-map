# Beacon Midpoint Algorithm - 26/02/11

## Overview

Two-round algorithm to find fair meeting points using Google Routes transit times.
Located in `backend/src/services/google-routes.ts`.

## Flow

### Round 1 - Probe the centroid (N API calls)

1. Calculate the geographic centroid (average lat/lng of all participants)
2. Get transit travel times from every person to the centroid
3. Identify the person with the longest travel time (most disadvantaged)
4. Shift the center **40%** from the centroid toward that person

### Round 2 - Evaluate candidates (N * 5 API calls)

1. Generate 5 candidate points around the shifted center:
   - The shifted center itself
   - 4 points nudged **25%** from the shifted center toward each person
2. Get transit times from every person to each candidate
3. Also include the original centroid evaluation from round 1 (no extra API calls)

### Strategy selection

From all 6 evaluated points (5 shifted candidates + centroid):

- **Fairest**: the candidate with the lowest maximum travel time (minimises the worst commute)
- **Quickest total**: the candidate with the lowest sum of all travel times

## API call budget

- Round 1: N calls (one per person to centroid)
- Round 2: N * 5 calls (one per person per candidate)
- Total: **N * 6 calls** (e.g. 24 calls for 4 people)

## Key functions

| Function | Purpose |
|---|---|
| `getTransitTravelTime(origin, dest)` | Single Google Routes API call, returns duration in seconds |
| `getTransitTimesForParticipants(people, dest)` | Parallel transit times for all people to one destination |
| `generateCandidates(center, people)` | Creates center + 25%-offset points toward each person |
| `evaluateCandidates(candidates, people)` | Gets transit times and computes totalMinutes, fairnessScore, maxMinutes for each candidate |
| `findBestMidpoints(people)` | Orchestrates round 1 + round 2, returns `{ strategies: { lowestTotal, fairest } }` |

## Scoring metrics per candidate

- `totalMinutes` - sum of all valid travel times
- `maxMinutes` - longest individual travel time
- `fairnessScore` - difference between longest and shortest travel time

## Fallback behaviour

- If a transit time call fails for a person, they get `durationSeconds: -1` (excluded from scoring but still listed)
- If all candidates have zero valid times, returns centroid with `-1` for all travel times
- On the frontend, the midpoint API call is wrapped in a silent try/catch; if it fails entirely, the frontend falls back to the geographic centroid with no strategy toggle

## Frontend integration

- `beaconStore.join()` and `beaconStore.resolve()` call `beaconsApi.midpoint(token)`
- The strategy toggle in `BeaconPanel.svelte` only shows when `strategiesDiffer` is true (the two strategies selected different candidate points)
- `beaconStore.setStrategy()` switches the active midpoint and the map flies to it
