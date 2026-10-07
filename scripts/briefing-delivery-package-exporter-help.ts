function main() {
  console.log(`
🌌 Sentinel OS: Briefing Delivery Package Exporter (Phase N5N)
=====================================================================
Builds a safe local exporter that packages approved briefing audio, source report metadata, review status, transcript summary, and delivery notes.
Ensures zero auto-distribution (no send, no upload, no publish).

Usage:
  npm run briefing-delivery-package-exporter -- "<command> [arguments]"

Command Menu:
  status                               Show paths, safety flags, and packaging state.
  scan-approved-audio                  List approved briefing audio files available for packaging.
  inspect <AUDIO_ID>                   Inspect metadata, source reports, and package eligibility.
  create-package <AUDIO_ID>            Create a local package folder containing approved audio and metadata.
  package-status <PACKAGE_ID>          Display lifecycle status and manifest information of a package.
  list-packages                        List all generated packages.
  latest                               Show the most recently generated package.
  export-manifest <PACKAGE_ID>         Regenerate or print package manifest.
  verify-package <PACKAGE_ID>          Verify files and SHA256 checksums within a package.
  delivery-summary                     Compile packaging statistics and generate summary report.
  exporter-log                         Display recent exporter log events.

Critical Safety Policy:
  - DO NOT deliver automatically (Auto-send, auto-upload, auto-publish, auto-email are disabled).
  - DO NOT auto-play audio (Auto Playback is disabled).
  - DO NOT modify source reports or delete source audio.
  - Require approved review status before packaging. Unreviewed or rejected audio is blocked.
  - Keep all export actions local, manual-first, auditable, and reversible.
=====================================================================
  `);
}

main();
