# Voice Intelligence Upgrades Design

## Objective

Upgrade Voice Vibe so narration is recent, important, non-repetitive, concise,
time-aware, and observable. The existing master mute and mandatory 24-hour age
limit remain authoritative.

## Selected Architecture

Create one Python policy engine that evaluates queue entries before any speech
engine runs. The shell daemon remains responsible for queue movement and process
execution, but it delegates filtering, deduplication, digest construction, quiet
hours, and status telemetry to the policy engine.

This keeps all narration decisions testable without invoking VibeVoice or macOS
audio.

## Upgrade 1: Priority Filter

Only reports matching an allowed priority category may speak:

- blocker or blocked
- error or failure
- verification pass or failure
- deployment
- task completion
- explicit escalation

Routine status, decorative narration, initialization messages, and unclassified
entries are archived as filtered reports. Matching is case-insensitive and uses
bounded keywords to avoid accidental substring matches.

## Upgrade 2: Duplicate Suppression

The policy engine normalizes report text by removing the timestamp, folding case,
and collapsing whitespace. A SHA-256 digest is recorded in a JSON state file with
the narration time.

An identical normalized report cannot speak more than once within 24 hours.
Expired digest records are pruned whenever state is updated. Duplicate reports
are archived with a duplicate reason.

## Upgrade 3: Digest Mode

Eligible reports wait in a digest staging file. The daemon speaks when either:

- three eligible reports are ready, or
- the oldest eligible report has waited five minutes.

The digest contains at most three short report summaries and is limited to a
bounded character length. Critical blockers, errors, and explicit escalations
bypass batching and speak immediately.

## Upgrade 4: Quiet Hours

Quiet hours default to 10:00 PM through 8:00 AM in the computer's local timezone.
During quiet hours, eligible reports are preserved in digest staging but are not
spoken. Critical errors and explicit escalations may bypass quiet hours.

Configuration is stored in `voice.conf`:

```text
VOICE_QUIET_START=22:00
VOICE_QUIET_END=08:00
VOICE_DIGEST_SIZE=3
VOICE_DIGEST_MAX_WAIT_SECONDS=300
VOICE_DUPLICATE_WINDOW_HOURS=24
```

The master OFF, silent, and focus states override all bypasses.

## Upgrade 5: Activity Dashboard

The existing Voice Vibe state JSON gains:

- queue size
- digest staging size
- expired report count
- filtered report count
- duplicate report count
- last spoken report
- last rejection reason
- quiet-hours active state
- next digest readiness reason

The desktop companion displays a compact second status line that reports queue
and policy state without introducing new windows or background narration.

## Data Flow

1. Read the oldest queue entry.
2. Reject entries older than 24 hours or without a valid timestamp.
3. Reject entries outside the allowed priority categories.
4. Reject duplicates from the previous 24 hours.
5. Route critical entries to immediate speech.
6. Route other eligible entries into digest staging.
7. Hold all speech during quiet hours unless a critical bypass applies.
8. Re-check master mute immediately before invoking VibeVoice or `say`.
9. Update status telemetry after every decision.

## Failure Handling

- Invalid configuration falls back to documented defaults.
- Corrupt JSON state is ignored and recreated.
- Failed speech does not mark a report as spoken.
- Reports are archived with their rejection reason instead of deleted.
- The age rule, master mute, and final pre-speech check fail closed.

## Testing

Unit tests cover:

- every priority category and routine rejection
- timestamp boundary at exactly 24 hours
- duplicate normalization and expiry
- digest size and timeout behavior
- quiet hours crossing midnight
- critical bypasses
- corrupt state recovery
- dashboard telemetry fields

A live verification injects expired, routine, duplicate, digest, and critical
test reports while audio is intercepted. The final system state is returned to
OFF/dormant.

## Scope Boundaries

This build does not change VibeVoice model quality, voice presets, external
services, or unrelated Supernova workflows.
