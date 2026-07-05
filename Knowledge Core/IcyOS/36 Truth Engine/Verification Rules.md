# ⚖️ Verification Rules
\`Status: Active\`

The strict guidelines for verifying capability status labels.

---

## 📋 Mandatory Rules

1. **TypeScript Compile**: Must build typecheck without warnings.
2. **Runtime Import**: Must be reachable from Next.js routes.
3. **No Mocks in Production**: Production execution must not resolve to static mock variables if labeled IMPLEMENTED.

*I build before burning.*
