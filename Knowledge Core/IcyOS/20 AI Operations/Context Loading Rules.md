# 🗃️ Context Loading Rules
`Version: 1.1.0` | `Status: Active` | `Scope: AI Operations`

Enforces strict boundaries on how much documentation context is loaded on start to prevent token saturation.

---

## 📐 Loading Rules
- **No Wildcard Reads**: Loading the entire Obsidian vault is forbidden.
- **Selective Directory Slicing**: Only load the specific domain directories matching the [Task Type Classification](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/20%20AI%20Operations/Task%20Type%20Classification.md).
- **Compacted Context Loading**: For general questions, prioritize loading [Compressed Context](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/11%20Memory/Compressed%20Context.md).

---

## 📋 Document Metadata
- **Purpose**: Prevent context window saturation.
- **Version**: 1.1.0

*I build before burning.*
