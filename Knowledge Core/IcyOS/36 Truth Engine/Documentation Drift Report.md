# 📝 Documentation Drift Report
\`Status: Active\`

Identifies descriptions in text assets that exceed current typescript executable codes.

---

## 📋 Found Discrepancies

- **ADR-0010 Priority Queue Voice Bus v3**: Claims \`/tmp/voice_bus_queue/\` is operational. However, no UNIX socket code or fs workers exist.
- **Narrator Voice Bridge**: Referenced as verified by a non-existent \`vnp.ts\` file in the main Current State log.
- **Obsidian Gateway**: Described as launching local notes from focus UI panels, while the active connector is a mock structure.

*I build before burning.*
