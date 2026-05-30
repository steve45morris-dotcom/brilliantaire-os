# 🛰️ Platform Output Adapters (Phase 9A)

This document specifies the design, capabilities, and manual execution safety rules for the **Platform Output Adapters** in **Brilliantaire OS**.

---

## 1. Purpose

The **Platform Output Adapters** layer prepares pre-structured campaign posting packages for external social channels (YouTube, TikTok, Instagram, Facebook, WhatsApp) and local Obsidian notes. It translates local campaign blueprints and simulation validations into ready-to-use metadata packages.

---

## 2. Safety Design & The Manual-Only Rule

To maintain absolute system sovereignty and prevent accidental, insecure, or automated publications, the platform adapters layer enforces a strict **Manual-Only** boundary:
1. **No External API Connections:** The layer runs entirely offline. It does not load SDKs for YouTube, TikTok, Meta, or any social platform, nor does it perform network requests to external APIs.
2. **No Automated Uploading/Posting:** No scripts automatically upload files or trigger postings. 
3. **Structured Local Outputs:** The output is written strictly to local Markdown files under the `outputs/platform_adapters/` directory, designed for manual review, copy-paste, and verification.
4. **No Deletions:** Output generation does not delete, wipe, or overwrite existing content packages unless a date-stamped suffix prevents collision.

---

## 3. Supported Platforms

| Platform | Output Folder | Key Content Package Fields |
|---|---|---|
| **YouTube** | `outputs/platform_adapters/youtube/` | Titles, descriptions, pinned comment copy, upload and metadata checklist. |
| **TikTok** | `outputs/platform_adapters/tiktok/` | Five caption options, hook lines, on-screen text, CTA, and audio placement notes. |
| **Instagram** | `outputs/platform_adapters/instagram/` | Reels caption, carousel slides idea catalog, Story interactive text, visual layout notes. |
| **Facebook** | `outputs/platform_adapters/facebook/` | Public page copy, targeted subgroup copy, first comment reply starter, CTA links. |
| **WhatsApp** | `outputs/platform_adapters/whatsapp/` | Announcement text, direct broadcast message copy, short text reminders. |
| **Obsidian** | `outputs/platform_adapters/obsidian/` | Campaign note summary, vault tags, backlink suggestions, and internal wiki linking options. |

---

## 4. Execution Commands

* **Print Help Manual:**
  ```bash
  npm run platform-adapter-help
  ```
* **Generate Platform Package:**
  ```bash
  npm run platform-adapter -- "sporty youtube"
  npm run platform-adapter -- "sporty tiktok"
  npm run platform-adapter -- "sporty instagram"
  npm run platform-adapter -- "sporty facebook"
  npm run platform-adapter -- "sporty whatsapp"
  npm run platform-adapter -- "sporty obsidian"
  ```
* **Generate All Platform Packages:**
  ```bash
  npm run platform-adapter -- "sporty all"
  ```
* **Check Diagnostics Posting Package Status:**
  ```bash
  npm run platform-adapter -- "status sporty"
  ```

---

## 5. Future API Boundary Plan

If automated platform connectors (e.g. YouTube API uploaders, Meta Graph posting endpoints) are designed in future versions, they must be established under a decoupled, separate service package that:
* Resides behind an explicit human confirmation gate.
* Connects through the Safe Command Router only.
* Operates under isolated client keys (preventing credentials leaking into global config profiles).
* Never runs as an automated background loop.
