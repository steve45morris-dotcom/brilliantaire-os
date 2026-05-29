# 🔒 Voice Confirmation Layer

This document outlines the safety gates, confirmation command line specifications, and pending command lifecycle for voice command management in **Brilliantaire OS**.

---

## 1. Why Confirmation Exists

Executing raw transcribed voice commands automatically on a developer's environment presents significant safety concerns. While low-risk actions (e.g. `show daily brief`, `run audit`) can safely execute, medium-risk commands (e.g. creating files, scanning vaults) and high-risk commands (writing data) must be locked until explicitly confirmed.

The **Voice Confirmation Layer** introduces a manual "Review-and-Release" checkpoint, preventing automatic execution while ensuring developers can release blocked commands hands-free with a manual confirmation flag.

---

## 2. Pending Command Flow

1. **Staging:** A voice command requiring confirmation is written to `voice_queue/pending_confirmation/` as a raw `.txt` transcript file along with a sidecar `.json` metadata file containing its validation status.
2. **Reviewing:** The developer runs `npm run voice-pending` to display the table of active pending files.
3. **Releasing (Confirming):** The developer runs `npm run voice-confirm -- "<pending-id>" --confirm` to execute the mapped router action.
4. **Rejecting (Denying):** The developer runs `npm run voice-deny -- "<pending-id>" --reason "<reason>"` to discard the files.

---

## 3. Allowed CLI Operations

### Listing Pending Commands
```bash
npm run voice-pending
# or using command router:
npm run command -- "voice-pending"
```

### Approving and Executing
To approve a pending action, you MUST explicitly provide the `--confirm` flag:
```bash
npm run voice-confirm -- "test_approve_write_confirm" --confirm
# or using command router:
npm run command -- "voice-confirm test_approve_write_confirm --confirm"
```

### Denying and Discarding
To reject an action and log a reason:
```bash
npm run voice-deny -- "test_scan_obsidian_confirm" --reason "Not required for current workflow"
```

---

## 4. Why Live Microphone Control Should Wait Until This Passes

Live microphone bridge drivers run continuously in the background, making them prone to capturing background conversations or ambient noise that matches normalized mappings (e.g. *"approve write"*).

Without this manual review and release checkpoint, a live bridge could trigger destructive file writes or automated campaigns unintentionally. By establishing this gated queue, we verify the absolute integrity of our routing rules before exposing the OS to continuous audio feeds.
